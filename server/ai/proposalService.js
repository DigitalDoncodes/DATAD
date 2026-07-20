/**
 * Lifecycle for proposed writes: propose -> confirm/reject -> (undo).
 *
 * Every function is scoped by userId at the query level, so a proposal id
 * belonging to another student simply misses and 404s rather than leaking that
 * it exists.
 */

const mongoose = require('mongoose');
const ProposedAction = require('../models/ProposedAction');
const { validateAction, executeAction, undoAction } = require('./tools/writes');

// An unanswered proposal goes stale: the advice that produced it was based on
// the student's state at that moment.
const PROPOSAL_TTL_MS = 60 * 60 * 1000;      // 1 hour to answer
const UNDO_WINDOW_MS = 10 * 60 * 1000;       // 10 minutes to reverse

class NotFoundError extends Error {
  constructor(msg) { super(msg); this.name = 'NotFoundError'; this.statusCode = 404; }
}
class ValidationError extends Error {
  constructor(msg) { super(msg); this.name = 'ValidationError'; this.statusCode = 422; }
}

// An unparseable id is "no such proposal", not a server error — without this
// Mongoose raises a CastError and the route answers 500.
function assertId(id) {
  if (!mongoose.isValidObjectId(id)) throw new NotFoundError('Proposal not found');
  return id;
}

/**
 * Validates a set of requested writes and records them as a pending proposal.
 * Writes nothing to the underlying records.
 *
 * Partial rejection is intentional: if the model requests three changes and one
 * is malformed, the two valid ones still become a card, and the invalid one is
 * reported back so the model can tell the student what it could not do. An
 * all-or-nothing rule would let one bad argument discard sound work.
 *
 * @returns {Promise<{proposal, rejected: Array<{tool, error}>}>}
 */
async function propose(userId, conversationId, requested) {
  if (!Array.isArray(requested) || !requested.length) {
    throw new ValidationError('No actions to propose');
  }
  if (requested.length > 10) throw new ValidationError('Too many actions in one proposal (max 10)');

  const actions = [];
  const rejected = [];

  for (const req of requested) {
    const result = await validateAction(req.tool, req.args, userId);
    if (result.error) {
      rejected.push({ tool: req.tool, error: result.error });
      continue;
    }
    actions.push({
      tool: req.tool,
      args: result.args,
      summary: result.summary,
      doneSummary: result.doneSummary || '',
      targetId: result.targetId || null,
      status: 'pending',
    });
  }

  if (!actions.length) {
    // Nothing survived validation — no card, and the caller reports the reasons
    // to the model rather than showing the student an empty proposal.
    return { proposal: null, rejected };
  }

  const proposal = await ProposedAction.create({
    user: userId,
    conversation: conversationId || null,
    actions,
    status: 'pending',
    expiresAt: new Date(Date.now() + PROPOSAL_TTL_MS),
  });

  return { proposal: proposal.toObject(), rejected };
}

async function get(userId, proposalId) {
  assertId(proposalId);
  const proposal = await ProposedAction.findOne({ _id: proposalId, user: userId }).lean();
  if (!proposal) throw new NotFoundError('Proposal not found');
  return proposal;
}

/**
 * Executes a confirmed proposal.
 *
 * Idempotent and race-safe. The pending -> confirming transition is a
 * findOneAndUpdate on status, so of two concurrent confirms (a double-click, a
 * retried request) exactly one proceeds to execute; the other observes a
 * non-pending status and returns the current state without writing again.
 */
async function confirm(userId, proposalId) {
  assertId(proposalId);
  const claimed = await ProposedAction.findOneAndUpdate(
    { _id: proposalId, user: userId, status: 'pending' },
    { $set: { status: 'confirming' } },
    { new: true }
  );

  if (!claimed) {
    // Either it does not exist, or it was already answered. Distinguish the two
    // so a double-click reports the real outcome instead of a bare 404.
    const existing = await ProposedAction.findOne({ _id: proposalId, user: userId }).lean();
    if (!existing) throw new NotFoundError('Proposal not found');
    return { proposal: existing, alreadyResolved: true };
  }

  if (claimed.expiresAt.getTime() < Date.now()) {
    claimed.status = 'expired';
    await claimed.save();
    throw new ValidationError('This suggestion has expired. Ask Dax again.');
  }

  let succeeded = 0;
  for (const action of claimed.actions) {
    try {
      const { resultId, priorState } = await executeAction(action, userId);
      action.resultId = resultId || null;
      action.priorState = priorState || null;
      action.status = 'executed';
      succeeded++;
    } catch (err) {
      // One failure does not abort the rest: the student confirmed each line on
      // the card, and silently dropping the remainder because an unrelated task
      // was deleted elsewhere would be worse than a partial result they can see.
      action.status = 'failed';
      action.error = err.message;
      console.warn(`[proposals] action ${action.tool} failed: ${err.message}`);
    }
  }

  claimed.status = succeeded === claimed.actions.length ? 'executed' : (succeeded ? 'partial' : 'rejected');
  claimed.executedAt = new Date();
  claimed.undoableUntil = succeeded ? new Date(Date.now() + UNDO_WINDOW_MS) : null;
  await claimed.save();

  return { proposal: claimed.toObject(), alreadyResolved: false };
}

async function reject(userId, proposalId) {
  assertId(proposalId);
  const proposal = await ProposedAction.findOneAndUpdate(
    { _id: proposalId, user: userId, status: 'pending' },
    { $set: { status: 'rejected' } },
    { new: true, lean: true }
  );
  if (!proposal) {
    const existing = await ProposedAction.findOne({ _id: proposalId, user: userId }).lean();
    if (!existing) throw new NotFoundError('Proposal not found');
    return { proposal: existing, alreadyResolved: true };
  }
  return { proposal, alreadyResolved: false };
}

/**
 * Reverses an executed proposal within its undo window.
 * Only actions that actually executed are reversed.
 */
async function undo(userId, proposalId) {
  assertId(proposalId);
  const proposal = await ProposedAction.findOne({
    _id: proposalId,
    user: userId,
    status: { $in: ['executed', 'partial'] },
  });
  if (!proposal) throw new NotFoundError('Nothing to undo');

  if (!proposal.undoableUntil || proposal.undoableUntil.getTime() < Date.now()) {
    throw new ValidationError('The undo window for this change has passed.');
  }

  for (const action of proposal.actions) {
    if (action.status !== 'executed') continue;
    try {
      await undoAction(action, userId);
      action.status = 'undone';
    } catch (err) {
      action.error = `Undo failed: ${err.message}`;
      console.warn(`[proposals] undo of ${action.tool} failed: ${err.message}`);
    }
  }

  proposal.status = 'undone';
  proposal.undoableUntil = null;
  await proposal.save();
  return { proposal: proposal.toObject() };
}

/** Live cards for a conversation, so reopening a thread restores its pending proposals. */
async function listPending(userId, conversationId) {
  const proposals = await ProposedAction.find({
    user: userId,
    ...(conversationId ? { conversation: conversationId } : {}),
    status: 'pending',
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 }).limit(20).lean();
  return { proposals };
}

module.exports = {
  propose,
  get,
  confirm,
  reject,
  undo,
  listPending,
  NotFoundError,
  ValidationError,
  PROPOSAL_TTL_MS,
  UNDO_WINDOW_MS,
};

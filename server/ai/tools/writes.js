/**
 * Write actions — validation, execution, and undo.
 *
 * Split into three phases deliberately:
 *
 *   validate()  at propose time. Catches malformed model output before a card
 *               is ever shown. The default chat model has been observed sending
 *               booleans as strings and duplicating calls, so nothing reaches
 *               a student without passing through here first.
 *   execute()   at confirm time, after a human click. Captures priorState as it
 *               goes so the change can be reversed.
 *   undo()      restores priorState within the undo window.
 *
 * Nothing here is reachable from the model directly — daxService proposes,
 * proposalService executes. See models/ProposedAction.js for why.
 */

const Task = require('../../models/Task');

const TASK_TYPES = ['case-study', 'deadline', 'interview-prep', 'exam', 'other'];
const MAX_FUTURE_DAYS = 365 * 2;

// ── Argument coercion ───────────────────────────────────────────────────────

/**
 * Parses a model-supplied date. Accepts ISO (YYYY-MM-DD) and full ISO
 * timestamps only — deliberately not "next Thursday". Small models are
 * unreliable at date arithmetic, and a silently wrong due date is worse than a
 * refusal the model can retry, so relative expressions are rejected with a
 * message telling it to compute the calendar date (today's date is already in
 * its system prompt).
 */
function parseDate(value) {
  if (!value || typeof value !== 'string') return { error: 'A due date is required, as YYYY-MM-DD.' };
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}([T ].*)?$/.test(trimmed)) {
    return { error: `Could not read "${value}" as a date. Use the calendar date in YYYY-MM-DD form.` };
  }
  const d = new Date(trimmed.length === 10 ? `${trimmed}T12:00:00.000Z` : trimmed);
  if (Number.isNaN(d.getTime())) return { error: `"${value}" is not a real date.` };

  const daysOut = (d.getTime() - Date.now()) / 86400000;
  if (daysOut > MAX_FUTURE_DAYS) return { error: 'That date is more than two years away — check it.' };

  // Reject dates already past. Models get the year wrong surprisingly often —
  // asked to schedule "August 15th" in 2026, llama-3.3-70b answered 2024-08-15,
  // and without this the student would have been shown a confirmation card for
  // a deadline two years behind them. Yesterday is allowed so a timezone
  // difference between server and student never rejects "today".
  if (daysOut < -1) {
    return { error: `${fmtDate(d)} is in the past. Use the correct year — check today's date before answering.` };
  }
  return { value: d };
}

function cleanString(v, max) {
  if (typeof v !== 'string') return '';
  return v.replace(/\s+/g, ' ').trim().slice(0, max);
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * Resolves a task the student referred to by title.
 *
 * The read tool (list_my_tasks) intentionally does not expose ObjectIds — small
 * models mangle and hallucinate long opaque ids, and an id that resolves to the
 * wrong task is a silent mis-write. Matching on title keeps the model working
 * in the same vocabulary it was given, and ambiguity is surfaced as an error
 * rather than guessed at.
 */
async function resolveTaskByTitle(title, userId) {
  const needle = cleanString(title, 200);
  if (!needle) return { error: 'Which task? Give its title.' };

  const owned = { $or: [{ assignee: userId }, { createdBy: userId }] };
  const safe = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let matches = await Task.find({ ...owned, title: new RegExp(`^${safe}$`, 'i') }).limit(5).lean();
  if (!matches.length) {
    matches = await Task.find({ ...owned, title: new RegExp(safe, 'i') }).limit(5).lean();
  }

  if (!matches.length) return { error: `No task matching "${needle}".` };
  if (matches.length > 1) {
    return { error: `"${needle}" matches ${matches.length} tasks: ${matches.map((t) => t.title).join('; ')}. Be more specific.` };
  }
  return { task: matches[0] };
}

// ── Validators ──────────────────────────────────────────────────────────────
// Each returns { args, summary, targetId } or { error }. `summary` is the line
// rendered on the confirm card — built here from validated values, never taken
// from the model, so the card states what will actually happen.

const VALIDATORS = {
  async create_task(raw, userId) {
    const title = cleanString(raw.title, 200);
    if (!title) return { error: 'A task needs a title.' };

    // dueDate is required by the Task schema, so a proposal without one would
    // fail at execution — after the student had already confirmed it.
    const due = parseDate(raw.dueDate);
    if (due.error) return { error: due.error };

    const type = TASK_TYPES.includes(raw.type) ? raw.type : 'other';
    const description = cleanString(raw.description, 2000);

    return {
      args: { title, dueDate: due.value, type, description },
      summary: `Create task "${title}" due ${fmtDate(due.value)}`,
      // Past-tense wording for after it has actually happened. Kept beside the
      // proposal wording so the card can state the outcome plainly rather than
      // leaving the student to infer success from a status label.
      doneSummary: `Added "${title}" to your planner, due ${fmtDate(due.value)}`,
    };
  },

  async reschedule_task(raw, userId) {
    const found = await resolveTaskByTitle(raw.title, userId);
    if (found.error) return { error: found.error };

    const due = parseDate(raw.dueDate);
    if (due.error) return { error: due.error };

    const wasDue = found.task.dueDate ? fmtDate(found.task.dueDate) : 'no date';
    if (found.task.dueDate && fmtDate(found.task.dueDate) === fmtDate(due.value)) {
      return { error: `"${found.task.title}" is already due ${wasDue}.` };
    }

    return {
      args: { dueDate: due.value },
      targetId: found.task._id,
      summary: `Move "${found.task.title}" from ${wasDue} to ${fmtDate(due.value)}`,
      doneSummary: `"${found.task.title}" is now scheduled for ${fmtDate(due.value)}`,
    };
  },

  async complete_task(raw, userId) {
    const found = await resolveTaskByTitle(raw.title, userId);
    if (found.error) return { error: found.error };
    if (found.task.status === 'done') return { error: `"${found.task.title}" is already done.` };

    return {
      args: {},
      targetId: found.task._id,
      summary: `Mark "${found.task.title}" as done`,
      doneSummary: `"${found.task.title}" marked done`,
    };
  },
};

// ── Executors ───────────────────────────────────────────────────────────────
// Run only after a human click. Every query is re-scoped by userId — the
// proposal is not treated as proof of ownership, because the target could have
// been deleted or reassigned between proposal and confirmation.

const EXECUTORS = {
  async create_task(action, userId) {
    const doc = await Task.create({
      ...action.args,
      createdBy: userId,
      assignee: userId,
      status: 'pending',
    });
    return { resultId: doc._id, priorState: null };
  },

  async reschedule_task(action, userId) {
    const owned = { _id: action.targetId, $or: [{ assignee: userId }, { createdBy: userId }] };
    const before = await Task.findOne(owned).lean();
    if (!before) throw new Error('That task no longer exists.');

    await Task.updateOne(owned, { $set: { dueDate: action.args.dueDate } });
    return { resultId: before._id, priorState: { dueDate: before.dueDate } };
  },

  async complete_task(action, userId) {
    const owned = { _id: action.targetId, $or: [{ assignee: userId }, { createdBy: userId }] };
    const before = await Task.findOne(owned).lean();
    if (!before) throw new Error('That task no longer exists.');

    await Task.updateOne(owned, { $set: { status: 'done' } });
    return { resultId: before._id, priorState: { status: before.status } };
  },
};

// ── Undo ────────────────────────────────────────────────────────────────────

const UNDOERS = {
  async create_task(action, userId) {
    // Only remove a task this proposal created, and only if the student has not
    // since edited it into something they want to keep.
    await Task.deleteOne({ _id: action.resultId, createdBy: userId });
  },
  async reschedule_task(action, userId) {
    await Task.updateOne(
      { _id: action.resultId, $or: [{ assignee: userId }, { createdBy: userId }] },
      { $set: { dueDate: action.priorState?.dueDate } }
    );
  },
  async complete_task(action, userId) {
    await Task.updateOne(
      { _id: action.resultId, $or: [{ assignee: userId }, { createdBy: userId }] },
      { $set: { status: action.priorState?.status || 'pending' } }
    );
  },
};

async function validateAction(tool, rawArgs, userId) {
  const validator = VALIDATORS[tool];
  if (!validator) return { error: `Unknown write action: ${tool}` };
  try {
    return await validator(rawArgs || {}, userId);
  } catch (err) {
    console.warn(`[writes] validation of ${tool} failed: ${err.message}`);
    return { error: `Could not prepare that change.` };
  }
}

async function executeAction(action, userId) {
  const executor = EXECUTORS[action.tool];
  if (!executor) throw new Error(`Unknown write action: ${action.tool}`);
  return executor(action, userId);
}

async function undoAction(action, userId) {
  const undoer = UNDOERS[action.tool];
  if (!undoer) throw new Error(`Cannot undo: ${action.tool}`);
  return undoer(action, userId);
}

module.exports = { validateAction, executeAction, undoAction, TASK_TYPES };

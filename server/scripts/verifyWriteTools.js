#!/usr/bin/env node
/**
 * End-to-end check of the confirmed-write path.
 *
 * Seeds a throwaway user, drives a real model turn through the chat tool loop,
 * and asserts the safety properties that make writes shippable:
 *   - the model's write call produces a proposal, not a mutation
 *   - confirming executes it exactly once
 *   - undo restores the prior state
 *   - a weak model is never offered write tools in the first place
 *
 * Cleans up after itself. Read-only against existing data.
 *
 *   node server/scripts/verifyWriteTools.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// Tried in order. Being listed in NVIDIA's /v1/models catalogue does not mean a
// model is actually servable — llama-3.1-nemotron-70b-instruct is listed and
// 404s on inference — and the free tier returns ResourceExhausted on the
// popular ones at random. Each of these was verified to emit a correct
// reschedule_task call; the run uses whichever answers first.
const WRITE_MODEL_CANDIDATES = process.env.DAX_TEST_WRITE_MODEL
  ? [process.env.DAX_TEST_WRITE_MODEL]
  : [
      'nvidia/llama-3.3-nemotron-super-49b-v1.5',
      'qwen/qwen3-next-80b-a3b-instruct',
      'z-ai/glm-5.2',
      'nvidia/nemotron-3-super-120b-a12b',
    ];
const WEAK_MODEL = 'meta/llama-3.1-8b-instruct';

const pass = [];
const fail = [];
const check = (name, ok, detail = '') => (ok ? pass : fail).push(detail ? `${name} — ${detail}` : name);

async function main() {
  if (!process.env.MONGODB_URI) { console.error('MONGODB_URI not set.'); process.exit(2); }
  await mongoose.connect(process.env.MONGODB_URI);

  const Task = require('../models/Task');
  const ProposedAction = require('../models/ProposedAction');
  const aiGateway = require('../ai/aiGateway');
  const proposalService = require('../ai/proposalService');
  const { TOOL_DEFINITIONS, WRITE_TOOL_DEFINITIONS, supportsWriteTools } = require('../ai/tools');

  const uid = new mongoose.Types.ObjectId();

  try {
    // ── Capability gate ──────────────────────────────────────────────────────
    check('weak model is refused write tools', supportsWriteTools(WEAK_MODEL) === false,
      `${WEAK_MODEL} -> ${supportsWriteTools(WEAK_MODEL)}`);
    check('capable models are offered write tools',
      WRITE_MODEL_CANDIDATES.every((m) => supportsWriteTools(m)),
      WRITE_MODEL_CANDIDATES.filter((m) => !supportsWriteTools(m)).join(', ') || 'all');

    await Task.create({
      title: 'Mock interview with mentor', createdBy: uid, assignee: uid,
      status: 'pending', type: 'interview-prep', dueDate: new Date('2026-07-22'),
    });

    // ── A real model turn that should propose a write ────────────────────────
    const before = await Task.countDocuments({ createdBy: uid });
    const proposals = [];
    let reply = '';
    let usedModel = null;
    let lastError = null;

    for (const model of WRITE_MODEL_CANDIDATES) {
      proposals.length = 0;
      reply = '';
      try {
        for await (const delta of aiGateway.processStream({
          messages: [{ role: 'user', content: 'Push my mock interview with mentor to 2026-08-15 please.' }],
          system:
            "You are Dax, a student assistant. Today is 2026-07-20. Use your tools on the student's real data. " +
            'Proposed changes require the student to confirm — never claim a change is already done.',
          provider: 'nvidia',
          model,
          maxTokens: 400,
          task: 'chat',
          userId: uid,
          tools: [...TOOL_DEFINITIONS, ...WRITE_TOOL_DEFINITIONS],
          onProposal: (p) => proposals.push(p),
        })) reply += delta;
        usedModel = model;
        break;
      } catch (err) {
        // 404 (listed but not servable) and ResourceExhausted (free-tier
        // capacity) are both transient facts about the account, not failures of
        // the code under test — move to the next candidate.
        lastError = err.message;
        console.log(`  (${model} unavailable: ${String(err.message).slice(0, 60)})`);
      }
    }

    check('a write-capable model was reachable', Boolean(usedModel), usedModel || lastError || 'all candidates failed');

    if (usedModel) {
      console.log(`\nModel: ${usedModel}`);
      console.log(`Dax: ${reply.trim()}\n`);

      const after = await Task.countDocuments({ createdBy: uid });
      check('proposing did not mutate anything', before === after, `${before} -> ${after} tasks`);
      check('a proposal was raised', proposals.length > 0, `${proposals.length} proposal(s)`);
    }

    if (usedModel && proposals.length) {
      const p = proposals[0];
      console.log('Card:');
      p.actions.forEach((a) => console.log(`  • ${a.summary}`));

      check('card lines are populated', p.actions.every((a) => a.summary));

      // ── Confirm ────────────────────────────────────────────────────────────
      await proposalService.confirm(uid, String(p._id));
      const moved = await Task.findOne({ createdBy: uid, title: /mock interview/i }).lean();
      const movedTo = moved?.dueDate?.toISOString().slice(0, 10);
      check('confirm applied the change', movedTo === '2026-08-15', `due ${movedTo}`);

      // ── Undo ───────────────────────────────────────────────────────────────
      await proposalService.undo(uid, String(p._id));
      const restored = await Task.findOne({ createdBy: uid, title: /mock interview/i }).lean();
      const restoredTo = restored?.dueDate?.toISOString().slice(0, 10);
      check('undo restored the prior date', restoredTo === '2026-07-22', `due ${restoredTo}`);
    }
  } finally {
    await Task.deleteMany({ createdBy: uid });
    await ProposedAction.deleteMany({ user: uid });
  }

  console.log('');
  pass.forEach((p) => console.log(`  PASS  ${p}`));
  fail.forEach((f) => console.log(`  FAIL  ${f}`));
  console.log(`\n${pass.length} passed, ${fail.length} failed\n`);

  await mongoose.disconnect();
  process.exit(fail.length ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

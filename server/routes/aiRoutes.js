const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const checkTier   = require('../middleware/checkTier');
const checkRole   = require('../middleware/checkRole');
const aiQuota     = require('../middleware/aiQuota');
const { generalLimiter } = require('../middleware/rateLimiters');
const Note    = require('../models/Note');
const Resume  = require('../models/Resume');
const Company = require('../models/Company');
const { runPipeline } = require('../ai/agents/pipeline');
const { buildResumeRAGContext, buildPlannerRAGContext, buildCareerHubRAGContext } = require('../ai/retriever');
const { getUserMemory, formatMemoryContext, appendTopic } = require('../ai/memory');
const { search } = require('../ai/embeddings/semanticSearch');
const { upsertEmbedding } = require('../ai/embeddings/vectorStore');

router.use(verifyToken);
router.use(generalLimiter);

// ── Summarise Note ────────────────────────────────────────────────────────

router.post('/summarise/:noteId', checkTier('trial'), aiQuota, async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.noteId).lean();
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (!note.content?.trim()) return res.status(422).json({ message: 'Note has no content to summarise' });

    const mem = await getUserMemory(req.user.userId);

    const { result, meta } = await runPipeline({
      task: 'summarise-note',
      systemPrompt: 'You are a study assistant. Be concise, precise, and practically useful for a student preparing for placements and exams.',
      userPrompt: `Summarise the following note in three parts:\n1. A 2-3 sentence executive summary.\n2. Five bullet-point key takeaways (each ≤ 15 words).\n3. Relevant business frameworks or concepts mentioned (comma-separated, max 5).\n\nNote title: ${note.title}\nSubject: ${note.subject}\nContent:\n${note.content}\n\nReply in this exact JSON format:\n{"summary":"…","keyPoints":["…","…","…","…","…"],"frameworks":"…"}`,
      memoryContext: formatMemoryContext(mem),
      json: true,
    });

    // Index for semantic search (fire and forget)
    upsertEmbedding({
      collection: 'notes',
      docId: note._id,
      text: `${note.title} ${note.subject} ${note.content}`.slice(0, 4000),
      metadata: { title: note.title, subject: note.subject },
    }).catch(() => {});

    appendTopic(req.user.userId, note.subject || note.title).catch(() => {});
    res.json({ ...result, _meta: { provider: meta.provider, model: meta.model, confidence: meta.confidence } });
  } catch (err) {
    if (err.message === 'AI not configured') return res.status(503).json({ message: 'AI features are not enabled on this server' });
    next(err);
  }
});

// ── Review Resume (RAG-enhanced) ──────────────────────────────────────────

router.post('/review-resume', checkTier('trial'), aiQuota, async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ user: req.user.userId }).lean();
    if (!resume) return res.status(404).json({ message: 'No resume found — build one first' });

    const [ragCtx, mem] = await Promise.all([
      buildResumeRAGContext(req.user.userId),
      getUserMemory(req.user.userId),
    ]);

    const p = resume.personal || {};
    const resumeLines = [
      `Name: ${p.fullName || '(blank)'}`,
      `Summary: ${resume.summary || '(none)'}`,
      `Education: ${(resume.education || []).map((e) => `${e.degree} @ ${e.institution}`).join('; ') || '(none)'}`,
      `Experience: ${(resume.experience || []).map((e) => `${e.role} @ ${e.organization} (${e.duration})`).join('; ') || '(none)'}`,
      `Projects: ${(resume.projects || []).map((e) => e.title).join(', ') || '(none)'}`,
      `Skills: ${(resume.skills || []).join(', ') || '(none)'}`,
      `Achievements: ${(resume.achievements || []).join('; ') || '(none)'}`,
    ].join('\n');

    const { result, meta } = await runPipeline({
      task: 'review-resume',
      systemPrompt: 'You are a senior career counsellor specialising in placement preparation. Be direct, specific, and actionable. Never generic.',
      userPrompt: `Review this resume for placement readiness. Give exactly 3 improvements, each tied to a specific gap you can see.\n\n${resumeLines}\n\nReply in this exact JSON format:\n{"overallImpression":"one sentence","improvements":[{"area":"…","issue":"specific problem","fix":"concrete action ≤ 20 words"},{"area":"…","issue":"…","fix":"…"},{"area":"…","issue":"…","fix":"…"}]}`,
      ragContext: ragCtx.contextText,
      memoryContext: formatMemoryContext(mem),
      sourceCount: Object.values(ragCtx.sources).filter(Boolean).length,
      json: true,
    });

    appendTopic(req.user.userId, 'resume review').catch(() => {});
    res.json({ ...result, _meta: { provider: meta.provider, model: meta.model, confidence: meta.confidence } });
  } catch (err) {
    if (err.message === 'AI not configured') return res.status(503).json({ message: 'AI features are not enabled on this server' });
    next(err);
  }
});

// ── Case Framework (admin helper) ─────────────────────────────────────────

// Admin authoring tool (AdminCasesPage) — never exposed to students, so it
// must not be open for any logged-in user to burn AI credits on.
router.post('/case-framework', checkRole('admin'), async (req, res, next) => {
  try {
    const { title, category, scenario, question } = req.body;
    const { result, meta } = await runPipeline({
      task: 'case-framework',
      systemPrompt: 'You are a case interview coach. Write clear, structured frameworks for students.',
      userPrompt: `Generate a concise suggested framework (3-5 bullet points, ≤ 200 words total) for this daily case.\n\nCategory: ${category}\nTitle: ${title}\nScenario: ${scenario}\nQuestion: ${question}\n\nReply with plain text only — no JSON, no markdown headers.`,
      json: false,
    });
    res.json({ framework: result, _meta: { provider: meta.provider, model: meta.model } });
  } catch (err) {
    if (err.message === 'AI not configured') return res.status(503).json({ message: 'AI features are not enabled on this server' });
    next(err);
  }
});

// ── Planner AI Suggestions (RAG-enhanced) ────────────────────────────────

router.post('/planner-suggest', checkTier('trial'), aiQuota, async (req, res, next) => {
  try {
    const [ragCtx, mem] = await Promise.all([
      buildPlannerRAGContext(req.user.userId),
      getUserMemory(req.user.userId),
    ]);

    const { result, meta } = await runPipeline({
      task: 'planner-suggest',
      systemPrompt: 'You are a placement advisor. Help prioritize tasks and study plans for students targeting campus placements.',
      userPrompt: `Based on this student's current tasks and notes, suggest 3 priority actions for today.\n\nReturn JSON:\n{"priorities":["action 1","action 2","action 3"],"focusArea":"one sentence","motivationalNote":"one sentence"}`,
      ragContext: ragCtx.contextText,
      memoryContext: formatMemoryContext(mem),
      sourceCount: Object.values(ragCtx.sources).filter(Boolean).length,
      json: true,
    });

    appendTopic(req.user.userId, 'planner suggestions').catch(() => {});
    res.json({ ...result, _meta: { provider: meta.provider, confidence: meta.confidence } });
  } catch (err) {
    if (err.message === 'AI not configured') return res.status(503).json({ message: 'AI features are not enabled on this server' });
    next(err);
  }
});

// ── Career Hub Company Advice (RAG-enhanced) ──────────────────────────────

router.post('/career-advice', checkTier('max'), aiQuota, async (req, res, next) => {
  try {
    const { companyId, question } = req.body;
    const [ragCtx, mem] = await Promise.all([
      buildCareerHubRAGContext(req.user.userId, companyId),
      getUserMemory(req.user.userId),
    ]);

    const { result, meta } = await runPipeline({
      task: 'career-advice',
      systemPrompt: 'You are an expert placement advisor with deep knowledge of campus recruitment. Give personalized, specific advice based on the student profile and company data provided.',
      userPrompt: `Student question: ${question || 'How should I prepare for this company?'}\n\nReturn JSON:\n{"answer":"detailed 3-4 sentence answer","actionItems":["item 1","item 2","item 3"],"keyFocus":"one sentence on where to concentrate effort"}`,
      ragContext: ragCtx.contextText,
      memoryContext: formatMemoryContext(mem),
      sourceCount: Object.values(ragCtx.sources).filter(Boolean).length,
      json: true,
    });

    appendTopic(req.user.userId, `career advice`).catch(() => {});
    res.json({ ...result, _meta: { provider: meta.provider, confidence: meta.confidence } });
  } catch (err) {
    if (err.message === 'AI not configured') return res.status(503).json({ message: 'AI features are not enabled on this server' });
    next(err);
  }
});

// ── Interview Simulator (Max) ─────────────────────────────────────────────

router.post('/interview-simulator', checkTier('max'), aiQuota, async (req, res, next) => {
  try {
    const { role, company, category } = req.body;
    const [ragCtx, mem] = await Promise.all([
      buildResumeRAGContext(req.user.userId),
      getUserMemory(req.user.userId),
    ]);

    const { result, meta } = await runPipeline({
      task: 'interview-simulator',
      systemPrompt: 'You are a senior interviewer at a top campus recruiter running a realistic placement mock interview. Be specific and demanding — tailor everything to the student profile provided, never generic.',
      userPrompt: `Run one round of a mock placement interview.\nTarget role: ${role || 'any campus role'}\nTarget company: ${company || 'a typical campus recruiter'}\nQuestion category: ${category || 'mixed (HR / technical / case)'}\n\nReturn JSON:\n{"question":"one interview question tailored to this student","framework":"the structure or framework a strong answer should follow","idealAnswer":"a model answer outline in 3-4 sentences","followUps":["likely follow-up 1","likely follow-up 2"],"trap":"one sentence on the mistake most candidates make on this question"}`,
      ragContext: ragCtx.contextText,
      memoryContext: formatMemoryContext(mem),
      sourceCount: Object.values(ragCtx.sources).filter(Boolean).length,
      json: true,
    });

    appendTopic(req.user.userId, 'mock interview').catch(() => {});
    res.json({ ...result, _meta: { provider: meta.provider, confidence: meta.confidence } });
  } catch (err) {
    if (err.message === 'AI not configured') return res.status(503).json({ message: 'AI features are not enabled on this server' });
    next(err);
  }
});

// ── Company Comparison (Max) ──────────────────────────────────────────────

router.post('/compare-companies', checkTier('max'), aiQuota, async (req, res, next) => {
  try {
    const { slugA, slugB } = req.body;
    if (!slugA || !slugB) return res.status(400).json({ message: 'Pick two companies to compare' });
    if (slugA === slugB) return res.status(400).json({ message: 'Pick two different companies' });

    const [a, b, mem] = await Promise.all([
      Company.findOne({ slug: slugA }).lean(),
      Company.findOne({ slug: slugB }).lean(),
      getUserMemory(req.user.userId),
    ]);
    if (!a || !b) return res.status(404).json({ message: 'Company not found' });

    const brief = (c) =>
      `${c.name} (sector: ${c.sector})\nOverview: ${c.overview}\nWhat they look for: ${c.whatTheyLookFor || 'n/a'}\nSalary: ${c.salaryRange || 'n/a'}\nRoles: ${c.roles.join(', ') || 'n/a'}\nProcess: ${c.rounds.join(' → ') || 'n/a'}`;

    const { result, meta } = await runPipeline({
      task: 'compare-companies',
      systemPrompt: 'You are a placement advisor comparing campus recruiters for a student. Be decisive and concrete — students need a verdict, not a survey.',
      userPrompt: `Compare these two recruiters for a student deciding where to focus preparation.\n\nCompany A:\n${brief(a)}\n\nCompany B:\n${brief(b)}\n\nReturn JSON:\n{"verdict":"2-3 sentence overall comparison and recommendation","chooseAIf":"one sentence — the student profile that should prefer ${a.name}","chooseBIf":"one sentence — the student profile that should prefer ${b.name}","prepDifference":"2-3 sentences on how preparation differs between the two"}`,
      memoryContext: formatMemoryContext(mem),
      json: true,
    });

    appendTopic(req.user.userId, `compared ${a.name} vs ${b.name}`).catch(() => {});
    res.json({ ...result, companies: { a: a.name, b: b.name }, _meta: { provider: meta.provider, confidence: meta.confidence } });
  } catch (err) {
    if (err.message === 'AI not configured') return res.status(503).json({ message: 'AI features are not enabled on this server' });
    next(err);
  }
});

// ── Semantic Search ────────────────────────────────────────────────────────

router.post('/search', checkTier('trial'), async (req, res, next) => {
  try {
    const { query, collections, limit = 5 } = req.body;
    if (!query?.trim()) return res.status(400).json({ message: 'query is required' });

    const results = await search({
      query,
      collections,
      k: Math.min(limit, 10),
      userId: req.user.userId,
    });

    res.json({ query, results });
  } catch (err) {
    next(err);
  }
});

// ── Index a document for semantic search (pro+ only — prevents free-tier abuse) ──

router.post('/index/:collection/:docId', checkTier('trial'), async (req, res, next) => {
  try {
    const { collection, docId } = req.params;
    const { text, metadata } = req.body;
    if (!text) return res.status(400).json({ message: 'text is required' });

    await upsertEmbedding({ collection, docId, text, metadata: metadata || {} });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

// ── User Memory (read + update) ────────────────────────────────────────────

const { updateMemory } = require('../ai/memory');
const UserMemory = require('../models/UserMemory');

router.get('/memory', async (req, res, next) => {
  try {
    const { getUserMemory } = require('../ai/memory');
    const mem = await getUserMemory(req.user.userId);
    // Never expose raw vectors or sensitive internals
    const { _id, __v, user, ...safe } = mem;
    res.json(safe);
  } catch (err) { next(err); }
});

router.patch('/memory', async (req, res, next) => {
  try {
    const allowed = ['specialization', 'careerInterests', 'targetCompanies', 'targetRoles', 'preferredExplanationStyle'];
    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (!Object.keys(patch).length) return res.status(400).json({ message: 'No updatable fields provided' });
    const mem = await updateMemory(req.user.userId, patch);
    res.json({ ok: true, updatedFields: Object.keys(patch) });
  } catch (err) { next(err); }
});

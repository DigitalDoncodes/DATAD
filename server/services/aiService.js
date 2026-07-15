/**
 * Central AI service.
 * Each function picks the best provider for its task via the router —
 * no hardcoded provider names here.
 */
const { getProvider } = require('../ai/providers');
const { routeTask }   = require('../ai/router');

function call(taskName) {
  return getProvider(routeTask(taskName));
}

function stripFences(raw) {
  return raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
}

// ── Note summarizer ───────────────────────────────────────────────────────────
// Task: fast — routed to Groq / Gemini
exports.summariseNote = async ({ title, subject, content }) => {
  const p = call('summarise-note');
  const { text } = await p.complete({
    maxTokens: 600,
    messages: [
      {
        role: 'system',
        content: 'You are a study assistant. Be concise, precise, and practically useful for a student preparing for placements and exams.',
      },
      {
        role: 'user',
        content: `Summarise the following note in three parts:
1. A 2-3 sentence executive summary.
2. Five bullet-point key takeaways (each ≤ 15 words).
3. Relevant business frameworks or concepts mentioned (comma-separated, max 5).

Note title: ${title}
Subject: ${subject}
Content:
${content}

Reply in this exact JSON format and nothing else:
{"summary":"…","keyPoints":["…","…","…","…","…"],"frameworks":"…"}`,
      },
    ],
  });
  return JSON.parse(stripFences(text));
};

// ── Resume reviewer ───────────────────────────────────────────────────────────
// Task: powerful — routed to Anthropic / OpenAI
exports.reviewResume = async (resume) => {
  const p = call('review-resume');
  const r = resume;
  const pr = r.personal || {};
  const lines = [
    `Name: ${pr.fullName || '(blank)'}`,
    `Email: ${pr.email || '(blank)'}  Phone: ${pr.phone || '(blank)'}`,
    `LinkedIn: ${pr.linkedin || '(none)'}  Website: ${pr.website || '(none)'}`,
    `Summary: ${r.summary || '(none)'}`,
    `Education: ${(r.education || []).map((e) => `${e.degree} @ ${e.institution} (${e.years}, ${e.score})`).join('; ') || '(none)'}`,
    `Experience: ${(r.experience || []).map((e) => `${e.role} @ ${e.organization} (${e.duration})`).join('; ') || '(none)'}`,
    `Projects: ${(r.projects || []).map((e) => e.title).join(', ') || '(none)'}`,
    `Skills: ${(r.skills || []).join(', ') || '(none)'}`,
    `Certifications: ${(r.certifications || []).map((c) => c.name).join(', ') || '(none)'}`,
    `Achievements: ${(r.achievements || []).join('; ') || '(none)'}`,
  ];

  const { text } = await p.complete({
    maxTokens: 700,
    messages: [
      {
        role: 'system',
        content: 'You are a senior career counsellor specialising in placement preparation. Be direct, specific, and actionable. Never generic.',
      },
      {
        role: 'user',
        content: `Review this resume for placement readiness. Give exactly 3 improvements, each tied to a specific gap you can see.

${lines.join('\n')}

Reply in this exact JSON format and nothing else:
{"overallImpression":"one sentence","improvements":[{"area":"…","issue":"specific problem","fix":"concrete action ≤ 20 words"},{"area":"…","issue":"…","fix":"…"},{"area":"…","issue":"…","fix":"…"}]}`,
      },
    ],
  });
  return JSON.parse(stripFences(text));
};

// ── Daily case framework generator ───────────────────────────────────────────
// Task: powerful — routed to Anthropic / OpenAI
exports.generateCaseFramework = async ({ title, category, scenario, question }) => {
  const p = call('case-framework');
  const { text } = await p.complete({
    maxTokens: 500,
    messages: [
      {
        role: 'system',
        content: 'You are a case interview coach. Write clear, structured frameworks for students.',
      },
      {
        role: 'user',
        content: `Generate a concise suggested framework (3-5 bullet points, ≤ 200 words total) for this daily case.

Category: ${category}
Title: ${title}
Scenario: ${scenario}
Question: ${question}

Reply with plain text only — no JSON, no markdown headers.`,
      },
    ],
  });
  return text;
};

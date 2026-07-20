const INTENTS = [
  'explain',
  'summarize',
  'teach',
  'coach',
  'review',
  'compare',
  'research',
  'generate',
  'reason',
  'brainstorm',
  'career',
  'resume',
  'interview',
  'planner',
  'reflection',
  'motivation',
  'coding',
  'knowledge-graph',
  'administration',
];

const INTENT_KEYWORDS = {
  explain:       ['explain', 'what is', 'how does', 'define', 'describe', 'meaning', 'overview', 'tell me about'],
  summarize:     ['summarize', 'summarise', 'summary', 'tl;dr', 'brief', 'key points', 'gist', 'recap'],
  teach:         ['teach', 'learn', 'understand', 'concept', 'framework', 'tutorial', 'guide', 'walk through'],
  coach:         ['coach', 'mentor', 'guide me', 'advise', 'suggest', 'tip', 'recommendation', 'improve', 'growth'],
  review:        ['review', 'feedback', 'critique', 'evaluate', 'assess', 'rate', 'analyse', 'check'],
  compare:       ['compare', 'versus', 'vs', 'difference', 'pros and cons', 'trade-off', 'better', 'which'],
  research:      ['research', 'find', 'search', 'investigate', 'explore', 'trend', 'analysis', 'data', 'statistics'],
  generate:      ['generate', 'create', 'write', 'draft', 'compose', 'produce', 'build', 'make', 'prepare'],
  reason:        ['reason', 'think', 'step by step', 'logical', 'deduce', 'infer', 'conclusion', 'therefore', 'because'],
  brainstorm:    ['brainstorm', 'idea', 'creative', 'innovate', 'imagine', 'possibility', 'option', 'alternative'],
  career:        ['career', 'job', 'placement', 'company', 'sector', 'industry', 'role', 'profile', 'opportunity'],
  resume:        ['resume', 'cv', 'curriculum', 'skill', 'experience', 'achievement', 'certification', 'project'],
  interview:     ['interview', 'mock', 'question', 'round', 'hr', 'technical', 'case', 'guesstimate', 'hr round'],
  planner:       ['planner', 'plan', 'schedule', 'task', 'priority', 'deadline', 'due', 'organize', 'timeline'],
  reflection:    ['reflect', 'reflection', 'journal', 'think back', 'gratitude', 'mindful', 'habit', 'review day'],
  motivation:    ['motivate', 'inspire', 'encourage', 'keep going', 'push', 'determination', 'focus', 'success'],
  coding:        ['code', 'program', 'script', 'function', 'algorithm', 'debug', 'syntax', 'implement'],
  'knowledge-graph': ['knowledge graph', 'related', 'connection', 'network', 'linked', 'relationship', 'graph'],
  administration: ['admin', 'setting', 'config', 'manage', 'dashboard', 'monitor', 'report', 'log', 'audit'],
};

const TASK_TO_INTENT = {
  'summarise-note':          'summarize',
  'news-summary':            'summarize',
  'news-enhance':            'summarize',
  'moderation':              'administration',
  'resume-tip':              'resume',
  'daily-reflection':        'reflection',
  'daily-briefing':          'summarize',
  'daily-case':              'teach',
  'company-enrichment':      'research',
  'interview-questions':     'interview',
  'planner-suggest':         'planner',
  'chat':                    'explain',
  'review-resume':           'review',
  'career-advice':           'career',
  'case-framework':          'teach',
  'interview-simulator':     'interview',
  'compare-companies':       'compare',
  'weekly-newsletter':       'generate',
  'fact-verify':             'reason',

  'flashcard-generate':      'generate',
  'quiz-generate':           'generate',
  'finance-assist':          'explain',
  'dashboard-insights':      'research',
  'company-research':        'research',
  'resume-ats':              'resume',
};

function classifyByKeywords(text) {
  const lower = (text || '').toLowerCase();
  const scores = {};

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    scores[intent] = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        scores[intent] += 1;
      }
    }
  }

  const maxScore = Math.max(...Object.values(scores), 0);
  if (maxScore === 0) return null;

  const top = Object.entries(scores)
    .filter(([, s]) => s === maxScore)
    .map(([intent]) => intent);

  return {
    primaryIntent: top[0],
    confidence: Math.min(0.5 + maxScore * 0.15, 0.95),
    allScores: scores,
  };
}

function classifyByTask(taskName) {
  const intent = TASK_TO_INTENT[taskName];
  if (!intent) return null;
  return {
    primaryIntent: intent,
    confidence: 0.9,
    source: 'task-mapping',
  };
}

function classifyTask({ text, taskName }) {
  if (taskName) {
    const byTask = classifyByTask(taskName);
    if (byTask) return byTask;
  }
  if (text) {
    const byKeywords = classifyByKeywords(text);
    if (byKeywords) return byKeywords;
  }
  return {
    primaryIntent: 'explain',
    confidence: 0.4,
    source: 'default',
  };
}

const INTENT_REQUIREMENTS = {
  explain:       { supportsJson: false, minContextWindow: 4000 },
  summarize:     { supportsJson: true,  minContextWindow: 8000 },
  teach:         { supportsJson: false, minContextWindow: 8000 },
  coach:         { supportsJson: false, minContextWindow: 4000 },
  review:        { supportsJson: true,  minContextWindow: 8000 },
  compare:       { supportsJson: true,  minContextWindow: 8000 },
  research:      { supportsJson: false, minContextWindow: 16000 },
  generate:      { supportsJson: true,  minContextWindow: 8000 },
  reason:        { supportsJson: false, minContextWindow: 8000 },
  brainstorm:    { supportsJson: false, minContextWindow: 4000 },
  career:        { supportsJson: false, minContextWindow: 8000 },
  resume:        { supportsJson: true,  minContextWindow: 8000 },
  interview:     { supportsJson: true,  minContextWindow: 8000 },
  planner:       { supportsJson: true,  minContextWindow: 4000 },
  reflection:    { supportsJson: true,  minContextWindow: 2000 },
  motivation:    { supportsJson: false, minContextWindow: 2000 },
  coding:        { supportsJson: false, minContextWindow: 8000 },
  'knowledge-graph': { supportsJson: false, minContextWindow: 4000 },
  administration: { supportsJson: false, minContextWindow: 2000 },
};

function getRequirements(intent) {
  return INTENT_REQUIREMENTS[intent] || { supportsJson: false, minContextWindow: 4000 };
}

module.exports = {
  INTENTS,
  INTENT_KEYWORDS,
  TASK_TO_INTENT,
  classifyByKeywords,
  classifyByTask,
  classifyTask,
  INTENT_REQUIREMENTS,
  getRequirements,
};

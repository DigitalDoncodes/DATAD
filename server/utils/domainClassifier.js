// Deterministic keyword classifier that maps a student's academic profile
// (course, specialization, career interests, dream role — including
// arbitrary free-text "Other" values) onto a fixed set of domain tags.
// This is what news, opportunities, and the daily briefing personalize
// against, so it never depends on an AI call or extra infra: presets and
// free text are classified the same way, instantly, at write time.

const DOMAIN_TAGS = [
  'business',
  'engineering-tech',
  'science',
  'medicine-health',
  'psychology-mentalhealth',
  'law',
  'arts-humanities',
  'general',
];

// Each keyword is either a plain string (must match as a whole word — safe
// default for short degree abbreviations like "ba"/"hr"/"cse" that would
// otherwise false-positive as substrings of ordinary words like "basket" or
// "chrome") or `{ stem: '...' }` (matches as a prefix, for word stems meant
// to catch inflections: "psycholog" → psychology/psychologist/psychological).
//
// Order matters where domains could overlap — first match wins, so more
// specific domains (psychology, medicine, law) are listed before the broad
// ones (business, arts-humanities) that share generic vocabulary.
const DOMAIN_KEYWORDS = [
  {
    tag: 'psychology-mentalhealth',
    keywords: [{ stem: 'psycholog' }, 'clinical', { stem: 'counsel' }, 'mental health', 'therapy', { stem: 'therapist' }, { stem: 'psychiatr' }, 'behavioural science', 'behavioral science'],
  },
  {
    tag: 'medicine-health',
    keywords: ['mbbs', 'bds', { stem: 'nursing' }, { stem: 'nurse' }, { stem: 'pharma' }, 'medical', 'medicine', 'physiotherapy', 'dental', 'public health', 'clinical research', 'healthcare'],
  },
  {
    tag: 'law',
    keywords: ['llb', 'llm', 'law', 'legal', { stem: 'litigat' }, 'advocate', 'jurisprudence'],
  },
  {
    tag: 'engineering-tech',
    keywords: ['b.tech', 'btech', 'm.tech', 'mtech', 'cse', 'ece', 'eee', { stem: 'engineer' }, 'computer science', 'software', 'information technology', 'mechanical', 'civil', 'chemical engineering', 'data science', 'artificial intelligence', 'machine learning', 'electronics'],
  },
  {
    tag: 'science',
    keywords: ['b.sc', 'bsc', 'm.sc', 'msc', 'physics', 'chemistry', { stem: 'biolog' }, 'biotechnology', 'mathematics', 'statistics', 'research', 'life sciences', 'environmental science'],
  },
  {
    tag: 'business',
    keywords: ['mba', 'bba', 'b.com', 'bcom', 'm.com', 'mcom', 'finance', { stem: 'market' }, 'human resources', 'hr', 'operations', 'analytics', 'strategy', 'commerce', 'accounting', 'economics', { stem: 'entrepreneur' }, 'business administration'],
  },
  {
    tag: 'arts-humanities',
    keywords: ['b.a', 'ba', 'm.a', 'ma', 'english', 'history', 'political science', 'literature', 'philosophy', 'sociology', 'journalism', 'mass communication', 'fine arts', 'design'],
  },
];

function normalize(value) {
  if (!value) return '';
  return String(value).toLowerCase().trim();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function keywordMatches(haystack, keyword) {
  const isStem = typeof keyword === 'object' && keyword !== null;
  const trimmed = (isStem ? keyword.stem : keyword).trim();

  // Punctuated tokens (e.g. "b.tech") can't use \b around the dot — plain substring.
  if (/[^a-z0-9 ]/i.test(trimmed)) return haystack.includes(trimmed);

  const pattern = isStem
    ? `\\b${escapeRegex(trimmed)}` // prefix: open-ended suffix (psycholog -> psychology, psychologist)
    : `\\b${escapeRegex(trimmed)}\\b`; // whole word only (ba, hr, cse — too short to safely prefix-match)
  return new RegExp(pattern).test(haystack);
}

/**
 * Classify a student's profile into domain tags.
 * @param {{course?: string, specialization?: string, careerInterests?: string[], dreamRole?: string}} profile
 * @returns {{ primary: string, tags: string[] }}
 */
function classifyDomain({ course, specialization, careerInterests, dreamRole } = {}) {
  const haystack = [
    normalize(course),
    normalize(specialization),
    normalize(dreamRole),
    ...(Array.isArray(careerInterests) ? careerInterests.map(normalize) : []),
  ].join(' ');

  const matched = [];
  for (const { tag, keywords } of DOMAIN_KEYWORDS) {
    if (keywords.some((kw) => keywordMatches(haystack, kw))) {
      matched.push(tag);
    }
  }

  if (matched.length === 0) {
    return { primary: 'general', tags: ['general'] };
  }

  return { primary: matched[0], tags: matched };
}

// The news feed (client/src/utils/intelligence.js TOPICS) only has content
// for business + tech categories today — mapping is intentionally partial;
// other domains get no auto-followed topics until matching news sources
// exist, rather than fabricating a match that has no real content behind it.
const NEWS_TOPIC_KEYWORDS = {
  Finance: ['finance'],
  Marketing: [{ stem: 'market' }],
  HR: ['hr', 'human resources'],
  Operations: [{ stem: 'operations' }],
  Entrepreneurship: [{ stem: 'entrepreneur' }],
  Consulting: [{ stem: 'consult' }, 'strategy'],
  Technology: [{ stem: 'tech' }, 'computer science', 'software', 'data science', 'artificial intelligence'],
};

/**
 * Auto-seed the news "For you" topics (see client/src/utils/intelligence.js
 * TOPICS) a new student should follow, based on their classified domain and
 * specialization text. Only ever returns topics that have real matching news
 * categories today — an unmatched domain (psychology, medicine, law, arts)
 * gets an empty list rather than a forced/irrelevant topic.
 */
function inferNewsInterests({ domainPrimary, specialization, careerInterests } = {}) {
  if (domainPrimary !== 'business' && domainPrimary !== 'engineering-tech') return [];

  const haystack = [normalize(specialization), ...(Array.isArray(careerInterests) ? careerInterests.map(normalize) : [])].join(' ');
  const matched = Object.entries(NEWS_TOPIC_KEYWORDS)
    .filter(([, keywords]) => keywords.some((kw) => keywordMatches(haystack, kw)))
    .map(([topic]) => topic);

  return matched;
}

module.exports = { DOMAIN_TAGS, classifyDomain, inferNewsInterests };

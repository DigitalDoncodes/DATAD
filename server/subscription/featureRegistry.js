const { getRank } = require('./tierHierarchy');

const FEATURE = {
  NOTES: 'notes',
  PLANNER: 'planner',
  JOURNAL: 'journal',
  NEWS: 'news',
  CAREER_BASIC: 'career_basic',
  COMMUNITY: 'community',
  DIRECTORY: 'directory',
  FINANCE: 'finance',
  WELLBEING: 'wellbeing',
  AI_CHAT: 'ai_chat',

  AI_SUMMARISE: 'ai_summarise',
  AI_RESUME_REVIEW: 'ai_resume_review',
  AI_PLANNER_SUGGEST: 'ai_planner_suggest',
  SEMANTIC_SEARCH: 'semantic_search',
  BRIEFING: 'briefing',
  DAILY_CASE: 'daily_case',
  STUDY_TOOLS: 'study_tools',

  INTERVIEW_QUESTIONS: 'interview_questions',
  COMPANY_PREMIUM: 'company_premium',
  AI_INTERVIEW_SIMULATOR: 'ai_interview_simulator',
  AI_COMPARE_COMPANIES: 'ai_compare_companies',
  AI_CAREER_ADVICE: 'ai_career_advice',
  RESUME_ATS: 'resume_ats',
  READINESS_SCORE: 'readiness_score',

  KNOWLEDGE_GRAPH: 'knowledge_graph',
  ADVANCED_AI_MEMORY: 'advanced_ai_memory',
  MULTI_WORKSPACE: 'multi_workspace',
  AUTONOMOUS_AI: 'autonomous_ai',
  MARKET_INTELLIGENCE: 'market_intelligence',
  CASE_GENERATOR: 'case_generator',

  FLASHCARD_GENERATE: 'flashcard_generate',
  QUIZ_GENERATE: 'quiz_generate',
  FINANCE_ASSIST: 'finance_assist',
  DASHBOARD_INSIGHTS: 'dashboard_insights',
  COMPANY_RESEARCH: 'company_research',

  ADMIN_STUDIO: 'admin_studio',
  ADMIN_USERS: 'admin_users',
  ADMIN_ANALYTICS: 'admin_analytics',
  ADMIN_AUTOMATION: 'admin_automation',
  ADMIN_SUBSCRIPTIONS: 'admin_subscriptions',
};

const FEATURE_ACCESS = {
  [FEATURE.NOTES]: 'free',
  [FEATURE.PLANNER]: 'free',
  [FEATURE.JOURNAL]: 'free',
  [FEATURE.NEWS]: 'free',
  [FEATURE.CAREER_BASIC]: 'free',
  [FEATURE.COMMUNITY]: 'free',
  [FEATURE.DIRECTORY]: 'free',
  [FEATURE.FINANCE]: 'free',
  [FEATURE.WELLBEING]: 'free',
  [FEATURE.AI_CHAT]: 'free',

  [FEATURE.AI_SUMMARISE]: 'trial',
  [FEATURE.AI_RESUME_REVIEW]: 'trial',
  [FEATURE.AI_PLANNER_SUGGEST]: 'trial',
  [FEATURE.SEMANTIC_SEARCH]: 'trial',
  [FEATURE.BRIEFING]: 'trial',
  [FEATURE.DAILY_CASE]: 'trial',
  [FEATURE.STUDY_TOOLS]: 'trial',

  [FEATURE.INTERVIEW_QUESTIONS]: 'pro',
  [FEATURE.COMPANY_PREMIUM]: 'pro',
  [FEATURE.AI_INTERVIEW_SIMULATOR]: 'max',
  [FEATURE.AI_COMPARE_COMPANIES]: 'max',
  [FEATURE.AI_CAREER_ADVICE]: 'max',
  [FEATURE.RESUME_ATS]: 'pro',
  [FEATURE.FLASHCARD_GENERATE]: 'trial',
  [FEATURE.QUIZ_GENERATE]: 'trial',
  [FEATURE.FINANCE_ASSIST]: 'pro',
  [FEATURE.DASHBOARD_INSIGHTS]: 'trial',
  [FEATURE.COMPANY_RESEARCH]: 'pro',
  [FEATURE.READINESS_SCORE]: 'pro',

  [FEATURE.KNOWLEDGE_GRAPH]: 'max',
  [FEATURE.ADVANCED_AI_MEMORY]: 'max',
  [FEATURE.MULTI_WORKSPACE]: 'max',
  [FEATURE.AUTONOMOUS_AI]: 'max',
  [FEATURE.MARKET_INTELLIGENCE]: 'max',
  [FEATURE.CASE_GENERATOR]: 'max',

  [FEATURE.ADMIN_STUDIO]: 'admin',
  [FEATURE.ADMIN_USERS]: 'admin',
  [FEATURE.ADMIN_ANALYTICS]: 'admin',
  [FEATURE.ADMIN_AUTOMATION]: 'admin',
  [FEATURE.ADMIN_SUBSCRIPTIONS]: 'admin',
};

function getMinimumTier(feature) {
  return FEATURE_ACCESS[feature] || null;
}

function getAllFeatures() {
  return Object.values(FEATURE);
}

function getFeaturesForTier(tier) {
  const rank = getRank(tier);
  return Object.fromEntries(
    Object.entries(FEATURE_ACCESS).map(([feature, minTier]) => [
      feature,
      getRank(minTier) <= rank || minTier === 'admin',
    ])
  );
}

module.exports = { FEATURE, FEATURE_ACCESS, getMinimumTier, getAllFeatures, getFeaturesForTier };

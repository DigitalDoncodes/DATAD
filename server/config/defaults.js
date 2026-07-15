// Immutable global defaults for student context
const DEFAULT_CTX = Object.freeze({
  dashboardOrder: ['studyHub', 'financeHub', 'placementHub', 'dailyCase'],
  promptSet: 'default',
  features: {
    financeHub:    true,
    wellbeingHub:  true,
    careerHub:     true,
    community:     true,
    aiChat:        true,
    dailyBriefing: true,
    dailyCase:     true,
    planner:       true,
    resources:     true
  },
  // Subject‑level flags start false; any true from a subject flips the flag on
  subjectFlags: {
    enablesFinanceHub:   false,
    enablesWellbeingHub: false,
    enablesCareerHub:    false
  }
});

module.exports = { DEFAULT_CTX };

// ⚠️  NOT WIRED — this module is imported by studentIntelligenceEngine.js but
// none of its functions are ever called. recordOutcome() has no call site, so
// INTENT_MODEL_HISTORY and PROMPT_EFFECTIVENESS are always empty, and
// getBestModelForIntent() always returns null. Nothing in modelRouterV2's
// selection path consults this file, so no routing decision has ever been
// influenced by observed outcomes.
//
// Two things must happen before this is real:
//   1. A call site. telemetryEngine.recordCall() in daxService._executeViaRuntimeV2
//      already receives every field recordOutcome() needs.
//   2. Persistence. The state below is module-scoped and dies on restart, so
//      even once wired it would never accumulate the minSamples (5) that
//      getBestModelForIntent() requires under any realistic deploy cadence.
//
// Until both land, treat "Dax learns from usage" as unimplemented.
// LEARNED_MODEL_PREFERENCES in particular is declared and never assigned.
const LEARNED_MODEL_PREFERENCES = {};
const INTENT_MODEL_HISTORY = {};
const CAPABILITY_FEEDBACK = {};
const PROMPT_EFFECTIVENESS = {};

function recordOutcome({ intent, provider, model, promptId, promptVersion, confidence, latencyMs, cost, success }) {
  const modelKey = `${provider}:${model}`;

  if (!INTENT_MODEL_HISTORY[intent]) INTENT_MODEL_HISTORY[intent] = [];
  INTENT_MODEL_HISTORY[intent].push({
    provider,
    model,
    modelKey,
    confidence,
    latencyMs,
    cost,
    success,
    timestamp: Date.now(),
  });

  if (INTENT_MODEL_HISTORY[intent].length > 100) {
    INTENT_MODEL_HISTORY[intent] = INTENT_MODEL_HISTORY[intent].slice(-100);
  }
}

function getBestModelForIntent(intent, minSamples = 5) {
  const history = INTENT_MODEL_HISTORY[intent];
  if (!history || history.length < minSamples) return null;

  const byModel = {};
  for (const entry of history) {
    if (!byModel[entry.modelKey]) {
      byModel[entry.modelKey] = { count: 0, successCount: 0, totalConfidence: 0, totalLatencyMs: 0 };
    }
    byModel[entry.modelKey].count++;
    if (entry.success) byModel[entry.modelKey].successCount++;
    byModel[entry.modelKey].totalConfidence += entry.confidence || 0;
    byModel[entry.modelKey].totalLatencyMs += entry.latencyMs || 0;
  }

  let best = null;
  let bestScore = -1;

  for (const [key, stats] of Object.entries(byModel)) {
    if (stats.count < minSamples) continue;
    const successRate = stats.successCount / stats.count;
    const avgConfidence = stats.totalConfidence / stats.count;
    const avgLatency = stats.totalLatencyMs / stats.count;
    const score = successRate * 0.5 + avgConfidence * 0.3 - (avgLatency / 10000) * 0.2;

    if (score > bestScore) {
      bestScore = score;
      best = { modelKey: key, successRate, avgConfidence, avgLatency, score: parseFloat(score.toFixed(3)) };
    }
  }

  return best;
}

function recordPromptEffectiveness({ promptId, version, confidence, success, task }) {
  const key = `${promptId}:${version}`;
  if (!PROMPT_EFFECTIVENESS[key]) {
    PROMPT_EFFECTIVENESS[key] = { count: 0, successCount: 0, totalConfidence: 0, tasks: {} };
  }

  const stats = PROMPT_EFFECTIVENESS[key];
  stats.count++;
  if (success) stats.successCount++;
  stats.totalConfidence += confidence || 0;
  if (task) {
    if (!stats.tasks[task]) stats.tasks[task] = { count: 0, successCount: 0 };
    stats.tasks[task].count++;
    if (success) stats.tasks[task].successCount++;
  }
}

function getPromptEffectiveness(promptId, minSamples = 10) {
  const results = [];
  const prefix = `${promptId}:`;

  for (const [key, stats] of Object.entries(PROMPT_EFFECTIVENESS)) {
    if (!key.startsWith(prefix)) continue;
    if (stats.count < minSamples) continue;

    results.push({
      promptId,
      version: key.split(':')[1],
      count: stats.count,
      successRate: parseFloat((stats.successCount / stats.count).toFixed(3)),
      avgConfidence: parseFloat((stats.totalConfidence / stats.count).toFixed(3)),
      tasks: stats.tasks,
    });
  }

  return results.sort((a, b) => b.successRate - a.successRate);
}

function getModelRankingByIntent(intent) {
  const history = INTENT_MODEL_HISTORY[intent];
  if (!history || history.length === 0) return [];

  const byModel = {};
  for (const entry of history) {
    if (!byModel[entry.modelKey]) {
      byModel[entry.modelKey] = { provider: entry.provider, model: entry.model, count: 0, successCount: 0, totalConfidence: 0 };
    }
    byModel[entry.modelKey].count++;
    if (entry.success) byModel[entry.modelKey].successCount++;
    byModel[entry.modelKey].totalConfidence += entry.confidence || 0;
  }

  return Object.entries(byModel)
    .map(([key, stats]) => ({
      modelKey: key,
      provider: stats.provider,
      model: stats.model,
      count: stats.count,
      successRate: stats.count > 0 ? parseFloat((stats.successCount / stats.count).toFixed(3)) : 0,
      avgConfidence: stats.count > 0 ? parseFloat((stats.totalConfidence / stats.count).toFixed(3)) : 0,
    }))
    .sort((a, b) => b.successRate - a.successRate);
}

function getLearningSummary() {
  return {
    learnedPreferences: LEARNED_MODEL_PREFERENCES,
    intentCount: Object.keys(INTENT_MODEL_HISTORY).length,
    totalObservations: Object.values(INTENT_MODEL_HISTORY).reduce((a, b) => a + b.length, 0),
    promptEffectivenessEntries: Object.keys(PROMPT_EFFECTIVENESS).length,
  };
}

module.exports = {
  recordOutcome,
  getBestModelForIntent,
  recordPromptEffectiveness,
  getPromptEffectiveness,
  getModelRankingByIntent,
  getLearningSummary,
};

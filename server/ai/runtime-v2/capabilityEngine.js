const { MODELS, computeCapabilityScore, INTENT_TO_CAPABILITY } = require('./modelRegistry');
const { INTENT_REQUIREMENTS } = require('./intentEngine');

function _val(val, fallback = 50) {
  return typeof val === 'number' ? val : fallback;
}

function computeRequiredCapabilities(intent, contextSize = 0, complexity = 0.5) {
  const requirements = INTENT_REQUIREMENTS[intent] || INTENT_REQUIREMENTS.explain;
  const capabilities = {
    supportsJson: requirements.supportsJson,
    supportsVision: false,
    supportsStreaming: true,
    minContextWindow: requirements.minContextWindow,
    actualContextSize: contextSize,
    complexity,
    requiredReasoning: 50,
    requiredWriting: 50,
    requiredCoding: 0,
    requiredPlanning: 30,
    requiredSummarization: 30,
    requiredCreativity: 30,
    requiredExtraction: 20,
    requiredClassification: 20,
    requiredTranslation: 0,
    minLatency: 30,
    minReliability: 50,
    capabilityCategory: INTENT_TO_CAPABILITY[intent] || 'chat',
  };

  const intentThresholds = {
    explain:       { reasoning: 60, writing: 50 },
    summarize:     { summarization: 60, writing: 50 },
    teach:         { reasoning: 65, writing: 60, planning: 50 },
    coach:         { reasoning: 60, writing: 50, planning: 50, creativity: 40 },
    review:        { reasoning: 70, writing: 55, extraction: 60 },
    compare:       { reasoning: 65, writing: 50, extraction: 50 },
    research:      { reasoning: 70, extraction: 60, planning: 50 },
    generate:      { creativity: 65, writing: 60, reasoning: 50 },
    reason:        { reasoning: 80, planning: 50 },
    brainstorm:    { creativity: 70, reasoning: 60, writing: 50 },
    career:        { reasoning: 60, writing: 60, planning: 50 },
    resume:        { writing: 65, reasoning: 60, extraction: 55 },
    interview:     { reasoning: 65, writing: 50, planning: 60 },
    planner:       { planning: 70, reasoning: 60, writing: 50 },
    reflection:    { writing: 55, creativity: 55, reasoning: 40 },
    motivation:    { creativity: 60, writing: 55 },
    coding:        { coding: 75, reasoning: 70, planning: 50 },
    'knowledge-graph': { reasoning: 60, extraction: 60, writing: 50 },
    administration: { classification: 50, writing: 50, reasoning: 40 },
  };

  const thresholds = intentThresholds[intent] || {};
  if (thresholds.reasoning !== undefined) capabilities.requiredReasoning = thresholds.reasoning;
  if (thresholds.writing !== undefined) capabilities.requiredWriting = thresholds.writing;
  if (thresholds.coding !== undefined) capabilities.requiredCoding = thresholds.coding;
  if (thresholds.planning !== undefined) capabilities.requiredPlanning = thresholds.planning;
  if (thresholds.summarization !== undefined) capabilities.requiredSummarization = thresholds.summarization;
  if (thresholds.creativity !== undefined) capabilities.requiredCreativity = thresholds.creativity;
  if (thresholds.extraction !== undefined) capabilities.requiredExtraction = thresholds.extraction;
  if (thresholds.classification !== undefined) capabilities.requiredClassification = thresholds.classification;
  if (thresholds.translation !== undefined) capabilities.requiredTranslation = thresholds.translation;

  if (complexity > 0.7) {
    capabilities.requiredReasoning = Math.min(capabilities.requiredReasoning + 15, 95);
    capabilities.requiredWriting = Math.min(capabilities.requiredWriting + 10, 95);
    capabilities.requiredPlanning = Math.min(capabilities.requiredPlanning + 10, 95);
    capabilities.requiredExtraction = Math.min(capabilities.requiredExtraction + 10, 90);
  }

  return capabilities;
}

const CAPABILITY_TO_MODEL_FIELD = {
  reasoning: 'reasoningScore',
  writing: 'writingScore',
  coding: 'codingScore',
  planning: 'reasoningScore',
  summarization: 'writingScore',
  creativity: 'writingScore',
  extraction: 'reasoningScore',
  classification: 'reasoningScore',
  translation: 'writingScore',
};

function scoreModelFit(modelKey, capabilities) {
  const model = MODELS[modelKey];
  if (!model) return 0;

  if (capabilities.supportsJson && !model.supportsJson) return 0;
  if (capabilities.supportsVision && !model.supportsVision) return 0;
  if (capabilities.supportsStreaming && !model.supportsStreaming) return 0;
  if (_val(model.contextWindow, 0) < capabilities.minContextWindow) return 0;
  if (_val(model.contextWindow, 0) < capabilities.actualContextSize) return 0;

  let penalty = 0;

  const checks = {
    reasoning: capabilities.requiredReasoning,
    writing: capabilities.requiredWriting,
    coding: capabilities.requiredCoding,
    planning: capabilities.requiredPlanning,
    summarization: capabilities.requiredSummarization,
    creativity: capabilities.requiredCreativity,
    extraction: capabilities.requiredExtraction,
    classification: capabilities.requiredClassification,
    translation: capabilities.requiredTranslation,
  };

  for (const [cap, required] of Object.entries(checks)) {
    if (required <= 0) continue;
    const field = CAPABILITY_TO_MODEL_FIELD[cap];
    if (!field) continue;
    const actual = _val(model[field]);
    if (actual < required) {
      penalty += (required - actual) * 2;
    }
  }

  if (_val(model.latencyScore) < capabilities.minLatency) {
    penalty += (capabilities.minLatency - _val(model.latencyScore)) * 1;
  }

  const categoryScore = computeCapabilityScore(modelKey, capabilities.capabilityCategory);

  const baseScore = (
    _val(model.reasoningScore) * 0.15 +
    _val(model.writingScore) * 0.15 +
    _val(model.codingScore) * 0.05 +
    _val(model.latencyScore) * 0.15 +
    _val(model.costScore) * 0.10 +
    _val(model.availability) * 0.10 * 100 +
    categoryScore * 0.30
  );

  return Math.max(0, Math.round(baseScore - penalty * 0.5));
}

function findBestModels(capabilities, availableModels, count = 3) {
  const scored = availableModels
    .map((m) => ({
      key: m.key,
      provider: m.provider,
      model: m.model,
      score: scoreModelFit(m.key, capabilities),
      capabilities: m,
    }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, count);
}

module.exports = {
  computeRequiredCapabilities,
  scoreModelFit,
  findBestModels,
};

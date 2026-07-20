const {
  getAvailableModels,
  autoSelectModel,
  findBestModelForIntent,
  scoreModelForIntent,
  computeCapabilityScore,
  getModel,
} = require('./modelRegistry');
const { computeRequiredCapabilities, findBestModels } = require('./capabilityEngine');
const { classifyTask } = require('./intentEngine');
const healthEngine = require('./providerHealthEngine');
const cacheLayer = require('./cacheLayer');
const costOptimizer = require('./costOptimizer');
const latencyOptimizer = require('./latencyOptimizer');
const cfg = require('../../config/automation');
const { getProvider } = require('../providers');

const ROUTING_STRATEGIES = ['auto-select', 'capability-first', 'cost-first', 'latency-first', 'health-first', 'balanced'];

const TIER_WEIGHT_OVERRIDES = {
  free:  { costMultiplier: 1.5, minCostScore: 60 },
  trial: { costMultiplier: 1.2, minCostScore: 50 },
  pro:   { costMultiplier: 1.0, minCostScore: 30 },
  max:   { costMultiplier: 0.8, minCostScore: 0 },
};

async function routeRequest({ text, taskName, userId, tier = 'free', contextSize = 0, complexity = 0.5, strategy = 'auto-select' }) {
  const intent = classifyTask({ text, taskName });

  const capabilities = computeRequiredCapabilities(intent.primaryIntent, contextSize, complexity);

  const availableModels = getAvailableModels();

  // auto-select is the new default — picks the highest-scoring model for the intent
  if (strategy === 'auto-select') {
    const selected = autoSelectModel(intent.primaryIntent, tier, {
      preferLowCost: tier === 'free' || tier === 'trial',
      preferSpeed: complexity < 0.3,
    });
    if (selected) {
      const modelData = getModel(selected.key);
      if (healthEngine.isProviderHealthy(selected.provider) || selected.provider === 'ollama') {
        return {
          provider: selected.provider,
          model: selected.model,
          modelKey: selected.key,
          capabilityScore: selected.capabilityScore,
          intent: intent.primaryIntent,
          intentConfidence: intent.confidence,
          autoSelected: true,
          routingDecision: {
            strategy: 'auto-select',
            method: 'capability-scoring',
            capabilityCategory: capabilities.capabilityCategory,
            finalScore: selected.finalScore,
            tier,
          },
        };
      }
    }
    // fall through to other strategies if auto-select fails
  }

  let candidates;
  switch (strategy) {
    case 'auto-select':
    case 'capability-first':
    default:
      candidates = findBestModels(capabilities, availableModels, 5);
      break;
    case 'cost-first':
      candidates = costOptimizer.selectCheapestModels(capabilities, availableModels, intent.primaryIntent);
      break;
    case 'latency-first':
      candidates = latencyOptimizer.selectFastestModels(capabilities, availableModels, intent.primaryIntent);
      break;
    case 'health-first':
      candidates = _selectHealthiestModels(capabilities, availableModels);
      break;
    case 'balanced':
      candidates = _selectBalanced(capabilities, availableModels, intent.primaryIntent, tier);
      break;
  }

  const tierOverrides = TIER_WEIGHT_OVERRIDES[tier] || TIER_WEIGHT_OVERRIDES.free;
  candidates = _applyTierFilter(candidates, tierOverrides);

  const healthyCandidates = candidates.filter((c) => healthEngine.isProviderHealthy(c.provider));
  const finalCandidates = healthyCandidates.length > 0 ? healthyCandidates : candidates;

  const hasCache = cacheLayer.hasCache(taskName || intent.primaryIntent, userId);
  if (hasCache) {
    const cacheResult = cacheLayer.get(taskName || intent.primaryIntent, userId);
    if (cacheResult) {
      return {
        ...cacheResult,
        routingDecision: {
          strategy: 'cache-hit',
          intent: intent.primaryIntent,
          confidence: intent.confidence,
          capabilities,
          cached: true,
        },
      };
    }
  }

  let lastError = null;
  const maxAttempts = cfg.retry?.maxAttempts || 3;

  for (let attempt = 0; attempt < Math.min(maxAttempts, finalCandidates.length); attempt++) {
    const candidate = finalCandidates[attempt];
    if (!candidate) continue;
    if (!healthEngine.isProviderHealthy(candidate.provider) && attempt < finalCandidates.length - 1) continue;

    try {
      const provider = getProvider(candidate.provider);
      return {
        provider: candidate.provider,
        model: candidate.model,
        modelKey: candidate.key,
        capabilities: candidate.capabilities,
        intent: intent.primaryIntent,
        intentConfidence: intent.confidence,
        attempt,
        routingDecision: {
          strategy,
          candidateCount: finalCandidates.length,
          selectedIndex: attempt,
          tier,
          contextSize,
          complexity,
        },
      };
    } catch (err) {
      lastError = err;
      healthEngine.recordFailure({ provider: candidate.provider, errorType: 'provider_unavailable' });
    }
  }

  for (const fallbackName of ['nvidia', 'ollama']) {
    try {
      const fallback = getProvider(fallbackName);
      if (fallback && fallback.isAvailable()) {
        return {
          provider: fallbackName,
          model: fallback.model,
          modelKey: null,
          capabilities: null,
          intent: intent.primaryIntent,
          intentConfidence: intent.confidence,
          attempt: finalCandidates.length,
          routingDecision: {
            strategy: 'fallback',
            fallbackChain: [fallbackName],
            error: lastError?.message,
          },
        };
      }
    } catch (_) { /* skip unavailable */ }
  }
  throw new Error(`No AI provider available after routing: ${lastError?.message || 'all providers exhausted'}`);
}

function _applyTierFilter(candidates, tierOverrides) {
  return candidates.map((c) => {
    const effectiveCostScore = c.capabilities?.costScore || 50;
    if (effectiveCostScore < tierOverrides.minCostScore) {
      c.score = c.score * (1 / tierOverrides.costMultiplier) * 0.5;
    }
    return c;
  }).sort((a, b) => b.score - a.score);
}

function _selectHealthiestModels(capabilities, availableModels) {
  const candidates = findBestModels(capabilities, availableModels, 10);
  return candidates
    .map((c) => ({
      ...c,
      healthPriority: healthEngine.getProviderPriority(c.provider),
    }))
    .filter((c) => c.healthPriority >= 0)
    .sort((a, b) => {
      if (b.healthPriority !== a.healthPriority) return b.healthPriority - a.healthPriority;
      return b.score - a.score;
    })
    .slice(0, 5);
}

function _selectBalanced(capabilities, availableModels, intent, tier) {
  const candidates = findBestModels(capabilities, availableModels, 10);
  const tierOverrides = TIER_WEIGHT_OVERRIDES[tier] || TIER_WEIGHT_OVERRIDES.free;

  return candidates
    .map((c) => {
      const healthPriority = healthEngine.getProviderPriority(c.provider);
      const healthWeight = healthPriority / 2;
      const costWeight = (c.capabilities?.costScore || 50) / 100 * tierOverrides.costMultiplier;
      const latencyWeight = (c.capabilities?.latencyScore || 50) / 100;

      c.balancedScore = Math.round(
        c.score * 0.4 +
        healthWeight * 0.2 +
        costWeight * 0.2 +
        latencyWeight * 0.2
      );
      return c;
    })
    .filter((c) => c.healthPriority >= 0)
    .sort((a, b) => b.balancedScore - a.balancedScore)
    .slice(0, 5);
}

async function resolveProvider(providerName) {
  const fallbackChain = ['nvidia', 'ollama'];
  const chain = providerName ? [providerName, ...fallbackChain] : fallbackChain;
  for (const name of chain) {
    try {
      const p = getProvider(name);
      if (p && p.isAvailable()) return p;
    } catch (_) { /* skip */ }
  }
  throw new Error('No AI provider available after fallback chain (NVIDIA → Ollama)');
}

module.exports = {
  routeRequest,
  resolveProvider,
  ROUTING_STRATEGIES,
};

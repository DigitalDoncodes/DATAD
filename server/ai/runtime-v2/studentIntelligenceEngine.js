const intentEngine = require('./intentEngine');
const contextBuilder = require('./contextBuilder');
const modelRegistry = require('./modelRegistry');
const capabilityEngine = require('./capabilityEngine');
const modelRouterV2 = require('./modelRouterV2');
const promptRegistry = require('./promptRegistry');
const promptVersionManager = require('./promptVersionManager');
const responseVerifierV2 = require('./responseVerifierV2');
const telemetryEngine = require('./telemetryEngine');
const circuitBreaker = require('./circuitBreaker');
const cacheLayer = require('./cacheLayer');
const costOptimizer = require('./costOptimizer');
const latencyOptimizer = require('./latencyOptimizer');
const knowledgeGraphAdapter = require('./knowledgeGraphAdapter');
const memoryAdapter = require('./memoryAdapter');
const learningEngine = require('./learningEngine');

const cfg = require('../../config/automation');

async function processIntelligenceRequest({ userId, text, taskName, sourceCount, existingTitles, contextSize, estimatedCostUsd, tier, strategy, retryCount = 0 }) {
  const startTime = Date.now();

  const intent = intentEngine.classifyTask({ text, taskName, userId });
  const context = await contextBuilder.buildContext(userId);

  const routing = await modelRouterV2.routeRequest({
    text,
    taskName,
    userId,
    tier: tier || context?.user?.tier || 'free',
    contextSize: contextSize || context?.contextSize || 0,
    complexity: intent.complexity || 0.5,
    strategy: strategy || 'capability-first',
  });

  const cacheResult = cacheLayer.get(taskName || intent.primaryIntent, userId);
  if (cacheResult) {
    return {
      result: cacheResult,
      intent,
      context,
      routing,
      caching: { hit: true, key: taskName || intent.primaryIntent },
      latencyMs: Date.now() - startTime,
    };
  }

  const prompt = promptRegistry.getPromptForIntent(intent.primaryIntent, taskName);
  const currentVersion = prompt?.currentVersion || '1.0';

  const providerInstance = await modelRouterV2.resolveProvider(routing.provider);

  let rawOutput;
  let verification;
  let promptTokens, completionTokens, totalTokens;
  let success = false;

  try {
    const response = await providerInstance.generate({
      system: prompt?.system || '',
      user: prompt?.user || '',
      context: context.text,
      query: text,
      taskName,
      intent: intent.primaryIntent,
      userId,
    });

    rawOutput = response.output || response.text || response;
    promptTokens = response.promptTokens || response.usage?.promptTokens || 0;
    completionTokens = response.completionTokens || response.usage?.completionTokens || 0;
    totalTokens = response.totalTokens || response.usage?.totalTokens || (promptTokens + completionTokens);

    verification = await responseVerifierV2.verifyResponse({
      output: rawOutput,
      task: taskName,
      intent: intent.primaryIntent,
      sourceCount,
      existingTitles,
      promptId: prompt?.promptId,
      version: currentVersion,
    });

    if (verification.status === 'failed' && retryCount < 3) {
      return await processIntelligenceRequest({
        userId, text, taskName, sourceCount, existingTitles,
        contextSize, estimatedCostUsd, tier, strategy,
        retryCount: retryCount + 1,
      });
    }

    success = verification.status !== 'failed';
  } catch (err) {
    circuitBreaker.recordFailure(routing.provider, 'provider_unavailable');
    rawOutput = null;
    verification = {
      pass: false,
      status: 'failed',
      confidence: 0,
      issues: [err.message],
      warnings: [],
      hallucinationHits: [],
    };
    promptTokens = 0;
    completionTokens = 0;
    totalTokens = 0;
  }

  const latencyMs = Date.now() - startTime;

  const cost = costOptimizer.estimateCost({
    provider: routing.provider,
    model: routing.model,
    promptTokens,
    completionTokens,
    estimatedCostUsd,
  });

  telemetryEngine.recordCall({
    userId,
    task: taskName,
    intent: intent.primaryIntent,
    provider: routing.provider,
    model: routing.model,
    tokensUsed: totalTokens,
    promptTokens,
    completionTokens,
    latencyMs,
    estimatedCostUsd: cost,
    confidence: verification?.confidence || 0,
    status: verification?.status || 'failed',
    validationIssues: verification?.issues || [],
    sourceCount: sourceCount || 0,
    promptId: prompt?.promptId,
    promptVersion: currentVersion,
    retryAttempts: retryCount,
    contextSize: contextSize || 0,
    strategy: strategy || null,
  });

  await telemetryEngine.persistCall({
    task: taskName,
    userId,
    intent: intent.primaryIntent,
    provider: routing.provider,
    model: routing.model,
    tokensUsed: totalTokens,
    estimatedCostUsd: cost,
    confidence: verification?.confidence,
    validationStatus: verification?.status,
    durationMs: latencyMs,
    status: success ? 'success' : 'failed',
    error: success ? null : verification?.issues?.join('; '),
  });

  await telemetryEngine.incrementUserUsage(userId);

  learningEngine.recordOutcome({
    intent: intent.primaryIntent,
    provider: routing.provider,
    model: routing.model,
    promptId: prompt?.promptId,
    promptVersion: currentVersion,
    confidence: verification?.confidence,
    latencyMs,
    cost,
    success,
  });

  promptVersionManager.recordVersionUsage(prompt?.promptId, currentVersion, verification?.status, latencyMs);
  promptVersionManager.recordConfidence(prompt?.promptId, currentVersion, verification?.confidence || 0);

  if (success && verification?.confidence >= 0.7) {
    cacheLayer.set(taskName || intent.primaryIntent, userId, {
      output: rawOutput,
      verification,
    }, { contentType: intent.primaryIntent });
  }

  await memoryAdapter.saveMemory(userId, {
    type: 'ai-interaction',
    key: `${intent.primaryIntent}:${Date.now()}`,
    value: {
      query: text.slice(0, 200),
      intent: intent.primaryIntent,
      confidence: verification?.confidence,
      status: verification?.status,
    },
    tags: ['ai-runtime-v2', intent.primaryIntent],
  });

  return {
    result: rawOutput,
    verification,
    intent,
    context,
    routing,
    prompt: {
      id: prompt?.promptId,
      version: currentVersion,
    },
    caching: { hit: false },
    cost,
    latencyMs,
    retryCount,
    timestamp: new Date().toISOString(),
    runtime: 'v2',
  };
}

async function healthCheck() {
  const intentCount = Object.keys(intentEngine.TASK_INTENT_MAP || {}).length;
  const modelCount = modelRegistry.getAvailableModels().length;
  const providerHealth = {};
  const providers = ['groq', 'openai', 'anthropic', 'google', 'cohere', 'mistral'];

  for (const p of providers) {
    const cbState = circuitBreaker.getState(p);
    providerHealth[p] = {
      available: circuitBreaker.isAvailable(p),
      circuitState: cbState.currentState,
      failures: cbState.failureCount,
    };
  }

  return {
    status: 'healthy',
    modules: {
      intentEngine: intentCount > 0,
      modelRegistry: modelCount > 0,
      contextBuilder: true,
      capabilityEngine: true,
      modelRouterV2: true,
      promptRegistry: true,
      promptVersionManager: true,
      responseVerifierV2: true,
      telemetryEngine: true,
      circuitBreaker: true,
      cacheLayer: true,
      costOptimizer: true,
      latencyOptimizer: true,
      knowledgeGraphAdapter: true,
      memoryAdapter: true,
      learningEngine: true,
    },
    stats: {
      registeredIntents: intentCount,
      registeredModels: modelCount,
      providerHealth,
    },
  };
}

module.exports = {
  processIntelligenceRequest,
  healthCheck,
};

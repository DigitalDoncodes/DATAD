const RuntimeComparison = require('../models/RuntimeComparison');
const cfg = require('../config/automation');

const v1Runner = require('./runner');
const v2Engine = require('./runtime-v2/studentIntelligenceEngine');
const intelligenceLayer = require('./intelligence-layer');

const GATEWAY_MODE_KEY = '__ai_gateway_mode';
const GATEWAY_MODE_DEFAULT = 'v1_only';

const HYBRID_V2_INTENTS = [
  'chat',
  'explain',
  'summarise',
  'summarize',
  'research',
  'resume_review',
  'career_advice',
  'review',
  'interview',
  'planner',
  'compare',
  'teach',
  'generate',
  'resume',
  'career',
  'reflection',
  'reason',
  'brainstorm',
  'coach',
  'motivation',
];

const modes = ['v1_only', 'v2_only', 'shadow', 'hybrid'];
let _currentMode = process.env.AI_GATEWAY_MODE || GATEWAY_MODE_DEFAULT;

if (!modes.includes(_currentMode)) {
  _currentMode = GATEWAY_MODE_DEFAULT;
}

function getMode() {
  return _currentMode;
}

function setMode(mode) {
  if (!modes.includes(mode)) return false;
  _currentMode = mode;
  return true;
}

function getAllModes() {
  return modes;
}

/**
 * Normalize a request object so both V1 and V2 executors get the fields they need.
 * V1 callers pass { system, user, provider, json, maxTokens, task, sourceCount }.
 * V2 callers pass { userId, text, taskName, ... }.
 * Convert V1-style to common format so V2 can run when mode is v2_only/hybrid/shadow.
 */
function _normalizeRequest(request) {
  const n = { ...request };

  if (!n.userId && n._gatewaySource === 'runner') {
    n.userId = n.userId || null;
  }

  if (!n.text && n.user) {
    n.text = n.user;
  }
  if (!n.taskName && n.task) {
    n.taskName = n.task;
  }
  if (!n.task && n.taskName) {
    n.task = n.taskName;
  }

  return n;
}

async function processRequest(request) {
  const normalized = _normalizeRequest(request);

  // Build Student Intelligence Profile before routing
  const profile = await _buildProfile(normalized);
  normalized._profile = profile;

  const mode = _currentMode;

  // Messages array is a V1-only format (chat). Always route to V1 in that case.
  if (request.messages && mode !== 'v1_only') {
    return _enrichWithProfile(await _routeV1(normalized), profile);
  }

  switch (mode) {
    case 'v1_only':
      return _enrichWithProfile(await _routeV1(normalized), profile);
    case 'v2_only':
      return _enrichWithProfile(await _routeV2(normalized), profile);
    case 'shadow':
      return _enrichWithProfile(await _routeShadow(normalized), profile);
    case 'hybrid':
      return _enrichWithProfile(await _routeHybrid(normalized), profile);
    default:
      return _enrichWithProfile(await _routeV1(normalized), profile);
  }
}

async function _buildProfile(request) {
  const userId = request.userId || request._profileUserId;
  if (!userId) return null;
  try {
    return await intelligenceLayer.buildStudentProfile(userId);
  } catch {
    return null;
  }
}

function _enrichWithProfile(gatewayResult, profile) {
  if (!profile) return gatewayResult;
  return {
    ...gatewayResult,
    profile: {
      scores: profile.scores,
      enrichedContext: profile.enrichedContext,
    },
  };
}

async function _routeV1(request) {
  const start = Date.now();
  const result = await _execV1(request);
  return _formatGatewayResult(result, 'v1', null, start);
}

async function _routeV2(request) {
  const start = Date.now();
  const result = await _execV2(request);
  return _formatGatewayResult(result, 'v2', null, start);
}

async function _routeShadow(request) {
  const start = Date.now();

  const [v1Result, v2Result] = await Promise.allSettled([
    _execV1(request),
    _execV2(request),
  ]);

  const primary = v1Result.status === 'fulfilled'
    ? { runtime: 'v1', data: v1Result.value }
    : { runtime: 'v1', data: null, error: v1Result.reason?.message };

  const shadow = v2Result.status === 'fulfilled'
    ? { runtime: 'v2', data: v2Result.value }
    : { runtime: 'v2', data: null, error: v2Result.reason?.message };

  if (v2Result.status === 'fulfilled' || v2Result.status === 'rejected') {
    _persistShadowMetrics(request, v1Result, v2Result).catch(() => {});
  }

  const modeResult = _formatGatewayResult(primary.data, 'v1', 'shadow', start);
  modeResult.shadow = {
    runtime: 'v2',
    latencyMs: shadow.data?.latencyMs ?? null,
    provider: shadow.data?.provider ?? shadow.data?.routing?.provider ?? null,
    model: shadow.data?.model ?? shadow.data?.routing?.model ?? null,
    confidence: shadow.data?.confidence ?? null,
    verificationScore: shadow.data?.verificationScore ?? null,
    tokensUsed: shadow.data?.tokensUsed ?? 0,
    cost: shadow.data?.estimatedCostUsd ?? null,
    error: shadow.error ?? null,
  };

  return modeResult;
}

async function _routeHybrid(request) {
  const start = Date.now();
  const intent = _detectIntent(request);
  const profile = request._profile;

  // Use intent + profile focus to decide runtime
  const shouldUseV2 = intent && HYBRID_V2_INTENTS.includes(intent);

  // Profile-driven override: high-urgency tasks stay on stable V1
  const urgencyOverride = profile?.scores?.urgencyLevel > 70;

  if (shouldUseV2 && !urgencyOverride) {
    const result = await _execV2(request);
    return _formatGatewayResult(result, 'v2', 'hybrid', start);
  }

  const result = await _execV1(request);
  return _formatGatewayResult(result, 'v1', 'hybrid', start);
}

async function _execV1(request) {
  const { system, user, messages, provider, json, maxTokens, task } = request;

  if (!system && !user && !messages) {
    throw new Error('V1 execution requires system/user prompts or messages array');
  }

  // Inject student intelligence profile context into the system prompt
  const profile = request._profile;
  const profileContext = profile?.enrichedContext || '';
  const enrichedSystem = profileContext
    ? (system ? `${system}\n\n[Student Context]\n${profileContext}` : `[Student Context]\n${profileContext}`)
    : system;

  let result, meta;

  // Support conversation history via messages array (chat use case)
  if (messages) {
    const enrichedMessages = profileContext
      ? [
          { role: 'system', content: enrichedSystem || '' },
          ...messages.filter((m) => m.role !== 'system'),
        ]
      : messages;

    // getProvider() only checks isAvailable() — a static "has a key" check,
    // not a live reachability probe — so a configured-but-unreachable
    // provider (e.g. Ollama with no local daemon running) can be handed
    // back as "available" and then fail on the real call, with nothing to
    // catch it. Try every statically-available candidate in order instead
    // of just the first, so one dead provider doesn't take chat down.
    const { getProviderChain } = require('./providers');
    const chain = getProviderChain(provider);
    if (!chain.length) throw new Error('No AI provider available.');

    let raw, lastErr, attempts = 0;
    for (const p of chain) {
      attempts++;
      try {
        raw = await p.complete({ messages: enrichedMessages, system: enrichedSystem || undefined, maxTokens });
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
      }
    }
    if (lastErr) throw new Error(`Chat failed on all ${attempts} available provider(s): ${lastErr.message}`);

    result = raw.text;
    meta = {
      provider: raw.provider,
      model: raw.model,
      tokensUsed: raw.tokensUsed,
      promptTokens: raw.promptTokens,
      completionTokens: raw.completionTokens,
      latencyMs: raw.latencyMs,
      estimatedCostUsd: 0,
      attempts,
    };
  } else {
    const runResult = await v1Runner.run({
      system: enrichedSystem || '',
      user: user || '',
      provider,
      json: json !== false,
      maxTokens,
      _gatewayBypass: true,
    });
    result = runResult.result;
    meta = runResult.meta;
  }

  return {
    result,
    provider: meta.provider,
    model: meta.model,
    tokensUsed: meta.tokensUsed || 0,
    promptTokens: meta.promptTokens || 0,
    completionTokens: meta.completionTokens || 0,
    latencyMs: meta.latencyMs || 0,
    estimatedCostUsd: meta.estimatedCostUsd || 0,
    confidence: meta.confidence || null,
    verificationScore: null,
    verificationStatus: null,
    cacheHit: false,
    promptVersion: 'v1',
    attempts: meta.attempts || 1,
    task: task || null,
    _rawMeta: meta,
  };
}

async function _execV2(request) {
  const { userId, text, taskName, sourceCount, existingTitles, contextSize, estimatedCostUsd, tier, strategy } = request;

  if (!text && !taskName && !request.system) {
    throw new Error('V2 execution requires text or task');
  }

  const profile = request._profile;
  const v2Request = {
    userId,
    text: text || request.user || '',
    taskName: taskName || request.task || null,
    sourceCount: sourceCount || 0,
    existingTitles: existingTitles || [],
    contextSize: contextSize || 0,
    estimatedCostUsd: estimatedCostUsd || 0,
    tier: tier || 'free',
    strategy: strategy || 'capability-first',
    _profile: profile || null,
  };

  // studentIntelligenceEngine only exports a page/action-oriented enhance()
  // (enhance({ userId, page, action, data, tier, strategy })), not a
  // task/text-oriented processIntelligenceRequest() — the two AI runtimes
  // use incompatible calling conventions (see AI_ARCHITECTURE_REPORT.md).
  // Calling a nonexistent function here used to throw an opaque
  // "processIntelligenceRequest is not a function" TypeError; this is the
  // same failure, made diagnosable, until the gateway's V2 mode is either
  // wired to a real task-based V2 entry point or retired.
  throw new Error(
    'aiGateway V2 mode is not wired to a working V2 execution path — ' +
    'studentIntelligenceEngine only exposes a page/action-oriented enhance(), ' +
    'not the task/text-oriented request this gateway builds. Keep AI_GATEWAY_MODE ' +
    'on v1_only until this is resolved.'
  );

  return {
    result: v2Result.result,
    provider: v2Result.routing?.provider || null,
    model: v2Result.routing?.model || null,
    tokensUsed: v2Result.routing?.tokensUsed || 0,
    promptTokens: 0,
    completionTokens: 0,
    latencyMs: v2Result.latencyMs || 0,
    estimatedCostUsd: v2Result.cost || 0,
    confidence: v2Result.verification?.confidence || null,
    verificationScore: v2Result.verification?.confidence || null,
    verificationStatus: v2Result.verification?.status || null,
    cacheHit: v2Result.caching?.hit || false,
    promptVersion: v2Result.prompt?.version || 'v2.0',
    promptId: v2Result.prompt?.id || null,
    intent: v2Result.intent,
    capabilityProfile: v2Result.routing?.capabilities || null,
    task: taskName || request.task || null,
    attempts: (v2Result.retryCount || 0) + 1,
    _rawMeta: {
      provider: v2Result.routing?.provider || null,
      model: v2Result.routing?.model || null,
      tokensUsed: v2Result.routing?.tokensUsed || 0,
      promptTokens: 0,
      completionTokens: 0,
      latencyMs: v2Result.latencyMs || 0,
      estimatedCostUsd: v2Result.cost || 0,
      attempts: (v2Result.retryCount || 0) + 1,
    },
    _rawV2: v2Result,
  };
}

function _detectIntent(request) {
  if (request.intent) return request.intent;

  try {
    const intentEngine = require('./runtime-v2/intentEngine');
    const classification = intentEngine.classifyTask({
      text: request.text || request.user || '',
      taskName: request.taskName || request.task,
    });
    return classification?.primaryIntent || null;
  } catch {
    return null;
  }
}

function _formatGatewayResult(execResult, runtime, fallback, startTime) {
  const latencyMs = Date.now() - startTime;

  return {
    result: execResult?.result ?? null,
    runtime,
    fallbackRuntime: fallback || null,
    provider: execResult?.provider ?? null,
    model: execResult?.model ?? null,
    latencyMs,
    cacheHit: execResult?.cacheHit ?? false,
    confidence: execResult?.confidence ?? null,
    verificationScore: execResult?.verificationScore ?? null,
    verificationStatus: execResult?.verificationStatus ?? null,
    estimatedCostUsd: execResult?.estimatedCostUsd ?? 0,
    tokensUsed: execResult?.tokensUsed ?? 0,
    promptVersion: execResult?.promptVersion ?? 'v1',
    intent: execResult?.intent?.primaryIntent ?? execResult?.intent ?? null,
    capabilityProfile: execResult?.capabilityProfile ?? null,
    promptId: execResult?.promptId ?? null,
    task: execResult?.task ?? null,
    _execMeta: execResult?._rawMeta ?? null,
    _v2Meta: execResult?._rawV2 ?? null,
  };
}

async function _persistShadowMetrics(request, v1Result, v2Result) {
  try {
    const v1 = v1Result.status === 'fulfilled' ? v1Result.value : null;
    const v2 = v2Result.status === 'fulfilled' ? v2Result.value : null;

    const record = {
      userId: request.userId || null,
      task: request.taskName || request.task || null,
      intent: v2?.intent?.primaryIntent ?? v1?.intent ?? null,
      runtimeSelected: 'v1',
      fallbackRuntime: null,
      mode: 'shadow',
      status: v1 && v2 ? 'matched' : v1 ? 'v1_only' : 'divergent',
      v1: v1 ? {
        provider: v1.provider,
        model: v1.model,
        latencyMs: v1.latencyMs,
        tokensUsed: v1.tokensUsed,
        estimatedCostUsd: v1.estimatedCostUsd,
        confidence: v1.confidence,
        verificationScore: v1.verificationScore,
        verificationStatus: v1.verificationStatus,
        cacheHit: v1.cacheHit,
        promptVersion: v1.promptVersion,
      } : null,
      v2: v2 ? {
        provider: v2.provider,
        model: v2.model,
        latencyMs: v2.latencyMs,
        tokensUsed: v2.tokensUsed,
        estimatedCostUsd: v2.estimatedCostUsd,
        confidence: v2.confidence,
        verificationScore: v2.verificationScore,
        verificationStatus: v2.verificationStatus,
        cacheHit: v2.cacheHit,
        promptVersion: v2.promptVersion,
        capabilityProfile: v2.capabilityProfile,
      } : null,
    };

    await RuntimeComparison.create(record);
  } catch (err) {
    console.warn('[aiGateway] Failed to persist shadow metrics:', err.message);
  }
}

async function persistExecutionMetrics(gatewayResult, extra) {
  try {
    const record = {
      userId: extra?.userId || null,
      task: extra?.taskName || extra?.task || gatewayResult.task || null,
      intent: gatewayResult.intent || null,
      runtimeSelected: gatewayResult.runtime,
      fallbackRuntime: gatewayResult.fallbackRuntime,
      mode: _currentMode,
      status: 'matched',
      v1: gatewayResult.runtime === 'v1' ? {
        provider: gatewayResult.provider,
        model: gatewayResult.model,
        latencyMs: gatewayResult.latencyMs,
        tokensUsed: gatewayResult.tokensUsed,
        estimatedCostUsd: gatewayResult.estimatedCostUsd,
        confidence: gatewayResult.confidence,
        verificationScore: gatewayResult.verificationScore,
        verificationStatus: gatewayResult.verificationStatus,
        cacheHit: gatewayResult.cacheHit,
        promptVersion: gatewayResult.promptVersion,
      } : null,
      v2: gatewayResult.runtime === 'v2' ? {
        provider: gatewayResult.provider,
        model: gatewayResult.model,
        latencyMs: gatewayResult.latencyMs,
        tokensUsed: gatewayResult.tokensUsed,
        estimatedCostUsd: gatewayResult.estimatedCostUsd,
        confidence: gatewayResult.confidence,
        verificationScore: gatewayResult.verificationScore,
        verificationStatus: gatewayResult.verificationStatus,
        cacheHit: gatewayResult.cacheHit,
        promptVersion: gatewayResult.promptVersion,
        capabilityProfile: gatewayResult.capabilityProfile,
      } : null,
    };

    await RuntimeComparison.create(record);
  } catch (err) {
    console.warn('[aiGateway] Failed to persist execution metrics:', err.message);
  }
}

module.exports = {
  process: processRequest,
  setMode,
  getMode,
  getAllModes,
  persistExecutionMetrics,
  HYBRID_V2_INTENTS,
};

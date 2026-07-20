const RuntimeComparison = require('../models/RuntimeComparison');
const cfg = require('../config/automation');

const v1Runner = require('./runner');
const usageMeter = require('./usageMeter');
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

// Streaming sibling of processRequest(), used only by the chat task's SSE
// endpoint. Mirrors _execV1's messages-array path (profile enrichment +
// provider dispatch) but yields text deltas instead of awaiting a full
// result. No V2/hybrid/shadow branching — streaming always uses V1 dispatch,
// same as processRequest() already forces for any messages-array request.
// How many times the model may call tools and be asked again within one turn.
// Read-only tools cannot cascade into anything harmful, so this exists to bound
// latency and token spend, and to stop a small model that has got stuck in a
// call-the-same-tool loop from doing it forever.
const MAX_TOOL_ROUNDS = 3;

/**
 * Streams a reply, servicing any tool calls the model makes along the way.
 *
 * Yields only user-visible text. A tool round produces no text — the model
 * emits tool calls instead of content — so those rounds are silent from the
 * client's point of view and the visible reply is whatever the model says once
 * it has its data back.
 *
 * Falls back to a plain stream when the provider has no rich streaming or no
 * tools were requested, so non-NVIDIA providers keep working untouched.
 */
async function* _streamWithTools(provider, { messages, system, model, maxTokens, signal, userId, tools, conversationId, onProposal }) {
  if (!tools?.length || typeof provider.completeStreamRich !== 'function') {
    yield* provider.completeStream({ messages, system, model, maxTokens, signal });
    return;
  }

  const { executeTool, isWriteTool } = require('./tools');
  const proposalService = require('./proposalService');
  const working = [...messages];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    // Tools are withheld on the final round so the model is forced to answer
    // with text rather than requesting yet another call it will never get.
    const offerTools = round < MAX_TOOL_ROUNDS;
    const rawCalls = [];
    let sawText = false;

    // Small models sometimes emit a scrap of text alongside their tool calls —
    // llama-3.1-8b-instruct produced a bare ";;" in testing — which would be
    // streamed to the student as if it were the answer. So the first few
    // characters of a tool-eligible round are held back: once the text grows
    // past PREFIX_HOLD it is clearly a real answer and streams through with no
    // further delay, but if the round turns out to be a tool round the
    // held-back scrap is discarded instead of shown.
    const PREFIX_HOLD = 40;
    let held = '';
    let flowing = !offerTools; // final round can never be a tool round

    for await (const ev of provider.completeStreamRich({
      messages: working,
      system,
      model,
      maxTokens,
      signal,
      tools: offerTools ? tools : undefined,
    })) {
      if (ev.type === 'text') {
        sawText = true;
        if (flowing) { yield ev.text; continue; }
        held += ev.text;
        if (held.length > PREFIX_HOLD) { flowing = true; yield held; held = ''; }
      } else if (ev.type === 'tool_calls') {
        rawCalls.push(...ev.toolCalls);
      }
    }

    // Identical calls in one round are pure duplicated latency — the observed
    // 8B model asked for get_my_resume twice in a single turn.
    const seen = new Set();
    const pendingCalls = rawCalls.filter((c) => {
      const key = `${c.name}:${c.arguments || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!pendingCalls.length) {
      // Not a tool round after all — the held prefix was genuine content.
      if (held) yield held;
      return;
    }

    // Some models emit a sentence before their tool calls. That text has
    // already been streamed to the student, so it must be preserved in the
    // assistant turn — dropping it would leave the transcript and the model's
    // own history disagreeing about what was said.
    working.push({
      role: 'assistant',
      content: sawText ? undefined : null,
      tool_calls: pendingCalls.map((c) => ({
        id: c.id,
        type: 'function',
        function: { name: c.name, arguments: c.arguments || '{}' },
      })),
    });

    // Write calls are batched into ONE proposal so a single student intent
    // ("reschedule all three") becomes one card with one Confirm, rather than
    // three cards to click through.
    const writeCalls = pendingCalls.filter((c) => isWriteTool(c.name));
    const readCalls = pendingCalls.filter((c) => !isWriteTool(c.name));

    const results = await Promise.all(
      readCalls.map(async (call) => ({
        role: 'tool',
        tool_call_id: call.id,
        // userId comes from the authenticated request, never from model
        // output — a tool cannot be talked into reading another user's data.
        content: JSON.stringify(await executeTool(call, userId)),
      }))
    );

    if (writeCalls.length) {
      let proposal = null;
      let rejected = [];
      try {
        const parsed = writeCalls.map((c) => {
          let args = {};
          try { args = c.arguments ? JSON.parse(c.arguments) : {}; } catch { /* validator reports it */ }
          return { tool: c.name, args };
        });
        ({ proposal, rejected } = await proposalService.propose(userId, conversationId, parsed));
      } catch (err) {
        rejected = writeCalls.map((c) => ({ tool: c.name, error: err.message }));
      }

      if (proposal) onProposal?.(proposal);

      // Every write call gets a tool result, whether or not it made the card —
      // an unanswered tool_call_id leaves the provider's message history
      // malformed and the next round errors.
      for (const call of writeCalls) {
        const problem = rejected.find((r) => r.tool === call.name);
        results.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(
            problem
              ? { proposed: false, reason: problem.error }
              : { proposed: true, awaitingConfirmation: true,
                  note: 'Shown to the student as a confirmation card. Tell them briefly what you have suggested; do not claim it is done.' }
          ),
        });
      }
    }

    working.push(...results);
  }
}

async function* processStream(request) {
  const normalized = _normalizeRequest(request);
  const profile = await _buildProfile(normalized);
  const { system, messages, provider, model, maxTokens, signal } = normalized;

  if (!messages) throw new Error('processStream requires a messages array');

  const profileContext = profile?.enrichedContext || '';
  const enrichedSystem = profileContext
    ? (system ? `${system}\n\n[Student Context]\n${profileContext}` : `[Student Context]\n${profileContext}`)
    : system;
  const enrichedMessages = profileContext
    ? [{ role: 'system', content: enrichedSystem || '' }, ...messages.filter((m) => m.role !== 'system')]
    : messages;

  const { getProviderChain } = require('./providers');
  const chain = getProviderChain(provider);
  if (!chain.length) throw new Error('No AI provider available.');

  let lastError = null;
  for (const p of chain) {
    if (typeof p.completeStream !== 'function') {
      lastError = new Error(`Provider "${p.name}" does not support streaming.`);
      continue;
    }

    try {
      // Model names are provider-scoped: "llama-3.3-70b-versatile" exists on
      // Groq and not on NVIDIA. Passing the requested model to every provider in
      // the fallback chain meant that when the preferred provider failed, the
      // next one was asked for a model it has never heard of and 404'd — so the
      // fallback could never actually rescue the request. Only the provider the
      // model was chosen for gets it; the rest use their own default.
      const modelForProvider = p.name === (provider || chain[0]?.name) ? model : undefined;

      const gen = _streamWithTools(p, {
        messages: enrichedMessages,
        system: enrichedSystem || undefined,
        model: modelForProvider,
        maxTokens,
        signal,
        userId: normalized.userId,
        tools: normalized.tools,
        conversationId: normalized.conversationId,
        onProposal: normalized.onProposal,
      });
      const first = await gen.next();
      if (first.done) return;
      yield first.value;
      yield* gen;
      // Stream completed — charge credits (no token counts available on
      // the streaming path; charge by model weight only).
      usageMeter.chargeCredits({
        userId: normalized.userId,
        tier: normalized.tier,
        // The requested model when one was chosen, else the provider's own
        // default — `p.defaultModel` does not exist, so this used to record
        // the provider name ("nvidia") for every streamed chat.
        model: model || p.model || p.name,
        provider: p.name,
        task: normalized.task || normalized.taskName || 'chat',
      }).catch(() => {});
      return;
    } catch (err) {
      lastError = err;
      console.warn(`[aiGateway] Streaming provider "${p.name}" failed, trying next: ${err.message}`);
    }
  }

  throw new Error(
    `Streaming failed on all ${chain.length} available provider(s): ${lastError?.message || 'unknown error'}`
  );
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

  // Credit metering — fire-and-forget, common point after both branches.
  // Requests without a userId (system/cron jobs) are uncharged.
  usageMeter.chargeCredits({
    userId: request.userId,
    tier: request.tier,
    model: meta.model,
    provider: meta.provider,
    promptTokens: meta.promptTokens,
    completionTokens: meta.completionTokens,
    task: task || request.taskName || '',
    latencyMs: meta.latencyMs,
  }).catch(() => {});

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
  processStream,
  setMode,
  getMode,
  getAllModes,
  persistExecutionMetrics,
  HYBRID_V2_INTENTS,
};

const crypto = require('crypto');
const requestStore = require('./requestStore');

function generateSessionId() {
  return crypto.randomUUID();
}

function _extractUserId(request) {
  return request?.userId
    || request?._profileUserId
    || request?.req?.user?.userId
    || request?.req?.user?._id
    || null;
}

function _extractTask(request) {
  return request?.taskName || request?.task || null;
}

function _extractIntent(response) {
  return response?.intent?.primaryIntent
    || response?.intent
    || null;
}

function _wrapAsync(fn, context) {
  return async function wrapped(...args) {
    const start = Date.now();
    const request = args[0] || {};
    const sessionId = generateSessionId();
    const userId = _extractUserId(request);
    const task = _extractTask(request);

    let result;
    let error = null;
    try {
      result = await fn.apply(this, args);
    } catch (err) {
      error = err;
      result = err._observabilityResult || null;
    }

    const latencyMs = Date.now() - start;
    const success = !error && !(result instanceof Error);

    const entry = {
      timestamp: new Date().toISOString(),
      userId,
      sessionId,
      capability: _extractIntent(result) || task || 'unknown',
      intent: _extractIntent(result),
      provider: result?.provider || result?.routing?.provider || (error ? null : null),
      model: result?.model || result?.routing?.model || null,
      runtimeMode: result?.runtime || context?.mode || null,
      promptTokens: result?.promptTokens || result?._execMeta?.promptTokens || result?.routing?.tokensUsed || 0,
      completionTokens: result?.completionTokens || result?._execMeta?.completionTokens || 0,
      totalTokens: result?.tokensUsed || result?._execMeta?.tokensUsed || 0,
      estimatedCost: result?.estimatedCostUsd || result?.cost || 0,
      latencyMs,
      cacheHit: result?.cacheHit || result?.caching?.hit || false,
      fallbackUsed: result?.routingDecision?.strategy === 'fallback' || result?.fallbackRuntime !== null || false,
      retryCount: result?.attempts || result?.retryCount || 0,
      success,
      error: error ? error.message : null,
      task,
    };

    requestStore.record(entry);

    if (error) throw error;
    return result;
  };
}

let _patched = false;

function patchGateway() {
  if (_patched) return;
  try {
    const gateway = require('../aiGateway');
    const originalProcess = gateway.process;
    if (typeof originalProcess === 'function' && !originalProcess._observabilityPatched) {
      gateway.process = _wrapAsync(originalProcess, { mode: 'gateway' });
      gateway.process._observabilityPatched = true;
    }
    _patched = true;
  } catch (err) {
    console.warn('[observability] Failed to patch aiGateway:', err.message);
  }
}

function patchRunner() {
  try {
    const runner = require('../runner');
    const originalRun = runner.run;
    if (typeof originalRun === 'function' && !originalRun._observabilityPatched) {
      runner.run = _wrapAsync(originalRun, { mode: 'runner' });
      runner.run._observabilityPatched = true;
    }
  } catch (err) {
    console.warn('[observability] Failed to patch runner:', err.message);
  }
}

function install() {
  patchGateway();
  patchRunner();
}

module.exports = { install, generateSessionId, requestStore };

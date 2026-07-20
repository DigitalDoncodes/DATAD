const MAX_REQUESTS = 1000;

const requests = [];
let _nextId = 0;

function _nextIndex() {
  const idx = _nextId % MAX_REQUESTS;
  _nextId++;
  return idx;
}

function record(entry) {
  const idx = _nextIndex();
  requests[idx] = {
    id: _nextId,
    timestamp: entry.timestamp || new Date().toISOString(),
    userId: entry.userId || null,
    sessionId: entry.sessionId || null,
    capability: entry.capability || null,
    intent: entry.intent || null,
    provider: entry.provider || null,
    model: entry.model || null,
    runtimeMode: entry.runtimeMode || null,
    promptTokens: entry.promptTokens || 0,
    completionTokens: entry.completionTokens || 0,
    totalTokens: entry.totalTokens || 0,
    estimatedCost: entry.estimatedCost || 0,
    latencyMs: entry.latencyMs || 0,
    cacheHit: entry.cacheHit || false,
    fallbackUsed: entry.fallbackUsed || false,
    retryCount: entry.retryCount || 0,
    success: entry.success !== undefined ? entry.success : true,
    error: entry.error || null,
    task: entry.task || null,
  };
}

function recent(count = 100) {
  const total = Math.min(_nextId, MAX_REQUESTS);
  const take = Math.min(count, total);
  const result = [];
  for (let i = 0; i < take; i++) {
    const idx = (_nextId - take + i) % MAX_REQUESTS;
    if (requests[idx]) result.push(requests[idx]);
  }
  return result;
}

function all() {
  return requests.filter(Boolean);
}

function summary() {
  const total = requests.filter(Boolean).length;
  const recent100 = recent(100);
  const successes = recent100.filter((r) => r.success).length;
  const failed = recent100.filter((r) => !r.success).length;
  const fallbacks = recent100.filter((r) => r.fallbackUsed).length;
  const cacheHits = recent100.filter((r) => r.cacheHit).length;

  const totalTokens = recent100.reduce((s, r) => s + (r.totalTokens || 0), 0);
  const totalCost = recent100.reduce((s, r) => s + (r.estimatedCost || 0), 0);
  const avgLatency = recent100.length
    ? Math.round(recent100.reduce((s, r) => s + (r.latencyMs || 0), 0) / recent100.length)
    : 0;

  const providerStats = {};
  for (const r of recent100) {
    const p = r.provider || 'unknown';
    if (!providerStats[p]) providerStats[p] = { calls: 0, failures: 0, totalLatency: 0 };
    providerStats[p].calls++;
    if (!r.success) providerStats[p].failures++;
    providerStats[p].totalLatency += r.latencyMs || 0;
  }

  return {
    totalRequests: total,
    successRate: recent100.length ? Math.round((successes / recent100.length) * 100) : 100,
    averageLatencyMs: avgLatency,
    totalTokens,
    totalCost: parseFloat(totalCost.toFixed(6)),
    fallbackCount: fallbacks,
    cacheHitCount: cacheHits,
    failureCount: failed,
    providerStats: Object.entries(providerStats).map(([provider, s]) => ({
      provider,
      calls: s.calls,
      failures: s.failures,
      avgLatencyMs: Math.round(s.totalLatency / s.calls),
    })),
  };
}

function reset() {
  requests.length = 0;
  _nextId = 0;
}

module.exports = { record, recent, all, summary, reset };

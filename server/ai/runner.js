/**
 * AI Runner — wraps provider calls with:
 *   • Retry with exponential backoff
 *   • Provider fallback
 *   • Automatic JSON parsing
 *   • Execution metadata + cost estimation
 *
 * When aiGateway is configured, all calls route through the gateway
 * so it can decide V1 vs V2 based on the active mode.
 */
const { getProviderChain } = require('./providers');
const { parseJSON } = require('./parser');
const cfg = require('../config/automation');
const { estimateCost } = require('./router');

/**
 * Native V1 implementation — called directly when gateway is bypassed
 * or when gateway isn't configured.
 *
 * Iterates every statically-available provider candidate (getProviderChain),
 * not just the first (getProvider). isAvailable() is a static "has a key"
 * check, not a live reachability probe — Ollama's key is a hardcoded
 * placeholder (config/automation.js), so a configured-but-not-actually-
 * running local Ollama daemon reports available and only fails on the real
 * call. Previously this loop retried the SAME resolved provider up to
 * maxAttempts times with backoff — against a connection-refused endpoint
 * that never becomes reachable, that's maxAttempts wasted round-trips, not
 * a real retry. Confirmed live: forcing a Runtime V2 rollout task to fail
 * so its V1 fallback ran for real (a free-tier user, whose routing prefers
 * Ollama) reproduced exactly this — 3 failed attempts against the same dead
 * provider, then a hard throw, even though Groq (the one provider with a
 * real key in this environment) was available the whole time. Same category
 * of bug already fixed for the chat path (aiGateway.js's messages branch);
 * this brings the non-chat path to the same standard.
 *
 * One attempt per candidate, not maxAttempts-with-backoff per candidate:
 * an earlier version of this fix kept a per-provider backoff-retry loop
 * "for genuinely transient failures," but a live test proved that claim
 * false — the loop broke out to the next provider on the very first
 * failure regardless of error type, so the inner retry never actually ran.
 * Distinguishing a transient error (rate limit) from a hard one (connection
 * refused) from the message string alone is guesswork; rather than ship a
 * claim the code doesn't back up, this tries each candidate once and moves
 * on. cfg.retry's maxAttempts/delayMs/backoffMultiplier are unused here as
 * a result — left in config for now rather than removed, since a real
 * transient-vs-hard classification is a reasonable future improvement, not
 * a reason to leave today's behavior misdescribed.
 */
async function _nativeRun({ system, user, provider: preferredProvider, json = true, maxTokens }) {
  const chain = getProviderChain(preferredProvider);
  if (!chain.length) throw new Error('No AI provider available.');

  let lastError;
  let attempts = 0;

  for (const p of chain) {
    attempts++;
    try {
      const messages = [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: user },
      ];

      const raw = await p.complete({ messages, system, maxTokens });
      const result = json ? parseJSON(raw.text, `attempt ${attempts}`) : raw.text;

      const costUsd = estimateCost(raw.provider, raw.promptTokens, raw.completionTokens);
      return {
        result,
        meta: {
          provider: raw.provider,
          model: raw.model,
          tokensUsed: raw.tokensUsed,
          promptTokens: raw.promptTokens,
          completionTokens: raw.completionTokens,
          latencyMs: raw.latencyMs,
          estimatedCostUsd: parseFloat(costUsd.toFixed(6)),
          attempts,
        },
      };
    } catch (err) {
      lastError = err;
      console.warn(`[AI Runner] ${p.name} failed (candidate ${attempts}/${chain.length}): ${err.message}`);
    }
  }

  throw new Error(`AI generation failed after trying all ${chain.length} available provider(s): ${lastError?.message}`);
}

/**
 * Public run function — routes through aiGateway when available,
 * otherwise falls back to native V1 execution.
 *
 * @param {object} opts
 * @param {string}  opts.system   - System prompt
 * @param {string}  opts.user     - User prompt
 * @param {string}  [opts.provider] - Preferred provider name
 * @param {boolean} [opts.json]  - Parse response as JSON (default true)
 * @param {number}  [opts.maxTokens]
 * @param {boolean} [opts._gatewayBypass] - Internal flag to skip gateway delegation
 * @returns {Promise<{ result, meta }>}
 */
async function run(opts) {
  // Bypass gateway when called from within the gateway itself (prevents recursion)
  if (opts._gatewayBypass) {
    return _nativeRun(opts);
  }

  try {
    // Lazy require — breaks circular dep: aiGateway requires runner,
    // runner lazily requires aiGateway only at call time (not module load).
    const gateway = require('./aiGateway');
    const gwResult = await gateway.process(opts);

    return {
      result: gwResult.result,
      meta: {
        provider: gwResult.provider,
        model: gwResult.model,
        tokensUsed: gwResult.tokensUsed || 0,
        promptTokens: gwResult._execMeta?.promptTokens || 0,
        completionTokens: gwResult._execMeta?.completionTokens || 0,
        latencyMs: gwResult.latencyMs || 0,
        estimatedCostUsd: gwResult.estimatedCostUsd || 0,
        attempts: gwResult._execMeta?.attempts || 1,
        runtime: gwResult.runtime,
      },
    };
  } catch {
    return _nativeRun(opts);
  }
}

module.exports = { run };

// The swap-in seam: useDaxChat always does
//   for await (const chunk of toChunks(await adapter.sendMessage(...))) { ... }
// regardless of whether the adapter returned a plain string (today, since the
// backend is single-shot JSON) or a real AsyncIterable<string> (a future SSE
// adapter) — chunks from a real iterable pass through unmodified, no
// artificial delay. Only plain strings get the simulated "alive" reveal.

function isAsyncIterable(value) {
  return value != null && typeof value[Symbol.asyncIterator] === 'function';
}

function randomDelay(min, max) {
  return min + Math.random() * (max - min);
}

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    if (signal) {
      const onAbort = () => {
        clearTimeout(id);
        reject(new DOMException('Aborted', 'AbortError'));
      };
      if (signal.aborted) onAbort();
      else signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

export async function* toChunks(
  resultOrIterable,
  { minDelay = 18, maxDelay = 34, pauseMin = 120, pauseMax = 220, signal } = {}
) {
  if (isAsyncIterable(resultOrIterable)) {
    for await (const chunk of resultOrIterable) {
      if (signal?.aborted) return;
      yield chunk;
    }
    return;
  }

  const text = String(resultOrIterable ?? '');
  // Split into words while keeping whitespace as its own token, so spacing
  // renders naturally instead of being reconstructed with a join(' ').
  const tokens = text.split(/(\s+)/).filter((t) => t.length > 0);

  for (const token of tokens) {
    if (signal?.aborted) return;
    yield token;
    const isSentenceEnd = /[.!?]\s*$/.test(token) || token.includes('\n\n');
    await wait(isSentenceEnd ? randomDelay(pauseMin, pauseMax) : randomDelay(minDelay, maxDelay), signal);
  }
}

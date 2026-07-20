/**
 * Global in-flight request counter, fed by the axios interceptors in api/axios.js.
 *
 * Exists so UI (currently SectionTransition) can wait on "is the app still
 * fetching?" without every page having to report its own loading state.
 *
 * Background pollers are deliberately excluded. NotificationBell refetches on a
 * 30s timer and the admin studio pages poll every ~2s; if those counted, a
 * loading overlay would be held open by traffic the user never asked for.
 */

// Polling. NotificationBell refetches on a 30s timer and the admin studio
// pages poll every ~2s; if these counted, traffic the user never asked for
// would hold a loading overlay open.
const BACKGROUND = [
  /\/notifications(\b|\/|\?)/,
  /\/studio\/(queue|jobs|status)/,
  /\/admin\/studio/,
];

// User-initiated AI work, which is long-running by nature — Dax composing a
// reply can take tens of seconds. This is emphatically NOT page-load data, and
// blocking a full-screen loader on it would be far worse than showing none.
// These endpoints have their own in-context indicators (ThinkingIndicator).
const LONG_RUNNING = [
  { method: 'post', re: /\/dax(\b|\/|\?)/ },
  { method: 'post', re: /\/enhance(\b|\/|\?)/ },
];

export function isBackgroundRequest(url = '', method = 'get') {
  if (BACKGROUND.some((re) => re.test(url))) return true;
  const m = String(method).toLowerCase();
  return LONG_RUNNING.some((r) => r.method === m && r.re.test(url));
}

let count = 0;
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn(count));
}

export function beginRequest() {
  count += 1;
  emit();
}

export function endRequest() {
  // Clamp: a response interceptor firing without its matching request (e.g.
  // hot reload mid-flight) must not drive the count negative and wedge things.
  count = Math.max(0, count - 1);
  emit();
}

export function getInflight() {
  return count;
}

/** Returns an unsubscribe function. */
export function subscribeInflight(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

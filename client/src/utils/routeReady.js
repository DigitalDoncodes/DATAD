/**
 * Signals that a lazily-loaded route has actually mounted.
 *
 * Every page in App.jsx is `lazy(() => import(...))`, and that chunk download
 * is not an axios call — so the in-flight request counter is blind to it. A
 * loading overlay that watches only requests will therefore close while the
 * chunk is still downloading, and the page then mounts and starts fetching
 * *after* the overlay is gone.
 *
 * RouteBeacon lives inside the Suspense boundary. While the chunk is
 * resolving, Suspense tears the subtree's effects down; when it resolves they
 * re-run. So the beacon firing is a reliable "the page component exists now".
 */

let mountedPath = null;
const listeners = new Set();

export function markRouteMounted(path) {
  mountedPath = path;
  listeners.forEach((fn) => fn(path));
}

export function getMountedPath() {
  return mountedPath;
}

/** Returns an unsubscribe function. */
export function subscribeRouteMount(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

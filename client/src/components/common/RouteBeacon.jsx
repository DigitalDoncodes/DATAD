import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { markRouteMounted } from '../../utils/routeReady';

/**
 * Renders nothing. Must be mounted INSIDE the <Suspense> boundary in App.jsx —
 * that placement is the whole point. While a lazy route chunk is resolving,
 * Suspense tears down this subtree's effects, so the effect below only runs
 * once the chunk has actually landed and the page component exists.
 */
export default function RouteBeacon() {
  const { pathname } = useLocation();

  useEffect(() => {
    markRouteMounted(pathname);
  }, [pathname]);

  return null;
}

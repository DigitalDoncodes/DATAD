import { useState, useEffect, useCallback, useRef } from 'react';
import { enhance } from '../api/enhance';

export default function useEnhancement(page, action, data = {}, options = {}) {
  const {
    enabled = true,
    deps = [],
    onResult,
    transform,
    skipCache = false,
  } = options;

  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const mountedRef = useRef(true);

  const run = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await enhance(page, action, data);
      if (!mountedRef.current) return;
      const raw = res.data?.insight;
      const transformed = transform ? transform(raw) : raw;
      setInsight(transformed);
      setMeta({
        provider: res.data?.routing?.provider,
        model: res.data?.routing?.model,
        confidence: res.data?.verification?.confidence,
        latencyMs: res.data?.latencyMs,
        timestamp: res.data?.timestamp,
      });
      onResult?.(transformed);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.response?.data?.message || err.message || 'Enhancement failed');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [page, action, enabled, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) run();
    return () => { mountedRef.current = false; };
  }, [run]);

  const dismiss = useCallback(() => {
    setInsight(null);
  }, []);

  const retry = useCallback(() => {
    run();
  }, [run]);

  return { insight, loading, error, meta, dismiss, retry };
}

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { searchAll, parseIntent, recordClick, getPinned, togglePin, getRecentSearches, getFrequentSearches } from '../api/search';

const DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 2;

const STORAGE_KEYS = {
  recentSearches: 'datad-search-recent-searches',
  frequentSearches: 'datad-search-frequent-searches',
  pinned: 'datad-search-pinned',
};

function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToStorage(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export default function useSearch(options = {}) {
  const {
    debounceMs = DEBOUNCE_MS,
    minLength = MIN_QUERY_LENGTH,
    includeCommands = true,
    enabled = true,
    progressive = false,
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [intent, setIntent] = useState(null);
  const [providerStatus, setProviderStatus] = useState({});
  const [activeProviders, setActiveProviders] = useState(0);
  const [totalProviders, setTotalProviders] = useState(0);
  const [pinned, setPinned] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [frequentSearches, setFrequentSearches] = useState([]);
  const [latency, setLatency] = useState(null);

  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const abortRef = useRef(null);

  const grouped = useMemo(() => {
    const groups = {};
    for (const r of results) {
      const cat = r.category || r.providerLabel || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r);
    }
    for (const c of commands) {
      const cat = c.category || 'Commands';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(c);
    }
    return groups;
  }, [results, commands]);

  const flatList = useMemo(() => {
    const all = [];
    for (const [, items] of Object.entries(grouped)) {
      for (const item of items) {
        all.push(item);
      }
    }
    return all;
  }, [grouped]);

  const hasPartialResults = activeProviders > 0 && results.length > 0;

  const loadLocalData = useCallback(async () => {
    setPinned(loadFromStorage(STORAGE_KEYS.pinned));
    setRecentSearches(loadFromStorage(STORAGE_KEYS.recentSearches));
    setFrequentSearches(loadFromStorage(STORAGE_KEYS.frequentSearches));

    try {
      const [pinnedRes, recentRes, frequentRes] = await Promise.allSettled([
        getPinned(),
        getRecentSearches(),
        getFrequentSearches(),
      ]);
      if (pinnedRes.status === 'fulfilled') setPinned(pinnedRes.value.data || []);
      if (recentRes.status === 'fulfilled') setRecentSearches(recentRes.value.data || []);
      if (frequentRes.status === 'fulfilled') setFrequentSearches(frequentRes.value.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadLocalData();
  }, [loadLocalData]);

  const search = useCallback(async (q) => {
    if (!q || q.length < minLength) {
      setResults([]);
      setCommands([]);
      setIntent(null);
      setProviderStatus({});
      setActiveProviders(0);
      setLatency(null);
      setLoading(false);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort?.();
    }
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setActiveProviders(0);
    setProviderStatus({});

    const startTime = performance.now();

    try {
      const res = await searchAll(q, includeCommands);
      const endTime = performance.now();
      if (mountedRef.current) {
        setResults(res.data?.results || []);
        setCommands(res.data?.commands || []);
        setIntent(res.data?.intent || null);
        setLatency(endTime - startTime);

        const status = {};
        if (res.data?.providerTimings) {
          for (const [id, ms] of Object.entries(res.data.providerTimings)) {
            status[id] = { status: 'done', latencyMs: ms };
          }
        }
        setProviderStatus(status);
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current && err.code !== 'ERR_CANCELED') {
        setError(err.response?.data?.message || err.message || 'Search failed');
        setResults([]);
        setCommands([]);
        setLoading(false);
      }
    }
  }, [minLength, includeCommands]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!enabled) return;

    if (query.length < minLength) {
      setResults([]);
      setCommands([]);
      setIntent(null);
      setProviderStatus({});
      setActiveProviders(0);
      setLatency(null);
      setLoading(false);
      return;
    }

    timerRef.current = setTimeout(() => search(query), debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, debounceMs, minLength, enabled, search]);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setCommands([]);
    setIntent(null);
    setError(null);
    setProviderStatus({});
    setActiveProviders(0);
    setLatency(null);
  }, []);

  const handleSelect = useCallback(async (item) => {
    try {
      await recordClick(query, item.id || item.title, item.category);
    } catch {}

    const recent = loadFromStorage(STORAGE_KEYS.recentSearches);
    const updated = [{ query, timestamp: Date.now() }, ...recent.filter((r) => r.query !== query)].slice(0, 10);
    saveToStorage(STORAGE_KEYS.recentSearches, updated);
    setRecentSearches(updated);
  }, [query]);

  const handlePin = useCallback(async (item) => {
    try {
      const res = await togglePin({
        id: item.id || item.title,
        title: item.title,
        subtitle: item.subtitle,
        url: item.url,
        icon: item.icon,
        category: item.category,
        action: item.action,
      });
      if (res.data?.pinned) {
        setPinned((prev) => [item, ...prev.filter((p) => p.resultId !== item.id && p.id !== item.id)]);
      } else {
        setPinned((prev) => prev.filter((p) => p.resultId !== item.id && p.id !== item.id));
      }
      saveToStorage(STORAGE_KEYS.pinned, res.data?.pinned
        ? [item, ...pinned.filter((p) => p.resultId !== item.id && p.id !== item.id)]
        : pinned.filter((p) => p.resultId !== item.id && p.id !== item.id));
    } catch {}
  }, [pinned]);

  const isPinned = useCallback((itemId) => {
    return pinned.some((p) => p.resultId === itemId || p.id === itemId);
  }, [pinned]);

  return {
    query,
    setQuery,
    results,
    commands,
    grouped,
    flatList,
    loading,
    error,
    intent,
    providerStatus,
    hasPartialResults,
    activeProviders,
    totalProviders,
    latency,
    pinned,
    recentSearches,
    frequentSearches,
    clear,
    search,
    handleSelect,
    handlePin,
    isPinned,
  };
}

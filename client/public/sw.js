// DATAD Service Worker — v3
// Cache strategy:
//   • Static assets  → cache-first (JS/CSS/fonts/images)
//   • Navigation     → network-first, stale-while-revalidate, offline fallback
//   • API            → network-only (never cached)
//   • Background sync → queue offline mutations, flush on reconnect

const CACHE_VERSION = 'v3';
const STATIC_CACHE  = `datad-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `datad-dynamic-${CACHE_VERSION}`;
const SYNC_TAG      = 'datad-background-sync';

// App shell — precache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then((c) => c.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  const keep = [STATIC_CACHE, DYNAMIC_CACHE];
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Message ───────────────────────────────────────────────────────────────────
// Receive SKIP_WAITING from the update-available UI
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data?.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
  if (e.data?.type === 'GET_CACHE_SIZE') {
    getCacheSize().then((size) => e.source.postMessage({ type: 'CACHE_SIZE', size }));
  }
  // iOS Safari has no Background Sync API — the page asks us to flush directly
  if (e.data?.type === 'FLUSH_QUEUE') {
    e.waitUntil?.(flushOfflineQueue());
    if (!e.waitUntil) flushOfflineQueue();
  }
});

// ── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Never intercept cross-origin, chrome-extension, or non-http
  if (!url.protocol.startsWith('http')) return;
  if (url.origin !== self.location.origin) return;

  // Never intercept API calls — always go to network
  if (url.pathname.startsWith('/api/')) return;

  // Navigation requests: network-first, cache as fallback, offline.html last resort
  if (request.mode === 'navigate') {
    e.respondWith(networkFirstNav(request));
    return;
  }

  // Static assets (Vite hashed filenames): cache-first
  if (isStaticAsset(url.pathname)) {
    e.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Everything else: stale-while-revalidate (dynamic pages, icons, fonts)
  e.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ── Strategies ───────────────────────────────────────────────────────────────

async function networkFirstNav(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const shell = await caches.match('/index.html');
    if (shell) return shell;
    return caches.match('/offline.html');
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const c = await caches.open(cacheName);
      c.put(request, res.clone());
    }
    return res;
  } catch {
    return new Response('Asset unavailable offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((res) => {
    if (res.ok) cache.put(request, res.clone());
    return res;
  }).catch(() => null);
  if (cached) return cached;
  const fetched = await fetchPromise;
  if (fetched) return fetched;
  return caches.match('/offline.html');
}

function isStaticAsset(pathname) {
  return /\/assets\/[^/]+\.[a-f0-9]{8,}\.(js|css)$/.test(pathname) ||
    /\.(woff2?|ttf|otf|eot)$/.test(pathname);
}

// ── Background Sync ───────────────────────────────────────────────────────────
self.addEventListener('sync', (e) => {
  if (e.tag === SYNC_TAG) {
    e.waitUntil(flushOfflineQueue());
  }
});

async function flushOfflineQueue() {
  const db = await openDB();
  const items = await getAllItems(db);
  const clients = await self.clients.matchAll();

  if (items.length === 0) return;

  const notify = (msg) => clients.forEach((c) => c.postMessage(msg));
  notify({ type: 'SYNC_START', count: items.length });

  let success = 0;
  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json', ...item.headers },
        body: item.body,
      });
      if (res.ok) {
        await deleteItem(db, item.id);
        success++;
      }
    } catch {
      // Keep in queue for next sync attempt
    }
  }

  notify({ type: 'SYNC_DONE', synced: success, remaining: items.length - success });
}

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || 'DATAD', {
      body: data.body || '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: data.tag || 'datad-notification',
      data: { url: data.url || '/' },
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url === url && 'focus' in c);
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});

// ── IndexedDB Queue ───────────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('datad-sync-queue', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function getAllItems(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readonly');
    const req = tx.objectStore('queue').getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function deleteItem(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite');
    const req = tx.objectStore('queue').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

async function getCacheSize() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const { usage } = await navigator.storage.estimate();
    return usage || 0;
  }
  return 0;
}

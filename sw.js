// ============================================================================
// Promptometer — Progressive Web App (PWA) Offline-First Service Worker
// Cache Name: promptometer-v1.2.0
// Strategies:
//   - Static Assets (HTML/CSS/JS/SVGs/Fonts): Stale-While-Revalidate
//   - API Endpoints (/api/*): Network-First with Fallback
// ============================================================================

const CACHE_NAME = 'promptometer-v1.2.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './favicon.svg',
  './og-image.svg',
  './manifest.json',
  './css/index.css',
  './css/ds/tokens.css',
  './css/ds/base.css',
  './css/ds/components.css',
  './js/i18n.js',
  './js/api-config.js',
  './js/domain-analyzer.js',
  './js/signals.js',
  './js/patterns.js',
  './js/analyzer.js',
  './js/adversarial.js',
  './js/adversarial-fuzzer.js',
  './js/rewriter.js',
  './js/mcp-inspector.js',
  './js/genetic-tuner.js',
  './js/templates.js',
  './js/history.js',
  './js/charts.js',
  './js/export.js',
  './js/models.js',
  './js/knowledge.js',
  './js/leaderboard.js',
  './js/constellation3d.js',
  './js/app.js'
];

// Install Event — Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event — Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event — Offline First with Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests or browser extension requests
  if (req.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // Strategy 1: Network-First for API calls
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // Strategy 2: Stale-While-Revalidate for Static Assets
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      const fetchPromise = fetch(req).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return networkRes;
      }).catch(() => cachedRes);

      return cachedRes || fetchPromise;
    })
  );
});

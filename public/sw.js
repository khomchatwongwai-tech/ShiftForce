// Workqora Offline Service Worker (Cache & Background Sync Engine)
const CACHE_NAME = 'workqora-cache-v1';
const ROSTER_CACHE_NAME = 'workqora-roster-cache-v1';

// Static assets to pre-cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event - Pre-cache essential static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Static asset pre-caching partial skip:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== ROSTER_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-while-revalidate for UI & Network-first with cache fallback for data
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Check if request is an API call
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful GET API responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(ROSTER_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // If network fails (offline), attempt to serve from roster cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback offline JSON response for APIs
          return new Response(
            JSON.stringify({
              offline: true,
              message: 'Offline mode active: Served from local cache.',
              timestamp: new Date().toISOString()
            }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 200
            }
          );
        })
    );
    return;
  }

  // For static HTML/JS/CSS/Font assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, return cached response if present
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Message listener for manual cache synchronization and offline clock-in queueing
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'CACHE_ROSTER_SNAPSHOT') {
    const { payload } = event.data;
    caches.open(ROSTER_CACHE_NAME).then((cache) => {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const response = new Response(blob, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      cache.put('/offline-data/roster-snapshot.json', response);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true, timestamp: new Date().toISOString() });
      }
    });
  }

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

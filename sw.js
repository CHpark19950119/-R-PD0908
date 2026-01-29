const CACHE_NAME = 'psat-dungeon-v26';

// Use relative paths so GitHub Pages sub-path deployments work correctly.
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./app.js",
  "./psat_update.js",
  "./questions.json",
  "./questions_ancient.json",
  "./questions_modern.json",
  "./special_questions.json",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
];
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((name) => {
        if (name !== CACHE_NAME) return caches.delete(name);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // For navigation requests, respond with cached index.html when offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request).then((networkResponse) => {
        // Runtime cache for same-origin GET requests (esp. images)
        if (event.request.method === 'GET' && new URL(event.request.url).origin === location.origin) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      });
    })
  );
});

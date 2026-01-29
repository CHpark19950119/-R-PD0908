const CACHE_NAME = 'psat-dungeon-v25';

// Use relative paths so GitHub Pages sub-path deployments work correctly.
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./psat_update.js",
  "./questions.json",
  "./questions_ancient.json",
  "./questions_modern.json",
  "./special_questions.json",
  "./assets/boss-owl.png",
  "./assets/boss-slime.jpeg",
  "./assets/boss-slime.png",
  "./assets/boss1.png",
  "./assets/boss2.png",
  "./assets/boss_special_1.jpg",
  "./assets/boss_special_2.jpg",
  "./assets/boss_special_3.jpg",
  "./assets/dungeon-bg.png",
  "./assets/dungeon-entrance.png",
  "./assets/dungeon-icon-new.jpeg",
  "./assets/dungeon-icon.jpeg",
  "./assets/dungeon-rooms.jpg",
  "./assets/entrance-bgm.mp3",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maze.jpg",
  "./assets/icon-tower.jpg",
  "./assets/icon-weakness.jpg",
  "./assets/psat_monsters/folder1/stage1_bg_01.png",
  "./assets/psat_monsters/folder1/stage1_bg_02.png",
  "./assets/psat_monsters/folder1/stage1_bg_03.png",
  "./assets/psat_monsters/folder1/stage1_bg_04.png",
  "./assets/psat_monsters/folder1/stage1_bg_05.png",
  "./assets/psat_monsters/folder1/stage1_bg_06.png",
  "./assets/psat_monsters/folder1/stage1_bg_07.png",
  "./assets/psat_monsters/folder1/stage1_bg_08.png",
  "./assets/psat_monsters/folder2/stage2_bg_01.png",
  "./assets/psat_monsters/folder2/stage2_bg_02.png",
  "./assets/psat_monsters/folder2/stage2_bg_03.png",
  "./assets/psat_monsters/folder2/stage2_bg_04.png",
  "./assets/psat_monsters/folder2/stage2_bg_05.png",
  "./assets/psat_monsters/folder2/stage2_bg_06.png",
  "./assets/psat_monsters/folder2/stage2_bg_07.png",
  "./assets/psat_monsters/folder2/stage2_bg_08.png",
  "./assets/psat_monsters/folder3/stage3_bg_01.png",
  "./assets/psat_monsters/folder3/stage3_bg_02.png",
  "./assets/psat_monsters/folder3/stage3_bg_03.png",
  "./assets/psat_monsters/folder3/stage3_bg_04.png",
  "./assets/psat_monsters/folder3/stage3_bg_05.png",
  "./assets/psat_monsters/folder3/stage3_bg_06.png",
  "./assets/psat_monsters/folder3/stage3_bg_07.png",
  "./assets/psat_monsters/folder3/stage3_bg_08.png",
  "./assets/psat_monsters/boss/boss_1.png",
  "./assets/psat_monsters/boss/boss_2.png",
  "./assets/psat_monsters/boss/boss_3.png",
  "./assets/psat_monsters/boss/boss_4.png"
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

/**
 * sw.js — Momentum Life v5
 */
const CACHE = 'momentum-v5';

const ASSETS = [
  '/Momentum/',
  '/Momentum/index.html',
  '/Momentum/manifest.json',
  '/Momentum/icon-192x192.png',
  '/Momentum/icon-512x512.png',
  '/Momentum/screenshot-portrait.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(url => c.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Skip cross-origin requests (Google APIs etc.)
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Return cached version immediately if available
      if (cached) return cached;

      // Fetch from network
      return fetch(e.request).then(response => {
        // Only cache valid responses
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }

        // Clone BEFORE reading — fixes the "body already used" error
        const responseToCache = response.clone();
        caches.open(CACHE).then(cache => {
          cache.put(e.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Offline fallback for navigation
        if (e.request.mode === 'navigate') {
          return caches.match('/Momentum/index.html');
        }
      });
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/Momentum/'));
});

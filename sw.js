/**
 * sw.js — Momentum Life Service Worker
 * Optimisé pour GitHub Pages : https://eps-kbapp.github.io/Momentum/
 */

const CACHE_NAME = 'momentum-v4';
const BASE = '/Momentum';

const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icons/icon-192x192.png',
  BASE + '/icons/icon-512x512.png',
];

// Install : précache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('SW install cache error:', err))
  );
});

// Activate : nettoie les vieux caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch : Cache First, fallback réseau
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Google Calendar API → network only
  if (event.request.url.includes('googleapis.com')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Fonts → stale-while-revalidate
  if (event.request.url.includes('fonts.google') || event.request.url.includes('fonts.gstatic')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          const network = fetch(event.request).then(resp => {
            cache.put(event.request, resp.clone());
            return resp;
          });
          return cached || network;
        })
      )
    );
    return;
  }

  // Tout le reste : cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        if (!resp || resp.status !== 200 || resp.type === 'opaque') return resp;
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resp.clone()));
        return resp;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match(BASE + '/index.html');
        }
      });
    })
  );
});

// Notifications push
self.addEventListener('push', event => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch(e) {}
  self.registration.showNotification(data.title || 'Momentum Life', {
    body: data.body || "C'est l'heure de ton action !",
    icon: BASE + '/icons/icon-192x192.png',
    badge: BASE + '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(BASE + '/'));
});

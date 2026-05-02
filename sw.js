/**
 * sw.js — Momentum Life Service Worker
 * Compatible GitHub Pages (sous-dossier) + domaine racine
 */

const CACHE_NAME = 'momentum-v3';

// Paths relatifs — fonctionnent peu importe le sous-dossier GitHub Pages
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
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
          return caches.match('./index.html');
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
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    vibrate: [200, 100, 200],
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('./'));
});

// ─────────────────────────────────────────────────────────────
// Momentum SW — version horodatée pour forcer la mise à jour
// Ce fichier change à chaque déploiement → cache invalidé auto
// ─────────────────────────────────────────────────────────────
const VERSION = 'momentum-v__BUILD_TS__'; // remplacé lors du build
const CACHE   = `momentum-${Date.now()}`; // cache unique à chaque SW

// Fichiers à mettre en cache pour le mode hors-ligne
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
];

// ── Installation : mise en cache initiale ──────────────────
self.addEventListener('install', e => {
  // skipWaiting : active immédiatement sans attendre la fermeture des onglets
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).catch(() => {})
  );
});

// ── Activation : supprime tous les anciens caches ──────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch : network-first pour index.html, cache sinon ─────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Toujours réseau pour index.html → garantit la dernière version
  if (url.pathname.endsWith('index.html') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first pour les assets statiques (images, icônes…)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});

// ── Message : SKIP_WAITING forcé depuis l'app ──────────────
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

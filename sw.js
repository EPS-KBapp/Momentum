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
          .filter(k => k !== CACHE && k !== 'chill-sw-data') // préserve le KV store
          .map(k => caches.delete(k))
      )
    ).then(() => {
      self.clients.claim();
      scheduleNextDailyNotif(); // démarre la boucle de notification
    })
  );
});

// ── Fetch : network-first pour index.html, cache sinon ─────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Ne pas intercepter le KV store interne
  if (url.pathname.startsWith('/__swdata/')) return;

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

// ── Messages depuis l'app ──────────────────────────────────
self.addEventListener('message', e => {
  const { type, payload } = e.data || {};

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // L'app envoie les objectifs + heure pour planifier la notif quotidienne
  if (type === 'SCHEDULE_DAILY_NOTIF') {
    storeData('notif_schedule', payload).then(() => scheduleNextDailyNotif());
  }

  // L'app demande un test immédiat
  if (type === 'TEST_NOTIF') {
    triggerDailyNotif();
  }
});

// ── Clic sur une notification ──────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const action = e.action || '';
  const data   = e.notification.data || {};

  if (action.startsWith('validate_')) {
    const objId = action.replace('validate_', '');
    e.waitUntil(validateFromNotif(objId));
  } else {
    // Clic sur la notif elle-même ou bouton "Ouvrir" → focus/ouvre l'app
    e.waitUntil(openApp());
  }
});

// ═══════════════════════════════════════════════════════════
// ── Notifications quotidiennes ─────────────────────────────
// ═══════════════════════════════════════════════════════════

let _notifTimer = null;

async function scheduleNextDailyNotif() {
  if (_notifTimer) { clearTimeout(_notifTimer); _notifTimer = null; }

  const schedule = await getData('notif_schedule');
  if (!schedule?.enabled) return;

  const [hh, mm] = (schedule.time || '09:00').split(':').map(Number);
  const now  = new Date();
  const next = new Date(now);
  next.setHours(hh, mm, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1); // demain si l'heure est passée

  const delay = next - now;
  _notifTimer = setTimeout(async () => {
    await triggerDailyNotif();
    scheduleNextDailyNotif(); // replanifie pour le lendemain
  }, delay);
}

async function triggerDailyNotif() {
  const schedule   = await getData('notif_schedule');
  const objectives = schedule?.objectives || [];
  const todayStr   = new Date().toISOString().slice(0, 10);

  const pending = objectives.filter(o => !o.doneToday);
  const done    = objectives.filter(o =>  o.doneToday);

  if (!objectives.length) {
    return self.registration.showNotification('🌅 Bonne journée !', {
      body: 'Ouvre Chill pour voir tes actions du jour.',
      icon:    './icon-192x192.png',
      badge:   './icon-96x96.png',
      tag:     'daily-chill',
      actions: [{ action: 'open_app', title: '📱 Ouvrir' }],
      data:    {},
    });
  }

  // Boutons d'action : 2 objectifs max (limite Android) + Ouvrir
  const actions = pending.slice(0, 2).map(o => ({
    action: `validate_${o.id}`,
    title:  `✓ ${o.title.slice(0, 20)}`,
  }));
  actions.push({ action: 'open_app', title: '📱 Ouvrir' });

  const bodyLines = pending.slice(0, 3).map(o => `• ${o.icon || '🎯'} ${o.title}`);
  if (done.length) bodyLines.push(`✅ ${done.length}/${objectives.length} déjà fait${done.length > 1 ? 's' : ''}`);

  const title = pending.length
    ? `🎯 ${pending.length} action${pending.length > 1 ? 's' : ''} à faire aujourd'hui`
    : `🎉 Toutes tes actions sont faites !`;

  return self.registration.showNotification(title, {
    body:               bodyLines.join('\n'),
    icon:               './icon-192x192.png',
    badge:              './icon-96x96.png',
    tag:                'daily-chill',
    renotify:           true,
    requireInteraction: pending.length > 0, // reste visible si actions à faire
    actions,
    data: { date: todayStr },
  });
}

// ── Valide un objectif depuis la notification ──────────────
async function validateFromNotif(objId) {
  const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });

  if (all.length) {
    // App ouverte : délègue à l'app et focus
    all[0].postMessage({ type: 'VALIDATE_OBJ', objId });
    return all[0].focus();
  }

  // App fermée : stocke en attente, confirme par une notif silencieuse
  const pending = (await getData('pending_validations')) || [];
  if (!pending.includes(objId)) pending.push(objId);
  await storeData('pending_validations', pending);

  return self.registration.showNotification('✅ Validé !', {
    body:    'Sera enregistré à la prochaine ouverture de l\'app.',
    icon:    './icon-192x192.png',
    badge:   './icon-96x96.png',
    tag:     'validation-confirm',
    silent:  true,
  });
}

async function openApp() {
  const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  if (all.length) return (all.find(c => c.focused) || all[0]).focus();
  return clients.openWindow('./');
}

// ═══════════════════════════════════════════════════════════
// ── Mini KV store (Cache API utilisée comme stockage clé/valeur)
// ═══════════════════════════════════════════════════════════

function storeData(key, value) {
  return caches.open('chill-sw-data').then(cache =>
    cache.put(
      new Request(`/__swdata/${key}`),
      new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } })
    )
  );
}

async function getData(key) {
  const cache = await caches.open('chill-sw-data');
  const res   = await cache.match(new Request(`/__swdata/${key}`));
  if (!res) return null;
  try { return await res.json(); } catch { return null; }
}

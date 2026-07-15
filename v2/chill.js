/* Native Chill v2 — keeps legacy lt6_* data keys. */
(function () {
  'use strict';

  const state = { tab: 'w', activeListId: null };
  const CATS = [
    ['livre', '📚 Livre'], ['film', '🎬 Film'], ['série', '📺 Série'], ['anime', '⛩️ Anime'],
    ['manga/bd', '📖 Manga / BD'], ['jeu vidéo', '🎮 Jeu vidéo'], ['jeu de société', '🎲 Jeu de société'],
    ['vinyle', '🎵 Vinyle'], ['vêtement', '👕 Vêtement'], ['chaussures', '👟 Chaussures'],
    ['accessoires', '💍 Accessoires'], ['sport', '⚽ Sport'], ['voyage', '✈️ Voyage'],
    ['expérience', '🌟 Expérience'], ['restaurant', '🍽️ Restaurant'], ['autre', '◈ Autre'],
  ];
  const EM = { vinyle:'🎵', livre:'📚', film:'🎬', 'série':'📺', 'jeu vidéo':'🎮', 'jeu de société':'🎲', anime:'⛩️', 'manga/bd':'📖', vêtement:'👕', chaussures:'👟', accessoires:'💍', sport:'⚽', voyage:'✈️', expérience:'🌟', évènement:'🎟️', restaurant:'🍽️', autre:'◈', musique:'🎵', concert:'🎤' };

  function sGet(key, fallback) {
    try {
      const raw = localStorage.getItem('lt6_' + key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function sSet(key, value) {
    localStorage.setItem('lt6_' + key, JSON.stringify(value));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function readData() {
    let wishLists = sGet('wlists', null);
    if (!wishLists) {
      const legacyWishes = sGet('w', []);
      wishLists = [{ id: uid(), name: 'Mes envies', icon: '🎁', wishes: legacyWishes }];
      sSet('wlists', wishLists);
      sSet('wlists_active', wishLists[0].id);
    }
    if (!Array.isArray(wishLists) || !wishLists.length) {
      wishLists = [{ id: uid(), name: 'Mes envies', icon: '🎁', wishes: [] }];
    }
    const savedActive = sGet('wlists_active', wishLists[0].id);
    state.activeListId = wishLists.some(list => list.id === (state.activeListId || savedActive))
      ? (state.activeListId || savedActive)
      : wishLists[0].id;

    return {
      wishLists,
      buckets: arrayish(sGet('b', [])),
      accs: arrayish(sGet('a', [])),
    };
  }

  function writeData(data) {
    sSet('wlists', data.wishLists);
    sSet('wlists_active', state.activeListId);
    sSet('b', data.buckets);
    sSet('a', data.accs);
  }

  function arrayish(value) {
    return Array.isArray(value) ? value : [];
  }

  function allWishes(data) {
    return data.wishLists.flatMap(list => arrayish(list.wishes).map(wish => ({ ...wish, _listId: list.id, _listName: list.name })));
  }

  function currentList(data) {
    return data.wishLists.find(list => list.id === state.activeListId) || data.wishLists[0];
  }

  function counts(data) {
    const wishes = allWishes(data);
    return {
      w: wishes.filter(w => !w.checked).length,
      b: data.buckets.filter(b => !b.done).length,
      c: wishes.filter(w => w.checked).length + data.buckets.filter(b => b.done).length,
      a: data.accs.length,
    };
  }

  function render(root) {
    const host = root.querySelector('[data-chill-native-host]');
    if (!host) return;
    const data = readData();
    const c = counts(data);
    const originWarning = location.hostname !== 'eps-kbapp.github.io'
      ? '<div class="legacy-origin-warning">Tu testes depuis un domaine différent de GitHub Pages. Tes données historiques Chill restent sur <strong>eps-kbapp.github.io</strong>. Après fusion, la v2 pourra accéder au même domaine.</div>'
      : '';

    host.innerHTML = `
      <div class="chill-native">
        ${originWarning}
        <header class="chill-hero">
          <div>
            <div class="chill-kicker">Espace natif</div>
            <h1>Chill</h1>
            <p>Envies, bucket list, obtenu et progressions — données historiques conservées.</p>
            <div class="chill-summary">
              <span class="chill-pill">🎁 ${c.w} envie(s)</span>
              <span class="chill-pill">🌟 ${c.b} bucket</span>
              <span class="chill-pill">✓ ${c.c} obtenu(s)</span>
              <span class="chill-pill">◎ ${c.a} progression(s)</span>
            </div>
          </div>
        </header>
        <nav class="chill-tabs" aria-label="Navigation Chill">
          ${tabButton('w', '🎁 Envies', c.w)}
          ${tabButton('b', '🌟 Bucket list', c.b)}
          ${tabButton('c', '✓ Obtenu', c.c)}
          ${tabButton('a', '◎ Progressions', c.a)}
        </nav>
        <main data-chill-panel>${renderPanel(data)}</main>
      </div>
    `;
    bind(host);
  }

  function tabButton(id, label, count) {
    return `<button class="${state.tab === id ? 'active' : ''}" data-chill-tab="${id}">${label} · ${count}</button>`;
  }

  function renderPanel(data) {
    if (state.tab === 'b') return renderBuckets(data);
    if (state.tab === 'c') return renderChecked(data);
    if (state.tab === 'a') return renderAccs(data);
    return renderWishes(data);
  }

  function renderWishes(data) {
    const list = currentList(data);
    const wishes = arrayish(list.wishes).filter(w => !w.checked);
    return `
      <section class="chill-panel">
        <h2>Mes Envies</h2>
        <p>Liste active : <strong>${escapeHtml(list.icon || '🎁')} ${escapeHtml(list.name || 'Mes envies')}</strong></p>
        ${renderListBar(data)}
        <div class="chill-actions">
          <button class="chill-btn primary" data-add-wish>+ Ajouter une envie</button>
          <button class="chill-btn" data-add-wishlist>+ Nouvelle liste</button>
        </div>
      </section>
      ${wishes.length ? `<div class="chill-grid">${wishes.map(wish => renderCard(wish, 'wish')).join('')}</div>` : '<div class="chill-empty">Aucune envie active dans cette liste.</div>'}
    `;
  }

  function renderListBar(data) {
    return `<div class="chill-listbar">${data.wishLists.map(list => `
      <button class="${list.id === state.activeListId ? 'active' : ''}" data-set-list="${list.id}">${escapeHtml(list.icon || '🎁')} ${escapeHtml(list.name || 'Liste')}</button>
    `).join('')}</div>`;
  }

  function renderBuckets(data) {
    const buckets = data.buckets.filter(item => !item.done);
    return `
      <section class="chill-panel">
        <h2>Bucket List</h2>
        <p>Films, séries, livres, voyages, expériences… tout ce qui est à vivre.</p>
        <div class="chill-actions"><button class="chill-btn primary" data-add-bucket>+ Ajouter</button></div>
      </section>
      ${buckets.length ? `<div class="chill-grid">${buckets.map(item => renderCard(item, 'bucket')).join('')}</div>` : '<div class="chill-empty">Aucun élément actif dans la bucket list.</div>'}
    `;
  }

  function renderChecked(data) {
    const checkedWishes = allWishes(data).filter(w => w.checked);
    const doneBuckets = data.buckets.filter(b => b.done);
    const cards = [
      ...checkedWishes.map(w => renderCard(w, 'wish', true)),
      ...doneBuckets.map(b => renderCard(b, 'bucket', true)),
    ].join('');
    return `
      <section class="chill-panel">
        <h2>Obtenu & Accompli</h2>
        <p>Ce que tu as reçu, acheté, vu, lu ou réalisé.</p>
      </section>
      ${cards ? `<div class="chill-grid">${cards}</div>` : '<div class="chill-empty">Rien dans Obtenu pour le moment.</div>'}
    `;
  }

  function renderAccs(data) {
    return `
      <section class="chill-panel">
        <h2>Progressions</h2>
        <p>Sagas, séries, animes, livres ou parcours suivis dans le temps.</p>
        <div class="chill-actions"><button class="chill-btn primary" data-add-acc>+ Ajouter une progression</button></div>
      </section>
      ${data.accs.length ? `<div class="chill-grid">${data.accs.map(renderAcc).join('')}</div>` : '<div class="chill-empty">Aucune progression enregistrée.</div>'}
    `;
  }

  function renderCard(item, type, archived = false) {
    const cat = item.cat || item.category || 'autre';
    const title = item.name || item.title || 'Sans titre';
    const author = item.auth || item.author || item.platform || '';
    const desc = item.desc || item.description || '';
    const price = item.pr || item.price || '';
    const img = item.img || item.image || item.cover || '';
    return `
      <article class="chill-card">
        <div class="chill-thumb">${img ? `<img src="${escapeHtml(img)}" alt="">` : escapeHtml(EM[cat] || '◈')}</div>
        <div class="chill-card-body">
          <div class="chill-card-top">
            <div>
              <div class="chill-cat">${escapeHtml(cat)}</div>
              <div class="chill-title">${escapeHtml(title)}</div>
            </div>
          </div>
          ${author ? `<div class="chill-desc">${escapeHtml(author)}</div>` : ''}
          ${desc ? `<p class="chill-desc">${escapeHtml(desc)}</p>` : ''}
          <div class="chill-meta">
            ${price ? `<span>${escapeHtml(price)} €</span>` : ''}
            ${item._listName ? `<span>${escapeHtml(item._listName)}</span>` : ''}
            ${archived ? '<span>✓ obtenu</span>' : ''}
          </div>
          <div class="chill-card-actions">
            ${!archived ? `<button class="chill-small-btn" data-toggle-${type}="${item.id}">✓ Marquer obtenu</button>` : `<button class="chill-small-btn" data-toggle-${type}="${item.id}">↩ Remettre actif</button>`}
            <button class="chill-small-btn" data-delete-${type}="${item.id}">Supprimer</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderAcc(item) {
    const total = Number(item.total || item.eps || item.chapters || 0);
    const current = Number(item.current || item.cur || item.done || 0);
    const pct = total ? Math.min(100, Math.round((current / total) * 100)) : Number(item.progress || 0);
    const title = item.name || item.title || 'Progression';
    return `
      <article class="chill-card">
        <div class="chill-card-body">
          <div class="chill-cat">${escapeHtml(item.cat || item.category || 'progression')}</div>
          <div class="chill-title">${escapeHtml(title)}</div>
          <p class="chill-desc">${total ? `${current}/${total}` : `${pct}%`} complété</p>
          <div class="chill-progress"><span style="width:${pct}%"></span></div>
          <div class="chill-card-actions">
            <button class="chill-small-btn" data-progress-acc="${item.id}">+1</button>
            <button class="chill-small-btn" data-delete-acc="${item.id}">Supprimer</button>
          </div>
        </div>
      </article>
    `;
  }

  function bind(host) {
    if (host.dataset.chillBound === 'true') return;
    host.dataset.chillBound = 'true';
    host.addEventListener('click', event => {
      const tab = event.target.closest('[data-chill-tab]')?.dataset.chillTab;
      if (tab) { state.tab = tab; return rerender(host); }

      const listId = event.target.closest('[data-set-list]')?.dataset.setList;
      if (listId) { state.activeListId = listId; sSet('wlists_active', listId); return rerender(host); }

      if (event.target.closest('[data-add-wishlist]')) return addWishList(host);
      if (event.target.closest('[data-add-wish]')) return addWish(host);
      if (event.target.closest('[data-add-bucket]')) return addBucket(host);
      if (event.target.closest('[data-add-acc]')) return addAcc(host);

      const actions = [
        ['toggleWish', '[data-toggle-wish]', 'toggleWish'],
        ['toggleBucket', '[data-toggle-bucket]', 'toggleBucket'],
        ['deleteWish', '[data-delete-wish]', 'deleteWish'],
        ['deleteBucket', '[data-delete-bucket]', 'deleteBucket'],
        ['deleteAcc', '[data-delete-acc]', 'deleteAcc'],
        ['progressAcc', '[data-progress-acc]', 'progressAcc'],
      ];
      for (const [, selector, fn] of actions) {
        const el = event.target.closest(selector);
        if (el) return mutate(host, fn, el.dataset[fn]);
      }
    });
  }

  function rerender(host) {
    const root = host.closest('#space-chill');
    render(root);
  }

  function mutate(host, action, id) {
    const data = readData();
    if (action === 'toggleWish') {
      for (const list of data.wishLists) {
        const wish = arrayish(list.wishes).find(item => item.id === id);
        if (wish) wish.checked = !wish.checked;
      }
    }
    if (action === 'toggleBucket') {
      const item = data.buckets.find(bucket => bucket.id === id);
      if (item) item.done = !item.done;
    }
    if (action === 'deleteWish') {
      data.wishLists.forEach(list => { list.wishes = arrayish(list.wishes).filter(item => item.id !== id); });
    }
    if (action === 'deleteBucket') data.buckets = data.buckets.filter(item => item.id !== id);
    if (action === 'deleteAcc') data.accs = data.accs.filter(item => item.id !== id);
    if (action === 'progressAcc') {
      const item = data.accs.find(acc => acc.id === id);
      if (item) {
        const current = Number(item.current || item.cur || item.done || 0) + 1;
        item.current = current;
        item.cur = current;
      }
    }
    writeData(data);
    rerender(host);
  }

  function addWishList(host) {
    const data = readData();
    const name = prompt('Nom de la nouvelle liste d’envies ?');
    if (!name) return;
    const icon = prompt('Icône de la liste ?', '🎁') || '🎁';
    const list = { id: uid(), name: name.trim(), icon: icon.trim(), wishes: [] };
    data.wishLists.push(list);
    state.activeListId = list.id;
    writeData(data);
    rerender(host);
  }

  function addWish(host) {
    const data = readData();
    const list = currentList(data);
    const name = prompt('Nom de l’envie ?');
    if (!name) return;
    const cat = chooseCategory('Catégorie de l’envie ?') || 'autre';
    const auth = prompt('Auteur / marque / précision ?', '') || '';
    const pr = prompt('Prix indicatif ?', '') || '';
    const desc = prompt('Note / description ?', '') || '';
    list.wishes = arrayish(list.wishes);
    list.wishes.unshift({ id: uid(), name: name.trim(), cat, auth, pr, desc, checked: false, createdAt: new Date().toISOString() });
    writeData(data);
    rerender(host);
  }

  function addBucket(host) {
    const data = readData();
    const name = prompt('Nom de l’élément à vivre / voir / lire ?');
    if (!name) return;
    const cat = chooseCategory('Catégorie bucket list ?') || 'expérience';
    const desc = prompt('Note / description ?', '') || '';
    data.buckets.unshift({ id: uid(), name: name.trim(), cat, desc, done: false, createdAt: new Date().toISOString() });
    writeData(data);
    rerender(host);
  }

  function addAcc(host) {
    const data = readData();
    const name = prompt('Nom de la saga / série / progression ?');
    if (!name) return;
    const total = Number(prompt('Nombre total d’éléments / épisodes / chapitres ?', '10') || 0);
    const current = Number(prompt('Déjà réalisés ?', '0') || 0);
    const cat = chooseCategory('Catégorie de progression ?') || 'série';
    data.accs.unshift({ id: uid(), name: name.trim(), cat, total, current, cur: current, createdAt: new Date().toISOString() });
    writeData(data);
    rerender(host);
  }

  function chooseCategory(label) {
    const fallback = prompt(`${label}\n${CATS.map(c => c[0]).join(', ')}`, 'autre');
    return fallback || '';
  }

  window.MomentumChill = { render };
}());
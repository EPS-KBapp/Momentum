/* Native Chill v2 — keeps legacy lt6_* data keys. */
(function () {
  'use strict';

  const state = { tab: 'w', activeListId: null, form: null };
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

  function arrayish(value) {
    return Array.isArray(value) ? value : [];
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

    wishLists.forEach(list => {
      if (!list.id) list.id = uid();
      if (!Array.isArray(list.wishes)) list.wishes = [];
      list.wishes.forEach(wish => { if (!wish.id) wish.id = uid(); });
    });

    const buckets = arrayish(sGet('b', [])).map(item => {
      if (!item.id) item.id = uid();
      return item;
    });
    const accs = arrayish(sGet('a', [])).map(item => {
      if (!item.id) item.id = uid();
      return item;
    });

    const savedActive = sGet('wlists_active', wishLists[0].id);
    const wantedId = state.activeListId || savedActive;
    state.activeListId = wishLists.some(list => list.id === wantedId) ? wantedId : wishLists[0].id;

    const data = { wishLists, buckets, accs };
    writeData(data);
    return data;
  }

  function writeData(data) {
    sSet('wlists', data.wishLists);
    sSet('wlists_active', state.activeListId);
    sSet('b', data.buckets);
    sSet('a', data.accs);
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
          <button class="chill-btn primary" data-open-chill-form="wish">+ Ajouter une envie</button>
          <button class="chill-btn" data-open-chill-form="wishlist">+ Nouvelle liste</button>
        </div>
        ${state.form === 'wish' ? renderWishForm() : ''}
        ${state.form === 'wishlist' ? renderWishListForm() : ''}
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
        <div class="chill-actions"><button class="chill-btn primary" data-open-chill-form="bucket">+ Ajouter</button></div>
        ${state.form === 'bucket' ? renderBucketForm() : ''}
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
        <div class="chill-actions"><button class="chill-btn primary" data-open-chill-form="acc">+ Ajouter une progression</button></div>
        ${state.form === 'acc' ? renderAccForm() : ''}
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

  function renderWishForm() {
    return renderItemForm('wish', 'Nouvelle envie', 'Nom de l’envie', true);
  }

  function renderBucketForm() {
    return renderItemForm('bucket', 'Nouvel élément Bucket list', 'Nom de l’élément', false);
  }

  function renderWishListForm() {
    return `
      <form class="chill-form-grid" data-chill-form="wishlist">
        <label class="chill-field"><span>Nom de la liste</span><input name="name" required placeholder="Ex. Noël, Anniversaire, Ma liste"></label>
        <label class="chill-field"><span>Icône</span><input name="icon" value="🎁" maxlength="4"></label>
        <div class="chill-form-actions">
          <button class="chill-btn primary" type="submit">Enregistrer</button>
          <button class="chill-btn" type="button" data-close-chill-form>Annuler</button>
        </div>
      </form>
    `;
  }

  function renderItemForm(type, title, placeholder, includePrice) {
    return `
      <form class="chill-form-grid" data-chill-form="${type}">
        <h3>${title}</h3>
        <label class="chill-field"><span>Titre</span><input name="name" required placeholder="${placeholder}"></label>
        <label class="chill-field"><span>Catégorie</span><select name="cat">${categoryOptions()}</select></label>
        <label class="chill-field"><span>Auteur / marque / précision</span><input name="auth" placeholder="Optionnel"></label>
        ${includePrice ? '<label class="chill-field"><span>Prix indicatif</span><input name="pr" inputmode="decimal" placeholder="Optionnel"></label>' : ''}
        <label class="chill-field"><span>Image URL</span><input name="img" placeholder="Optionnel"></label>
        <label class="chill-field"><span>Note / description</span><textarea name="desc" placeholder="Optionnel"></textarea></label>
        <div class="chill-form-actions">
          <button class="chill-btn primary" type="submit">Enregistrer</button>
          <button class="chill-btn" type="button" data-close-chill-form>Annuler</button>
        </div>
      </form>
    `;
  }

  function renderAccForm() {
    return `
      <form class="chill-form-grid" data-chill-form="acc">
        <h3>Nouvelle progression</h3>
        <label class="chill-field"><span>Titre</span><input name="name" required placeholder="Ex. Naruto Shippuden, One Piece, Série"></label>
        <label class="chill-field"><span>Catégorie</span><select name="cat">${categoryOptions('série')}</select></label>
        <label class="chill-field"><span>Total</span><input name="total" type="number" min="0" placeholder="Nombre total"></label>
        <label class="chill-field"><span>Déjà réalisé</span><input name="current" type="number" min="0" value="0"></label>
        <div class="chill-form-actions">
          <button class="chill-btn primary" type="submit">Enregistrer</button>
          <button class="chill-btn" type="button" data-close-chill-form>Annuler</button>
        </div>
      </form>
    `;
  }

  function categoryOptions(selected = 'autre') {
    return CATS.map(([value, label]) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${label}</option>`).join('');
  }

  function bind(host) {
    if (host.dataset.chillBound === 'true') return;
    host.dataset.chillBound = 'true';

    host.addEventListener('click', event => {
      const tab = event.target.closest('[data-chill-tab]')?.dataset.chillTab;
      if (tab) { state.tab = tab; state.form = null; return rerender(host); }

      const listId = event.target.closest('[data-set-list]')?.dataset.setList;
      if (listId) { state.activeListId = listId; state.form = null; sSet('wlists_active', listId); return rerender(host); }

      const formType = event.target.closest('[data-open-chill-form]')?.dataset.openChillForm;
      if (formType) { state.form = state.form === formType ? null : formType; return rerender(host); }

      if (event.target.closest('[data-close-chill-form]')) { state.form = null; return rerender(host); }

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

    host.addEventListener('submit', event => {
      const form = event.target.closest('[data-chill-form]');
      if (!form) return;
      event.preventDefault();
      submitForm(host, form.dataset.chillForm, Object.fromEntries(new FormData(form).entries()));
    });
  }

  function rerender(host) {
    const root = host.closest('#space-chill');
    render(root);
  }

  function submitForm(host, type, values) {
    const data = readData();
    if (type === 'wishlist') {
      const list = { id: uid(), name: String(values.name || '').trim(), icon: String(values.icon || '🎁').trim() || '🎁', wishes: [] };
      if (!list.name) return;
      data.wishLists.push(list);
      state.activeListId = list.id;
    }

    if (type === 'wish') {
      const list = currentList(data);
      if (!values.name) return;
      list.wishes = arrayish(list.wishes);
      list.wishes.unshift({
        id: uid(), name: String(values.name).trim(), cat: values.cat || 'autre', auth: values.auth || '',
        pr: values.pr || '', desc: values.desc || '', img: values.img || '', checked: false, createdAt: new Date().toISOString(),
      });
    }

    if (type === 'bucket') {
      if (!values.name) return;
      data.buckets.unshift({
        id: uid(), name: String(values.name).trim(), cat: values.cat || 'expérience', auth: values.auth || '',
        desc: values.desc || '', img: values.img || '', done: false, createdAt: new Date().toISOString(),
      });
    }

    if (type === 'acc') {
      if (!values.name) return;
      const current = Number(values.current || 0);
      data.accs.unshift({
        id: uid(), name: String(values.name).trim(), cat: values.cat || 'série', total: Number(values.total || 0),
        current, cur: current, createdAt: new Date().toISOString(),
      });
    }

    state.form = null;
    writeData(data);
    rerender(host);
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
    state.form = null;
    writeData(data);
    rerender(host);
  }

  window.MomentumChill = { render };
}());

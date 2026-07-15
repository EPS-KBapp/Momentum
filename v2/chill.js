(function () {
  'use strict';

  const TMDB_KEY = '8265bd1679663a7ea12ac168da84d2e8';
  const RAWG_KEY = '441c433882834d408929cddf346edff1';

  const S = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(`lt6_${key}`);
        return raw ? JSON.parse(raw) : fallback;
      } catch (error) {
        console.warn('Chill storage read failed', key, error);
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(`lt6_${key}`, JSON.stringify(value));
    },
  };

  const state = { tab: 'wishes', editing: null };

  const typeLabels = {
    film: 'Film',
    serie: 'Série',
    livre: 'Livre',
    manga: 'Manga',
    anime: 'Anime',
    jeu: 'Jeu vidéo',
    musique: 'Musique',
    concert: 'Concert',
    resto: 'Restaurant',
    voyage: 'Voyage',
    autre: 'Autre',
  };

  function render(root) {
    const shell = root.querySelector('[data-chill-native]');
    if (!shell) return;
    shell.innerHTML = `
      <article class="panel">
        <h3>Chill natif</h3>
        <p>Intégration native en cours : les envies, bucket list et obtenu utilisent les clés historiques du Chill stable. La recherche de jaquette/couverture est réactivée sur les nouveaux ajouts.</p>
        <div class="actions-row">
          <a class="secondary-btn" href="https://eps-kbapp.github.io/Momentum/" target="_blank" rel="noopener">Ouvrir Chill stable</a>
        </div>
      </article>
      <nav class="subnav chill-native-tabs" aria-label="Navigation Chill natif">
        ${tabButton('wishes', 'Envies')}
        ${tabButton('bucket', 'Bucket list')}
        ${tabButton('obtained', 'Obtenu')}
        ${tabButton('progress', 'Progressions')}
      </nav>
      ${renderActiveTab()}
    `;
    bind(shell);
  }

  function tabButton(id, label) {
    return `<button type="button" class="${state.tab === id ? 'active' : ''}" data-chill-tab="${id}">${label}</button>`;
  }

  function renderActiveTab() {
    if (state.tab === 'wishes') return renderWishes();
    if (state.tab === 'bucket') return renderBucket();
    if (state.tab === 'obtained') return renderObtained();
    return renderProgress();
  }

  function getWishData() {
    const lists = S.get('wlists', null);
    const activeId = S.get('wlists_active', null);
    if (Array.isArray(lists)) {
      const active = lists.find(list => list.id === activeId) || lists[0];
      return { lists, active, items: normalizeArray(active?.items || active?.wishes || active?.data || []) };
    }
    if (lists && typeof lists === 'object') {
      const values = Object.values(lists);
      const active = lists[activeId] || values[0];
      return { lists, active, items: normalizeArray(active?.items || active?.wishes || active?.data || active || []) };
    }
    const legacy = S.get('w', []);
    return { lists: [], active: null, items: normalizeArray(legacy) };
  }

  function setWishItems(items) {
    const lists = S.get('wlists', null);
    const activeId = S.get('wlists_active', null);
    if (Array.isArray(lists) && lists.length) {
      const next = lists.map((list, index) => {
        if ((activeId && list.id === activeId) || (!activeId && index === 0)) return { ...list, items };
        return list;
      });
      S.set('wlists', next);
      return;
    }
    S.set('w', items);
  }

  function renderWishes() {
    const data = getWishData();
    return `
      <article class="panel">
        <h3>Envies</h3>
        <p>${data.active?.name || data.active?.title ? `Liste active : <strong>${e(data.active.name || data.active.title)}</strong>` : 'Ajoute les films, séries, livres, albums, jeux ou sorties que tu veux garder en tête.'}</p>
        ${itemForm('wish')}
      </article>
      ${itemList(data.items, 'wish')}
    `;
  }

  function renderBucket() {
    const items = normalizeArray(S.get('b', []));
    return `
      <article class="panel">
        <h3>Bucket list</h3>
        <p>Les expériences plus grandes ou plus rares : voyages, événements, projets personnels, choses à faire au moins une fois.</p>
        ${itemForm('bucket')}
      </article>
      ${itemList(items, 'bucket')}
    `;
  }

  function renderObtained() {
    const items = normalizeArray(S.get('a', []));
    return `
      <article class="panel">
        <h3>Obtenu</h3>
        <p>Ce que tu as vu, lu, fait, acheté ou terminé.</p>
        ${itemForm('obtained')}
      </article>
      ${itemList(items, 'obtained')}
    `;
  }

  function renderProgress() {
    const wishes = getWishData().items;
    const bucket = normalizeArray(S.get('b', []));
    const obtained = normalizeArray(S.get('a', []));
    return `
      <article class="panel">
        <h3>Progressions</h3>
        <div class="metric-grid">
          <article class="metric-card"><strong>${wishes.length}</strong><span>envie(s)</span></article>
          <article class="metric-card"><strong>${bucket.length}</strong><span>bucket list</span></article>
          <article class="metric-card"><strong>${obtained.length}</strong><span>obtenu</span></article>
          <article class="metric-card"><strong>${wishes.length + bucket.length + obtained.length}</strong><span>total Chill</span></article>
        </div>
        <p>Cette partie sera enrichie avec les mêmes progressions que le Chill stable : listes, statuts, médias et historique.</p>
      </article>
    `;
  }

  function itemForm(kind) {
    return `
      <form class="goal-form" data-chill-form="${kind}">
        <label class="field"><span>Titre</span><input name="title" required placeholder="Ex. Dune 2, Zelda, Japon, restaurant…" /></label>
        <label class="field"><span>Type</span><select name="type">
          ${Object.entries(typeLabels).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
        </select></label>
        <label class="field"><span>Image / pochette URL</span><input name="image" placeholder="Optionnel : sinon recherche automatique" /></label>
        <label class="field"><span>Notes</span><textarea name="notes" placeholder="Pourquoi ça te tente ? Avec qui ? Où ?"></textarea></label>
        <button class="primary-btn" type="submit">Ajouter avec recherche</button>
      </form>
    `;
  }

  function itemList(items, kind) {
    if (!items.length) return '<div class="empty">Aucun élément pour le moment.</div>';
    return `<div class="goal-list chill-list">${items.map(item => renderItem(item, kind)).join('')}</div>`;
  }

  function renderItem(item, kind) {
    const title = item.title || item.name || item.label || 'Sans titre';
    const type = item.type || item.kind || item.category || 'autre';
    const image = getImage(item);
    const notes = item.notes || item.note || item.description || item.desc || '';
    return `
      <article class="goal-card chill-item" data-chill-item="${e(item.id)}" data-kind="${kind}">
        ${image ? `<div class="chill-cover"><img src="${e(image)}" alt="" loading="lazy"></div>` : ''}
        <div class="chill-item-body">
          <header>
            <div class="goal-title">${e(title)}</div>
            <span class="badge">${e(typeLabels[type] || type)}</span>
          </header>
          ${item.coverSource ? `<p class="goal-desc"><strong>Couverture :</strong> ${e(item.coverSource)}</p>` : ''}
          ${notes ? `<p class="goal-desc">${e(notes)}</p>` : ''}
          <div class="actions-row">
            ${kind !== 'obtained' ? `<button class="secondary-btn" type="button" data-chill-obtain="${e(item.id)}" data-kind="${kind}">Marquer obtenu</button>` : ''}
            <button class="secondary-btn" type="button" data-chill-delete="${e(item.id)}" data-kind="${kind}">Supprimer</button>
          </div>
        </div>
      </article>
    `;
  }

  function bind(root) {
    if (root.dataset.chillNativeBound === 'true') return;
    root.dataset.chillNativeBound = 'true';

    root.addEventListener('click', event => {
      const tab = event.target.closest('[data-chill-tab]')?.dataset.chillTab;
      const deleteBtn = event.target.closest('[data-chill-delete]');
      const obtainBtn = event.target.closest('[data-chill-obtain]');
      if (tab) {
        state.tab = tab;
        rerender();
        return;
      }
      if (deleteBtn) {
        mutateKind(deleteBtn.dataset.kind, items => items.filter(item => String(item.id) !== String(deleteBtn.dataset.chillDelete)));
        rerender();
        return;
      }
      if (obtainBtn) {
        const kind = obtainBtn.dataset.kind;
        const id = obtainBtn.dataset.chillObtain;
        const items = getItems(kind);
        const item = items.find(entry => String(entry.id) === String(id));
        if (item) {
          mutateKind(kind, current => current.filter(entry => String(entry.id) !== String(id)));
          const obtained = normalizeArray(S.get('a', []));
          S.set('a', [{ ...item, status: 'obtained', obtainedAt: today() }, ...obtained]);
          state.tab = 'obtained';
          rerender();
        }
      }
    });

    root.addEventListener('submit', async event => {
      const form = event.target.closest('[data-chill-form]');
      if (!form) return;
      event.preventDefault();
      const kind = form.dataset.chillForm;
      const data = Object.fromEntries(new FormData(form).entries());
      const submit = form.querySelector('[type="submit"]');
      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Recherche…';
      }
      const cover = data.image ? { image: data.image, coverSource: 'URL manuelle' } : await findCover(data.title, data.type);
      const item = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: data.title,
        type: data.type || 'autre',
        image: cover.image || '',
        poster: cover.image || '',
        cover: cover.image || '',
        coverSource: cover.coverSource || '',
        notes: data.notes || '',
        createdAt: today(),
      };
      mutateKind(kind, items => [item, ...items]);
      form.reset();
      if (submit) {
        submit.disabled = false;
        submit.textContent = 'Ajouter avec recherche';
      }
      rerender();
    });
  }

  async function findCover(title, type) {
    const query = String(title || '').trim();
    if (!query) return {};
    const sources = coverSources(type);
    for (const source of sources) {
      try {
        const result = await source(query, type);
        if (result?.image) return result;
      } catch (error) {
        console.warn('Chill cover lookup failed', source.name, error);
      }
    }
    return { image: '', coverSource: 'Aucune couverture trouvée automatiquement' };
  }

  function coverSources(type) {
    if (type === 'livre') return [searchOpenLibrary];
    if (type === 'anime' || type === 'manga') return [searchJikan, searchOpenLibrary];
    if (type === 'film') return [searchTmdbMovie, searchOpenLibrary];
    if (type === 'serie') return [searchTmdbTv, searchJikan];
    if (type === 'jeu') return [searchRawg];
    if (type === 'musique' || type === 'concert') return [searchMusicBrainz];
    return [searchOpenLibrary, searchJikan, searchTmdbMovie, searchRawg];
  }

  async function searchOpenLibrary(query) {
    const data = await fetchJson(`https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=1`);
    const doc = data?.docs?.[0];
    if (!doc?.cover_i) return null;
    return { image: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`, coverSource: 'OpenLibrary' };
  }

  async function searchJikan(query, type) {
    const endpoint = type === 'manga' ? 'manga' : 'anime';
    const data = await fetchJson(`https://api.jikan.moe/v4/${endpoint}?q=${encodeURIComponent(query)}&limit=1`);
    const item = data?.data?.[0];
    const image = item?.images?.jpg?.large_image_url || item?.images?.webp?.large_image_url || item?.images?.jpg?.image_url;
    return image ? { image, coverSource: 'Jikan / MyAnimeList' } : null;
  }

  async function searchTmdbMovie(query) {
    if (!TMDB_KEY) return null;
    const data = await fetchJson(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&language=fr-FR&query=${encodeURIComponent(query)}&include_adult=false`);
    const item = data?.results?.find(result => result.poster_path) || data?.results?.[0];
    return item?.poster_path ? { image: `https://image.tmdb.org/t/p/w500${item.poster_path}`, coverSource: 'TMDB' } : null;
  }

  async function searchTmdbTv(query) {
    if (!TMDB_KEY) return null;
    const data = await fetchJson(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&language=fr-FR&query=${encodeURIComponent(query)}&include_adult=false`);
    const item = data?.results?.find(result => result.poster_path) || data?.results?.[0];
    return item?.poster_path ? { image: `https://image.tmdb.org/t/p/w500${item.poster_path}`, coverSource: 'TMDB' } : null;
  }

  async function searchRawg(query) {
    const key = RAWG_KEY ? `&key=${RAWG_KEY}` : '';
    const data = await fetchJson(`https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&page_size=1${key}`);
    const item = data?.results?.[0];
    return item?.background_image ? { image: item.background_image, coverSource: 'RAWG' } : null;
  }

  async function searchMusicBrainz(query) {
    const data = await fetchJson(`https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(query)}&fmt=json&limit=1`);
    const release = data?.releases?.[0];
    if (!release?.id) return null;
    return { image: `https://coverartarchive.org/release/${release.id}/front-500`, coverSource: 'MusicBrainz / Cover Art Archive' };
  }

  async function fetchJson(url) {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.json();
  }

  function getImage(item) {
    return item.image || item.poster || item.cover || item.img || item.thumbnail || item.coverUrl || item.posterUrl || item.background_image || '';
  }

  function getItems(kind) {
    if (kind === 'wish') return getWishData().items;
    if (kind === 'bucket') return normalizeArray(S.get('b', []));
    return normalizeArray(S.get('a', []));
  }

  function mutateKind(kind, updater) {
    if (kind === 'wish') {
      setWishItems(updater(getWishData().items));
      return;
    }
    if (kind === 'bucket') {
      S.set('b', updater(normalizeArray(S.get('b', []))));
      return;
    }
    S.set('a', updater(normalizeArray(S.get('a', []))));
  }

  function normalizeArray(value) {
    if (Array.isArray(value)) return value.map(normalizeItem);
    if (value && typeof value === 'object') return Object.values(value).map(normalizeItem);
    return [];
  }

  function normalizeItem(item) {
    if (!item || typeof item !== 'object') return { id: `${Date.now()}-${Math.random()}`, title: String(item || '') };
    return { id: item.id || item.uid || item.key || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...item };
  }

  function rerender() {
    const root = document.querySelector('#space-chill');
    if (root) render(root);
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function e(value) {
    return MomentumGoals?.escapeHtml ? MomentumGoals.escapeHtml(value) : String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
  }

  window.MomentumChill = { render };
}());
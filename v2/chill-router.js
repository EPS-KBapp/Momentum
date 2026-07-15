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

  const state = { tab: 'wishes' };

  const typeLabels = {
    film: 'Film',
    serie: 'Série',
    livre: 'Livre',
    manga: 'Manga',
    anime: 'Anime',
    jeu: 'Jeu vidéo',
    musique: 'Musique',
    vinyle: 'Vinyle',
    concert: 'Concert',
    resto: 'Restaurant',
    voyage: 'Voyage',
    autre: 'Autre',
  };

  const apiLabels = {
    film: 'TMDB · films',
    serie: 'TMDB · séries',
    livre: 'OpenLibrary · livres',
    manga: 'Jikan · manga, puis anime si besoin',
    anime: 'Jikan · anime, puis manga si besoin',
    jeu: 'RAWG · jeux vidéo',
    musique: 'iTunes + MusicBrainz · albums',
    vinyle: 'iTunes + MusicBrainz · vinyles / albums',
    concert: 'MusicBrainz · musique',
    resto: 'Aucune API de pochette adaptée pour les restaurants',
    voyage: 'Aucune API de pochette adaptée pour les voyages',
    autre: 'Aucune API spécialisée pour cette catégorie',
  };

  function render(root) {
    const shell = root.querySelector('[data-chill-native]');
    if (!shell) return;
    shell.innerHTML = `
      <article class="panel">
        <h3>Chill</h3>
        <p>Choisis une liste d’envies, une catégorie, puis lance une recherche ciblée. Quand l’API fournit un résumé, il peut remplir automatiquement les notes.</p>
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

  function ensureWishData() {
    const lists = S.get('wlists', null);
    const activeId = S.get('wlists_active', null);
    if (Array.isArray(lists) && lists.length) {
      const active = lists.find(list => String(list.id) === String(activeId)) || lists[0];
      if (!activeId || String(active.id) !== String(activeId)) S.set('wlists_active', active.id);
      return { lists: lists.map(normalizeList), active: normalizeList(active), items: normalizeArray(active?.items || []) };
    }

    const legacy = normalizeArray(S.get('w', []));
    const initial = [{ id: 'default', name: 'Mes envies', items: legacy }];
    S.set('wlists', initial);
    S.set('wlists_active', 'default');
    return { lists: initial, active: initial[0], items: legacy };
  }

  function normalizeList(list) {
    return {
      id: list?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: list?.name || list?.title || 'Liste sans nom',
      items: normalizeArray(list?.items || list?.wishes || list?.data || []),
    };
  }

  function setWishItems(items) {
    const data = ensureWishData();
    const next = data.lists.map(list => String(list.id) === String(data.active.id) ? { ...list, items } : list);
    S.set('wlists', next);
    S.set('wlists_active', data.active.id);
  }

  function setActiveWishList(id) {
    const data = ensureWishData();
    const exists = data.lists.some(list => String(list.id) === String(id));
    if (exists) S.set('wlists_active', id);
  }

  function addWishList(name) {
    const label = String(name || '').trim();
    if (!label) return;
    const data = ensureWishData();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    S.set('wlists', [...data.lists, { id, name: label, items: [] }]);
    S.set('wlists_active', id);
  }

  function deleteActiveWishList() {
    const data = ensureWishData();
    if (data.lists.length <= 1) return;
    const next = data.lists.filter(list => String(list.id) !== String(data.active.id));
    S.set('wlists', next);
    S.set('wlists_active', next[0]?.id || 'default');
  }

  function renderWishes() {
    const data = ensureWishData();
    return `
      <article class="panel">
        <h3>Envies</h3>
        <p>Liste active : <strong>${e(data.active.name)}</strong></p>
        ${renderWishLists(data)}
        ${itemForm('wish')}
      </article>
      ${itemList(data.items, 'wish')}
    `;
  }

  function renderWishLists(data) {
    return `
      <div class="chill-people-panel">
        <div class="chill-people-list" aria-label="Listes d’envies">
          ${data.lists.map(list => `<button type="button" class="secondary-btn ${String(list.id) === String(data.active.id) ? 'active' : ''}" data-chill-list="${e(list.id)}">${e(list.name)}</button>`).join('')}
        </div>
        <form class="chill-list-form actions-row" data-chill-list-form>
          <input name="name" placeholder="Nouvelle liste : moi, femme, filles…" />
          <button class="secondary-btn" type="submit">Créer</button>
          ${data.lists.length > 1 ? '<button class="secondary-btn" type="button" data-delete-active-list>Supprimer cette liste</button>' : ''}
        </form>
      </div>
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
    const wishes = ensureWishData();
    const bucket = normalizeArray(S.get('b', []));
    const obtained = normalizeArray(S.get('a', []));
    const wishTotal = wishes.lists.reduce((total, list) => total + normalizeArray(list.items).length, 0);
    return `
      <article class="panel">
        <h3>Progressions</h3>
        <div class="metric-grid">
          <article class="metric-card"><strong>${wishes.lists.length}</strong><span>liste(s)</span></article>
          <article class="metric-card"><strong>${wishTotal}</strong><span>envie(s)</span></article>
          <article class="metric-card"><strong>${bucket.length}</strong><span>bucket list</span></article>
          <article class="metric-card"><strong>${obtained.length}</strong><span>obtenu</span></article>
        </div>
        <p>Les envies peuvent maintenant être séparées par personne ou par usage : toi, ta femme, tes filles, cadeaux, vacances, etc.</p>
      </article>
    `;
  }

  function itemForm(kind) {
    return `
      <form class="goal-form chill-add-form" data-chill-form="${kind}">
        <label class="field"><span>Titre</span><input name="title" required placeholder="Ex. Death Note, Zelda, Fauve Nuits Fauves…" /></label>
        <label class="field"><span>Type</span><select name="type" data-chill-type>
          ${Object.entries(typeLabels).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
        </select></label>
        <p class="goal-desc" data-chill-api-label>API utilisée : ${apiLabels.film}</p>
        <details class="chill-manual-url">
          <summary>URL manuelle de pochette</summary>
          <label class="field"><span>Image / pochette URL</span><input name="image" data-chill-image-input placeholder="Optionnel" /></label>
        </details>
        <input type="hidden" name="coverSource" data-chill-cover-source />
        <div class="actions-row">
          <button class="secondary-btn" type="button" data-chill-cover-search>Rechercher des pochettes</button>
        </div>
        <div class="chill-cover-status" data-chill-cover-status hidden></div>
        <div class="chill-cover-picker" data-chill-cover-picker hidden></div>
        <label class="field"><span>Notes</span><textarea name="notes" data-chill-notes placeholder="Résumé disponible automatiquement selon l’API, ou note personnelle."></textarea></label>
        <button class="primary-btn" type="submit">Ajouter</button>
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
        ${image ? `<div class="chill-cover"><img src="${e(image)}" alt="" loading="lazy"></div>` : '<div class="chill-cover chill-cover-empty">♪</div>'}
        <div class="chill-item-body">
          <header>
            <div class="goal-title">${e(title)}</div>
            <span class="badge">${e(typeLabels[type] || type)}</span>
          </header>
          ${item.coverSource ? `<p class="goal-desc"><strong>Pochette :</strong> ${e(item.coverSource)}</p>` : ''}
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
    if (root.dataset.chillRouterBound === 'true') return;
    root.dataset.chillRouterBound = 'true';

    root.addEventListener('change', event => {
      const typeSelect = event.target.closest('[data-chill-type]');
      if (!typeSelect) return;
      const form = typeSelect.closest('[data-chill-form]');
      const label = form?.querySelector('[data-chill-api-label]');
      if (label) label.textContent = `API utilisée : ${apiLabels[typeSelect.value] || apiLabels.autre}`;
      clearCoverChoice(form);
      renderCoverChoices(form, []);
    });

    root.addEventListener('click', async event => {
      const tab = event.target.closest('[data-chill-tab]')?.dataset.chillTab;
      const listBtn = event.target.closest('[data-chill-list]');
      const deleteListBtn = event.target.closest('[data-delete-active-list]');
      const coverBtn = event.target.closest('[data-chill-cover-search]');
      const coverChoice = event.target.closest('[data-chill-cover-index]');
      const deleteBtn = event.target.closest('[data-chill-delete]');
      const obtainBtn = event.target.closest('[data-chill-obtain]');

      if (tab) {
        state.tab = tab;
        rerender();
        return;
      }
      if (listBtn) {
        setActiveWishList(listBtn.dataset.chillList);
        rerender();
        return;
      }
      if (deleteListBtn) {
        deleteActiveWishList();
        rerender();
        return;
      }
      if (coverChoice) {
        event.preventDefault();
        selectCoverChoice(coverChoice.closest('[data-chill-form]'), Number(coverChoice.dataset.chillCoverIndex));
        return;
      }
      if (coverBtn) {
        event.preventDefault();
        await lookupCoverForForm(coverBtn.closest('[data-chill-form]'), coverBtn);
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
      const listForm = event.target.closest('[data-chill-list-form]');
      if (listForm) {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(listForm).entries());
        addWishList(data.name);
        listForm.reset();
        rerender();
        return;
      }

      const form = event.target.closest('[data-chill-form]');
      if (!form) return;
      event.preventDefault();
      const kind = form.dataset.chillForm;
      const data = Object.fromEntries(new FormData(form).entries());
      const submit = form.querySelector('[type="submit"]');
      try {
        setBusy(submit, true, 'Ajout…');
        let cover = data.image ? { image: data.image, coverSource: data.coverSource || 'URL manuelle', description: '' } : null;
        if (!cover) {
          setFormStatus(form, 'Recherche ciblée en cours…');
          const covers = await findCovers(data.title, data.type);
          renderCoverChoices(form, covers);
          cover = covers[0] || null;
          if (cover) selectCoverChoice(form, 0, false);
        }
        const notes = data.notes || cover?.description || '';
        const item = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: data.title,
          type: data.type || 'autre',
          image: cover?.image || '',
          poster: cover?.image || '',
          cover: cover?.image || '',
          coverSource: cover?.coverSource || 'Aucune pochette trouvée automatiquement',
          notes,
          createdAt: today(),
        };
        mutateKind(kind, items => [item, ...items]);
        form.reset();
        rerender();
      } catch (error) {
        console.error('Chill add failed', error);
        setFormStatus(form, 'Erreur pendant la recherche. L’élément n’a pas été ajouté.', true);
      } finally {
        setBusy(submit, false, 'Ajouter');
      }
    });
  }

  async function lookupCoverForForm(form, button) {
    if (!form) return;
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.title) {
      setFormStatus(form, 'Ajoute d’abord un titre pour lancer la recherche.', true);
      return;
    }
    try {
      setBusy(button, true, 'Recherche…');
      setFormStatus(form, 'Recherche ciblée en cours…');
      const covers = await findCovers(data.title, data.type);
      renderCoverChoices(form, covers);
      if (covers.length) {
        selectCoverChoice(form, 0);
        setFormStatus(form, `${covers.length} résultat(s) via ${apiLabels[data.type] || 'API ciblée'}. Choisis la pochette à garder.`);
      } else {
        clearCoverChoice(form);
        setFormStatus(form, 'Aucun résultat dans l’API ciblée. Essaie un titre plus précis ou colle une URL manuelle.', true);
      }
    } catch (error) {
      console.error('Cover lookup failed', error);
      clearCoverChoice(form);
      setFormStatus(form, 'La recherche ciblée a échoué. Tu peux coller une URL manuelle.', true);
    } finally {
      setBusy(button, false, 'Rechercher des pochettes');
    }
  }

  async function findCovers(title, type) {
    const query = String(title || '').trim();
    if (!query) return [];
    const sources = coverSources(type);
    const results = [];
    for (const source of sources) {
      try {
        const items = await source(query, type);
        const normalized = Array.isArray(items) ? items : (items ? [items] : []);
        normalized.forEach(item => {
          if (!item?.image) return;
          if (results.some(existing => existing.image === item.image)) return;
          results.push(item);
        });
        if (results.length >= 6) break;
      } catch (error) {
        console.warn('Chill cover lookup failed', source.name, error);
      }
    }
    return results.slice(0, 6);
  }

  function coverSources(type) {
    if (type === 'film') return [searchTmdbMovie];
    if (type === 'serie') return [searchTmdbTv];
    if (type === 'livre') return [searchOpenLibrary];
    if (type === 'manga') return [searchJikanManga, searchJikanAnime];
    if (type === 'anime') return [searchJikanAnime, searchJikanManga];
    if (type === 'jeu') return [searchRawg];
    if (type === 'musique' || type === 'vinyle') return [searchItunesAlbums, searchMusicBrainz];
    if (type === 'concert') return [searchMusicBrainz];
    return [];
  }

  async function searchOpenLibrary(query) {
    const data = await fetchJson(`https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=6`);
    return (data?.docs || []).filter(doc => doc?.cover_i).slice(0, 6).map(doc => ({
      image: `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`,
      coverSource: 'OpenLibrary',
      description: [doc.author_name?.[0], doc.first_publish_year ? `Première publication : ${doc.first_publish_year}` : ''].filter(Boolean).join(' · '),
    }));
  }

  async function searchJikanAnime(query) {
    return searchJikan(query, 'anime', 'Jikan · anime');
  }

  async function searchJikanManga(query) {
    return searchJikan(query, 'manga', 'Jikan · manga');
  }

  async function searchJikan(query, endpoint, sourceLabel) {
    const data = await fetchJson(`https://api.jikan.moe/v4/${endpoint}?q=${encodeURIComponent(query)}&sfw=true&limit=6`);
    return (data?.data || []).map(item => {
      const image = item?.images?.jpg?.image_url || item?.images?.webp?.image_url || item?.images?.jpg?.large_image_url;
      const title = item?.title_french || item?.title || item?.title_english || '';
      const synopsis = cleanText(item?.synopsis || '');
      return image ? { image, coverSource: `${sourceLabel}${title ? ` · ${title}` : ''}`, description: synopsis } : null;
    }).filter(Boolean).slice(0, 6);
  }

  async function searchTmdbMovie(query) {
    const data = await fetchJson(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&language=fr-FR&query=${encodeURIComponent(query)}&include_adult=false`);
    return (data?.results || []).filter(result => result.poster_path).slice(0, 6).map(result => ({
      image: `https://image.tmdb.org/t/p/w342${result.poster_path}`,
      coverSource: `TMDB · ${result.title || result.original_title || 'Film'}`,
      description: cleanText(result.overview || ''),
    }));
  }

  async function searchTmdbTv(query) {
    const data = await fetchJson(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&language=fr-FR&query=${encodeURIComponent(query)}&include_adult=false`);
    return (data?.results || []).filter(result => result.poster_path).slice(0, 6).map(result => ({
      image: `https://image.tmdb.org/t/p/w342${result.poster_path}`,
      coverSource: `TMDB · ${result.name || result.original_name || 'Série'}`,
      description: cleanText(result.overview || ''),
    }));
  }

  async function searchRawg(query) {
    const key = RAWG_KEY ? `&key=${RAWG_KEY}` : '';
    const data = await fetchJson(`https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&page_size=6${key}`);
    return (data?.results || []).filter(item => item.background_image).slice(0, 6).map(item => ({
      image: item.background_image,
      coverSource: `RAWG · ${item.name || 'Jeu vidéo'}`,
      description: [item.released ? `Sortie : ${item.released}` : '', item.rating ? `Note RAWG : ${item.rating}/5` : ''].filter(Boolean).join(' · '),
    }));
  }

  async function searchItunesAlbums(query) {
    const data = await fetchJson(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=FR&media=music&entity=album&limit=6`);
    return (data?.results || []).filter(item => item.artworkUrl100).slice(0, 6).map(item => ({
      image: String(item.artworkUrl100).replace('100x100bb', '600x600bb'),
      coverSource: `iTunes · ${item.artistName || ''}${item.collectionName ? ` · ${item.collectionName}` : ''}`,
      description: [item.artistName, item.collectionName, item.releaseDate ? `Sortie : ${String(item.releaseDate).slice(0, 10)}` : ''].filter(Boolean).join(' · '),
    }));
  }

  async function searchMusicBrainz(query) {
    const data = await fetchJson(`https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(query)}&fmt=json&limit=10`);
    const releases = data?.releases || [];
    const covers = [];
    for (const release of releases) {
      if (!release?.id) continue;
      const cover = await searchCoverArtArchive(release.id, release);
      if (cover?.image && !covers.some(item => item.image === cover.image)) covers.push(cover);
      if (covers.length >= 6) break;
    }
    return covers;
  }

  async function searchCoverArtArchive(releaseId, release = {}) {
    try {
      const data = await fetchJson(`https://coverartarchive.org/release/${releaseId}`);
      const image = data?.images?.find(item => item.front)?.thumbnails?.large || data?.images?.find(item => item.front)?.thumbnails?.small || data?.images?.[0]?.thumbnails?.large || data?.images?.[0]?.thumbnails?.small || data?.images?.[0]?.image;
      const artist = release['artist-credit']?.map(entry => entry?.name).filter(Boolean).join(', ');
      const title = release.title || '';
      return image ? {
        image,
        coverSource: `MusicBrainz · ${[artist, title].filter(Boolean).join(' · ') || 'album'}`,
        description: [artist, title, release.date ? `Sortie : ${release.date}` : ''].filter(Boolean).join(' · '),
      } : null;
    } catch (error) {
      return null;
    }
  }

  function renderCoverChoices(form, covers) {
    const picker = form?.querySelector('[data-chill-cover-picker]');
    if (!picker) return;
    form.__coverResults = covers;
    if (!covers.length) {
      picker.hidden = true;
      picker.innerHTML = '';
      return;
    }
    picker.hidden = false;
    picker.innerHTML = `
      <p>Choisis une pochette :</p>
      <div class="chill-cover-options">
        ${covers.map((cover, index) => `
          <button type="button" class="chill-cover-choice ${index === 0 ? 'active' : ''}" data-chill-cover-index="${index}" aria-label="Choisir la pochette ${index + 1}">
            <img src="${e(cover.image)}" alt="" loading="lazy">
          </button>
        `).join('')}
      </div>
    `;
  }

  function selectCoverChoice(form, index, fillNotes = true) {
    const cover = form?.__coverResults?.[index];
    if (!cover) return;
    const imageInput = form.querySelector('[data-chill-image-input]');
    const sourceInput = form.querySelector('[data-chill-cover-source]');
    const notesInput = form.querySelector('[data-chill-notes]');
    if (imageInput) imageInput.value = cover.image || '';
    if (sourceInput) sourceInput.value = cover.coverSource || 'Sélection';
    if (fillNotes && notesInput && !String(notesInput.value || '').trim() && cover.description) notesInput.value = cover.description;
    form.querySelectorAll('[data-chill-cover-index]').forEach(button => button.classList.toggle('active', Number(button.dataset.chillCoverIndex) === index));
  }

  function clearCoverChoice(form) {
    if (!form) return;
    form.__coverResults = [];
    const imageInput = form.querySelector('[data-chill-image-input]');
    const sourceInput = form.querySelector('[data-chill-cover-source]');
    if (imageInput) imageInput.value = '';
    if (sourceInput) sourceInput.value = '';
  }

  async function fetchJson(url) {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.json();
  }

  function setBusy(button, busy, label) {
    if (!button) return;
    button.disabled = busy;
    button.textContent = label;
  }

  function setFormStatus(form, message, isError = false) {
    const status = form?.querySelector('[data-chill-cover-status]');
    if (!status) return;
    status.hidden = false;
    status.textContent = message;
    status.classList.toggle('is-error', Boolean(isError));
  }

  function getImage(item) {
    return item.image || item.poster || item.cover || item.img || item.thumbnail || item.coverUrl || item.posterUrl || item.background_image || '';
  }

  function getItems(kind) {
    if (kind === 'wish') return ensureWishData().items;
    if (kind === 'bucket') return normalizeArray(S.get('b', []));
    return normalizeArray(S.get('a', []));
  }

  function mutateKind(kind, updater) {
    if (kind === 'wish') {
      setWishItems(updater(ensureWishData().items));
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

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').replace(/\[Written by MAL Rewrite\]/gi, '').trim();
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
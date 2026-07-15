(function () {
  'use strict';

  const categories = [
    ['lecture', 'Lecture'],
    ['guitare', 'Guitare'],
    ['enfants', 'Moments avec enfants'],
    ['experience', 'Expériences'],
    ['creatif', 'Créatif'],
    ['bricolage', 'Bricolage'],
    ['autre', 'Autre'],
  ];

  function render(spaceRoot) {
    renderOverview(spaceRoot);
    renderGoals(spaceRoot);
    renderPractices(spaceRoot);
    renderBooks(spaceRoot);
  }

  function renderOverview(root) {
    const panel = root.querySelector('[data-panel="overview"]');
    const goals = MomentumGoals.listGoals('hobbies');
    const actions = MomentumGoals.listActions('hobbies');
    const logs = MomentumGoals.listLogs('hobbies');
    const books = MomentumGoals.listItems('hobby_books');
    const experiences = MomentumGoals.listItems('hobby_experiences');
    panel.innerHTML = `
      <div class="metric-grid">
        <article class="metric-card"><strong>${goals.filter(g => g.status === 'active').length}</strong><span>objectif(s) actif(s)</span></article>
        <article class="metric-card"><strong>${actions.filter(a => a.status === 'planned').length}</strong><span>action(s) prévue(s)</span></article>
        <article class="metric-card"><strong>${books.length}</strong><span>livre(s)</span></article>
        <article class="metric-card"><strong>${experiences.length}</strong><span>expérience(s)</span></article>
      </div>
      <article class="panel">
        <h3>Dernières pratiques</h3>
        ${logs.length ? logList('hobbies') : '<p>Aucune pratique réalisée enregistrée pour le moment.</p>'}
      </article>
    `;
  }

  function renderGoals(root) {
    const panel = root.querySelector('[data-panel="goals"]');
    panel.innerHTML = goalForm('hobbies', categories) + goalList('hobbies');
    bindGoalForm(panel, 'hobbies');
  }

  function renderPractices(root) {
    const panel = root.querySelector('[data-panel="practices"]');
    panel.innerHTML = actionForm('hobbies', categories, {
      title: 'Planifier une pratique',
      placeholder: 'Ex. Guitare 20 min, sortie enfants, lecture calme',
      intensity: 'Ex. facile, important, plaisir, priorité haute',
      content: 'Ce que tu veux faire, apprendre, partager ou tester',
    }) + logForm('hobbies', {
      title: 'Enregistrer une pratique réalisée',
      placeholder: 'Ex. Guitare improvisée, lecture non prévue',
      content: 'Ce qui a été fait, ressenti, progrès, souvenir',
    }) + '<h3 class="section-subtitle">Actions prévues</h3>' + actionList('hobbies') + '<h3 class="section-subtitle">Réalisé</h3>' + logList('hobbies');
    bindActionForm(panel, 'hobbies');
    bindLogForm(panel, 'hobbies');
  }

  function renderBooks(root) {
    const panel = root.querySelector('[data-panel="books"]');
    panel.innerHTML = `
      <article class="panel">
        <h3>Ajouter un livre</h3>
        <form class="goal-form" data-book-form>
          <label class="field"><span>Titre</span><input name="title" required placeholder="Titre du livre" /></label>
          <label class="field"><span>Auteur</span><input name="author" placeholder="Auteur" /></label>
          <label class="field"><span>Pages totales</span><input name="totalPages" type="number" min="0" placeholder="Ex. 320" /></label>
          <label class="field"><span>Page actuelle</span><input name="currentPage" type="number" min="0" placeholder="Ex. 45" /></label>
          <label class="field"><span>Statut</span><select name="status"><option value="to-read">À lire</option><option value="reading">En cours</option><option value="done">Terminé</option><option value="paused">En pause</option></select></label>
          <label class="field"><span>Notes</span><textarea name="notes" placeholder="Pourquoi le lire, idée importante, avis…"></textarea></label>
          <button class="primary-btn" type="submit">Ajouter le livre</button>
        </form>
      </article>
      <article class="panel">
        <h3>Ajouter une expérience / un moment</h3>
        <form class="goal-form" data-experience-form>
          <label class="field"><span>Titre</span><input name="title" required placeholder="Ex. Sortie forêt avec les enfants" /></label>
          <label class="field"><span>Date prévue</span><input name="date" type="date" /></label>
          <label class="field"><span>Contexte</span><input name="context" placeholder="Enfants, couple, famille, solo…" /></label>
          <label class="field"><span>Statut</span><select name="status"><option value="idea">Idée</option><option value="planned">Prévu</option><option value="done">Réalisé</option></select></label>
          <label class="field"><span>Notes</span><textarea name="notes" placeholder="Idée, souvenir, prochaine étape"></textarea></label>
          <button class="primary-btn" type="submit">Ajouter l’expérience</button>
        </form>
      </article>
      <h3 class="section-subtitle">Livres</h3>
      ${renderBooksList()}
      <h3 class="section-subtitle">Expériences / moments</h3>
      ${renderExperienceList()}
    `;
    bindBooks(panel);
  }

  function bindBooks(panel) {
    panel.querySelector('[data-book-form]')?.addEventListener('submit', event => {
      event.preventDefault();
      MomentumGoals.createItem('hobby_books', Object.fromEntries(new FormData(event.currentTarget).entries()));
      render(document.querySelector('#space-hobbies'));
    });
    panel.querySelector('[data-experience-form]')?.addEventListener('submit', event => {
      event.preventDefault();
      MomentumGoals.createItem('hobby_experiences', Object.fromEntries(new FormData(event.currentTarget).entries()));
      render(document.querySelector('#space-hobbies'));
    });
    panel.addEventListener('click', event => {
      const bookId = event.target.closest('[data-delete-book]')?.dataset.deleteBook;
      const expId = event.target.closest('[data-delete-experience]')?.dataset.deleteExperience;
      if (bookId) MomentumGoals.deleteItem('hobby_books', bookId);
      if (expId) MomentumGoals.deleteItem('hobby_experiences', expId);
      if (bookId || expId) render(document.querySelector('#space-hobbies'));
    }, { once: true });
  }

  function renderBooksList() {
    const books = MomentumGoals.listItems('hobby_books');
    if (!books.length) return '<div class="empty">Aucun livre suivi.</div>';
    return `<div class="goal-list">${books.map(book => {
      const total = Number(book.totalPages || 0);
      const current = Number(book.currentPage || 0);
      const progress = total ? Math.min(100, Math.round((current / total) * 100)) : 0;
      return `<article class="goal-card"><header><div class="goal-title">${e(book.title)}</div><span class="badge">${bookStatus(book.status)}</span></header><div class="goal-meta"><span>${e(book.author || 'Auteur non renseigné')}</span>${total ? `<span>${current}/${total} pages · ${progress}%</span>` : ''}</div>${book.notes ? `<p class="goal-desc">${e(book.notes)}</p>` : ''}<div class="progress-track"><span style="width:${progress}%"></span></div><div class="actions-row"><button class="secondary-btn" data-delete-book="${book.id}">Supprimer</button></div></article>`;
    }).join('')}</div>`;
  }

  function renderExperienceList() {
    const items = MomentumGoals.listItems('hobby_experiences');
    if (!items.length) return '<div class="empty">Aucune expérience notée.</div>';
    return `<div class="goal-list">${items.map(item => `<article class="goal-card"><header><div class="goal-title">${e(item.title)}</div><span class="badge">${experienceStatus(item.status)}</span></header><div class="goal-meta">${item.date ? `<span>${e(item.date)}</span>` : ''}${item.context ? `<span>${e(item.context)}</span>` : ''}</div>${item.notes ? `<p class="goal-desc">${e(item.notes)}</p>` : ''}<div class="actions-row"><button class="secondary-btn" data-delete-experience="${item.id}">Supprimer</button></div></article>`).join('')}</div>`;
  }

  function bookStatus(status) {
    return ({ 'to-read': 'À lire', reading: 'En cours', done: 'Terminé', paused: 'En pause' })[status] || 'Livre';
  }

  function experienceStatus(status) {
    return ({ idea: 'Idée', planned: 'Prévu', done: 'Réalisé' })[status] || 'Expérience';
  }

  function e(value) {
    return MomentumGoals.escapeHtml(value);
  }

  window.MomentumHobbies = { render };
}());

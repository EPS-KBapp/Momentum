(function () {
  'use strict';

  const categories = [
    ['agregation', 'Agrégation interne EPS'],
    ['ecrit1', 'Écrit 1'],
    ['ecrit2', 'Écrit 2'],
    ['projet-pro', 'Projet professionnel'],
    ['lecture', 'Lecture intellectuelle'],
    ['formation', 'Formation'],
    ['autre', 'Autre'],
  ];

  const productionTypes = [
    ['fiche', 'Fiche'],
    ['plan', 'Plan détaillé'],
    ['intro', 'Introduction / problématique'],
    ['dissertation', 'Dissertation'],
    ['carte', 'Carte mentale'],
    ['synthese', 'Synthèse de lecture'],
    ['tableau', 'Tableau / base auteurs'],
    ['autre', 'Autre'],
  ];

  function render(spaceRoot) {
    renderOverview(spaceRoot);
    renderGoals(spaceRoot);
    renderWorkplan(spaceRoot);
    renderProductions(spaceRoot);
  }

  function renderOverview(root) {
    const panel = root.querySelector('[data-panel="overview"]');
    const goals = MomentumGoals.listGoals('brain');
    const tasks = MomentumGoals.listActions('brain');
    const logs = MomentumGoals.listLogs('brain');
    const productions = MomentumGoals.listItems('brain_productions');
    panel.innerHTML = `
      <div class="metric-grid">
        <article class="metric-card"><strong>${goals.filter(g => g.status === 'active').length}</strong><span>objectif(s) actif(s)</span></article>
        <article class="metric-card"><strong>${tasks.filter(t => t.status === 'planned').length}</strong><span>tâche(s) prévue(s)</span></article>
        <article class="metric-card"><strong>${logs.length}</strong><span>tâche(s) validée(s)</span></article>
        <article class="metric-card"><strong>${productions.length}</strong><span>production(s)</span></article>
      </div>
      <article class="panel">
        <h3>Focus Brain</h3>
        <p>Brain suit le travail réel : tâches planifiées, validations et productions. Les ressources restent dans les notes des tâches ou productions, sans onglet autonome.</p>
      </article>
    `;
  }

  function renderGoals(root) {
    const panel = root.querySelector('[data-panel="goals"]');
    panel.innerHTML = goalForm('brain', categories) + goalList('brain');
    bindGoalForm(panel, 'brain');
  }

  function renderWorkplan(root) {
    const panel = root.querySelector('[data-panel="workplan"]');
    panel.innerHTML = actionForm('brain', categories, {
      title: 'Planifier une tâche de travail',
      placeholder: 'Ex. Plan écrit 2, fiche savoirs, lecture rapport jury',
      intensity: 'Ex. priorité haute, focus profond, révision légère',
      content: 'Type de travail, thème, production attendue, référence utile',
    }) + logForm('brain', {
      title: 'Valider du travail réalisé',
      placeholder: 'Ex. Lecture non planifiée, correction de plan',
      content: 'Travail réalisé, production obtenue, difficulté, suite à donner',
    }) + '<h3 class="section-subtitle">Tâches prévues</h3>' + actionList('brain') + '<h3 class="section-subtitle">Travail réalisé</h3>' + logList('brain');
    bindActionForm(panel, 'brain');
    bindLogForm(panel, 'brain');
  }

  function renderProductions(root) {
    const panel = root.querySelector('[data-panel="productions"]');
    const goalOptions = MomentumGoals.listGoals('brain').filter(goal => goal.status === 'active').map(goal => `<option value="${goal.id}">${e(goal.title)}</option>`).join('');
    panel.innerHTML = `
      <article class="panel">
        <h3>Ajouter une production</h3>
        <form class="goal-form" data-production-form>
          <label class="field"><span>Titre</span><input name="title" required placeholder="Ex. Fiche savoirs EPS 1975-1995" /></label>
          <label class="field"><span>Type</span><select name="type">${productionTypes.map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select></label>
          <label class="field"><span>Objectif lié</span><select name="goalId"><option value="">Aucun objectif lié</option>${goalOptions}</select></label>
          <label class="field"><span>Thème</span><input name="theme" placeholder="Ex. Savoirs, santé, évaluation, écrit 2" /></label>
          <label class="field"><span>Date</span><input name="date" type="date" value="${MomentumGoals.today()}" /></label>
          <label class="field"><span>Avancement</span><select name="progress"><option value="25">Brouillon</option><option value="50">En cours</option><option value="80">Presque terminé</option><option value="100">Terminé</option></select></label>
          <label class="field"><span>Notes / références utilisées</span><textarea name="notes" placeholder="Ce que contient la production, références, suite à donner"></textarea></label>
          <button class="primary-btn" type="submit">Ajouter la production</button>
        </form>
      </article>
      ${renderProductionList()}
    `;
    bindProductions(panel);
  }

  function bindProductions(panel) {
    panel.querySelector('[data-production-form]')?.addEventListener('submit', event => {
      event.preventDefault();
      MomentumGoals.createItem('brain_productions', Object.fromEntries(new FormData(event.currentTarget).entries()));
      render(document.querySelector('#space-brain'));
    });
    panel.addEventListener('click', event => {
      const id = event.target.closest('[data-delete-production]')?.dataset.deleteProduction;
      if (id) {
        MomentumGoals.deleteItem('brain_productions', id);
        render(document.querySelector('#space-brain'));
      }
    }, { once: true });
  }

  function renderProductionList() {
    const productions = MomentumGoals.listItems('brain_productions');
    if (!productions.length) return '<div class="empty">Aucune production enregistrée.</div>';
    return `<div class="goal-list">${productions.map(item => {
      const progress = Number(item.progress || 0);
      return `<article class="goal-card"><header><div class="goal-title">${e(item.title)}</div><span class="badge">${productionLabel(item.type)}</span></header><div class="goal-meta"><span>${e(item.date || '')}</span>${item.theme ? `<span>${e(item.theme)}</span>` : ''}<span>${progress}%</span></div>${item.notes ? `<p class="goal-desc">${e(item.notes)}</p>` : ''}<div class="progress-track"><span style="width:${progress}%"></span></div><div class="actions-row"><button class="secondary-btn" data-delete-production="${item.id}">Supprimer</button></div></article>`;
    }).join('')}</div>`;
  }

  function productionLabel(type) {
    return Object.fromEntries(productionTypes)[type] || 'Production';
  }

  function e(value) {
    return MomentumGoals.escapeHtml(value);
  }

  window.MomentumBrain = { render };
}());

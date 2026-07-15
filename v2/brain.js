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

  function render(spaceRoot) {
    renderOverview(spaceRoot);
    renderGoals(spaceRoot);
    renderWorkplan(spaceRoot);
    renderProductions(spaceRoot);
  }

  function renderOverview(root) {
    const panel = root.querySelector('[data-panel="overview"]');
    const goals = MomentumGoals.listGoals('brain');
    panel.innerHTML = `
      <article class="panel">
        <h3>Vue Brain</h3>
        <p>${goals.length ? `${goals.length} objectif(s) Brain créé(s).` : 'Commence par créer un objectif intellectuel ou professionnel.'}</p>
      </article>
      <article class="panel">
        <h3>Principe</h3>
        <p>Brain suit le travail réel : tâches, plans, fiches, productions et avancement des projets. Pas d’onglet Ressources autonome.</p>
      </article>
    `;
  }

  function renderGoals(root) {
    const panel = root.querySelector('[data-panel="goals"]');
    panel.innerHTML = goalForm('brain', categories) + goalList('brain');
    bindGoalForm(panel, 'brain');
  }

  function renderWorkplan(root) {
    root.querySelector('[data-panel="workplan"]').innerHTML = `
      <article class="panel">
        <h3>Plan de travail</h3>
        <p>À venir : tâches de travail, échéances, durée prévue, type de travail et validation.</p>
      </article>
    `;
  }

  function renderProductions(root) {
    root.querySelector('[data-panel="productions"]').innerHTML = `
      <article class="panel">
        <h3>Productions</h3>
        <p>À venir : fiches, plans, dissertations, cartes mentales, synthèses et documents produits.</p>
      </article>
    `;
  }

  window.MomentumBrain = { render };
}());

(function () {
  'use strict';

  const categories = [
    ['course', 'Course à pied'],
    ['renforcement', 'Renforcement'],
    ['velo', 'Vélo'],
    ['natation', 'Natation'],
    ['mobilite', 'Mobilité'],
    ['sante', 'Santé'],
    ['autre', 'Autre'],
  ];

  function render(spaceRoot) {
    renderOverview(spaceRoot);
    renderGoals(spaceRoot);
    renderProgram(spaceRoot);
    renderSessions(spaceRoot);
    renderProfile(spaceRoot);
  }

  function renderOverview(root) {
    const panel = root.querySelector('[data-panel="overview"]');
    const goals = MomentumGoals.listGoals('sport');
    panel.innerHTML = `
      <article class="panel">
        <h3>Vue Sport</h3>
        <p>${goals.length ? `${goals.length} objectif(s) sportif(s) créé(s).` : 'Commence par créer un objectif sportif court, moyen ou long terme.'}</p>
      </article>
      <article class="panel">
        <h3>Prochaine brique</h3>
        <p>Le programme hebdomadaire et la validation prévu/réalisé seront développés après validation de la coque.</p>
      </article>
    `;
  }

  function renderGoals(root) {
    const panel = root.querySelector('[data-panel="goals"]');
    panel.innerHTML = goalForm('sport', categories) + goalList('sport');
    bindGoalForm(panel, 'sport');
  }

  function renderProgram(root) {
    root.querySelector('[data-panel="program"]').innerHTML = `
      <article class="panel">
        <h3>Programme hebdomadaire</h3>
        <p>À venir : choisir le sport, le jour, le contenu prévu, l’objectif de séance et l’intensité.</p>
      </article>
    `;
  }

  function renderSessions(root) {
    root.querySelector('[data-panel="sessions"]').innerHTML = `
      <article class="panel">
        <h3>Séances réalisées</h3>
        <p>À venir : valider une séance, saisir le réalisé et comparer prévu/réalisé.</p>
      </article>
    `;
  }

  function renderProfile(root) {
    root.querySelector('[data-panel="profile"]').innerHTML = `
      <article class="panel">
        <h3>Tests / Profil</h3>
        <p>À venir : VAMEVAL, Cooper/demi-Cooper, RABIT, profil sportif et historique des tests.</p>
      </article>
    `;
  }

  window.MomentumSport = { render };
}());

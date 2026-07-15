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
    panel.innerHTML = `
      <article class="panel">
        <h3>Vue Hobbies</h3>
        <p>${goals.length ? `${goals.length} objectif(s) hobbies créé(s).` : 'Commence par créer un objectif lié à un loisir, une lecture ou une expérience.'}</p>
      </article>
      <article class="panel">
        <h3>Logique prévue</h3>
        <p>Lecture, guitare, expériences et moments seront suivis par progression réelle plutôt que par streak.</p>
      </article>
    `;
  }

  function renderGoals(root) {
    const panel = root.querySelector('[data-panel="goals"]');
    panel.innerHTML = goalForm('hobbies', categories) + goalList('hobbies');
    bindGoalForm(panel, 'hobbies');
  }

  function renderPractices(root) {
    root.querySelector('[data-panel="practices"]').innerHTML = `
      <article class="panel">
        <h3>Pratiques</h3>
        <p>À venir : guitare, lecture, sorties, expériences, temps passé, notes et progression.</p>
      </article>
    `;
  }

  function renderBooks(root) {
    root.querySelector('[data-panel="books"]').innerHTML = `
      <article class="panel">
        <h3>Lecture / Expériences</h3>
        <p>À venir : livre à lire, livre en cours, pages lues, expériences à planifier et moments réalisés.</p>
      </article>
    `;
  }

  window.MomentumHobbies = { render };
}());

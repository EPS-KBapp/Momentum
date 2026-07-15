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
    const activeGoals = goals.filter(goal => goal.status === 'active');
    const planned = MomentumGoals.listActions('sport').filter(action => action.status === 'planned');
    const doneActions = MomentumGoals.listActions('sport').filter(action => action.status === 'done' || action.status === 'partial');
    const logs = MomentumGoals.listLogs('sport');
    const tests = MomentumGoals.listItems('sport_tests');
    panel.innerHTML = `
      <article class="panel">
        <h3>Parcours Sport</h3>
        <p>L’espace Sport fonctionne en 4 étapes simples : <strong>Objectifs</strong> pour dire où tu veux aller, <strong>Planning</strong> pour prévoir les séances, <strong>Réaliser</strong> pour noter ce qui a vraiment été fait, puis <strong>Bilan & tests</strong> pour suivre ton état et tes progrès.</p>
      </article>
      <div class="metric-grid">
        <article class="metric-card"><strong>${activeGoals.length}</strong><span>objectif(s) actif(s)</span></article>
        <article class="metric-card"><strong>${planned.length}</strong><span>séance(s) à faire</span></article>
        <article class="metric-card"><strong>${doneActions.length}</strong><span>séance(s) marquée(s) réalisée(s)</span></article>
        <article class="metric-card"><strong>${tests.length}</strong><span>test(s) enregistré(s)</span></article>
      </div>
      <article class="panel">
        <h3>Prochaine séance prévue</h3>
        ${planned[0] ? renderActionMini(planned[0]) : '<p>Aucune séance prévue. Ajoute une séance dans <strong>Planning</strong>.</p>'}
      </article>
      <article class="panel">
        <h3>Dernière réalisation</h3>
        ${logs[0] ? renderLogMini(logs[0]) : '<p>Aucune séance réalisée enregistrée pour le moment.</p>'}
      </article>
    `;
  }

  function renderGoals(root) {
    const panel = root.querySelector('[data-panel="goals"]');
    panel.innerHTML = `
      <article class="panel">
        <h3>1. Objectifs</h3>
        <p>Écris ce que tu veux atteindre : reprendre régulièrement, préparer un 10 km, améliorer la VMA, renforcer le dos, perdre de la fatigue, etc.</p>
      </article>
      ${goalForm('sport', categories)}
      ${goalList('sport')}
    `;
    bindGoalForm(panel, 'sport');
  }

  function renderProgram(root) {
    const panel = root.querySelector('[data-panel="program"]');
    panel.innerHTML = `
      <article class="panel">
        <h3>2. Planning</h3>
        <p>Ici tu prévois les séances à venir. Une séance prévue n’est pas encore réalisée : elle sert de plan.</p>
      </article>
      ${actionForm('sport', categories, {
        title: 'Prévoir une séance',
        placeholder: 'Ex. VMA courte, sortie longue, renforcement haut du corps',
        intensity: 'Ex. facile, modérée, intense, RPE 7/10',
        content: 'Objectif, exercices, séries, distance, allure ou contenu prévu',
      })}
      <article class="panel">
        <h3>Séances du planning</h3>
        <p>Tu peux marquer une séance comme réalisée rapidement ici, ou la valider plus précisément dans <strong>Réaliser</strong>.</p>
      </article>
      ${actionList('sport')}
    `;
    bindActionForm(panel, 'sport');
  }

  function renderSessions(root) {
    const panel = root.querySelector('[data-panel="sessions"]');
    panel.innerHTML = `
      <article class="panel">
        <h3>3. Réaliser</h3>
        <p>Ici tu notes ce qui a vraiment été fait : durée réelle, ressenti, contenu, séance partielle ou non faite. C’est le journal d’entraînement.</p>
      </article>
      ${logForm('sport', {
        title: 'Valider le réalisé',
        placeholder: 'Ex. Footing ajouté sans planification',
        content: 'Durée, distance, exercices réalisés, sensations, douleur éventuelle',
      })}
      <article class="panel">
        <h3>Corriger le statut d’une séance</h3>
        <p>Si tu as marqué une séance comme réalisée par erreur, utilise <strong>Remettre prévu</strong> ici. Elle retournera dans les séances à faire.</p>
      </article>
      ${actionList('sport')}
      <article class="panel">
        <h3>Journal des séances réalisées</h3>
      </article>
      ${logList('sport')}
    `;
    bindLogForm(panel, 'sport');
    bindActionForm(panel, 'sport');
  }

  function renderProfile(root) {
    const panel = root.querySelector('[data-panel="profile"]');
    const profile = MomentumGoals.listItems('sport_profile')[0] || {};
    panel.innerHTML = `
      <article class="panel">
        <h3>4. Bilan & tests</h3>
        <p>Cet onglet sert à renseigner ton profil sportif et quelques tests simples pour mieux interpréter tes séances.</p>
      </article>
      <article class="panel">
        <h3>Profil sportif</h3>
        <form class="goal-form" data-sport-profile>
          <label class="field"><span>Sports pratiqués</span><input name="sports" value="${e(profile.sports)}" placeholder="Course, renforcement, vélo…" /></label>
          <label class="field"><span>Fréquence visée</span><input name="frequency" value="${e(profile.frequency)}" placeholder="Ex. 3 séances / semaine" /></label>
          <label class="field"><span>VMA estimée</span><input name="vma" type="number" step="0.1" value="${e(profile.vma)}" placeholder="km/h" /></label>
          <label class="field"><span>FC repos</span><input name="hrRest" type="number" value="${e(profile.hrRest)}" placeholder="bpm" /></label>
          <label class="field"><span>FC max</span><input name="hrMax" type="number" value="${e(profile.hrMax)}" placeholder="bpm" /></label>
          <label class="field"><span>Fatigue / douleurs actuelles</span><textarea name="notes" placeholder="Fatigue, douleurs, vigilance…">${e(profile.notes)}</textarea></label>
          <button class="primary-btn" type="submit">Sauvegarder le profil</button>
        </form>
      </article>
      <article class="panel">
        <h3>Ajouter un test</h3>
        <form class="goal-form" data-sport-test>
          <label class="field"><span>Type</span><select name="type"><option value="vameval">VAMEVAL / VMA directe</option><option value="cooper">Cooper 12 min</option><option value="demi-cooper">Demi-Cooper 6 min</option><option value="rabit">RABIT</option><option value="gainage">Gainage</option></select></label>
          <label class="field"><span>Date</span><input name="date" type="date" value="${MomentumGoals.today()}" /></label>
          <label class="field"><span>Résultat brut</span><input name="raw" required placeholder="Ex. 15 km/h, 2800 m, palier 14, 2 min 30" /></label>
          <label class="field"><span>Notes</span><textarea name="notes" placeholder="Conditions du test, ressenti, contexte"></textarea></label>
          <button class="primary-btn" type="submit">Analyser / enregistrer</button>
        </form>
      </article>
      ${renderTests()}
    `;
    bindProfile(panel);
  }

  function bindProfile(panel) {
    const profileForm = panel.querySelector('[data-sport-profile]');
    profileForm?.addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(profileForm).entries());
      const existing = MomentumGoals.listItems('sport_profile')[0];
      if (existing) MomentumGoals.updateItem('sport_profile', existing.id, data);
      else MomentumGoals.createItem('sport_profile', data);
      render(document.querySelector('#space-sport'));
    });

    const testForm = panel.querySelector('[data-sport-test]');
    testForm?.addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(testForm).entries());
      MomentumGoals.createItem('sport_tests', { ...data, ...analyzeTest(data.type, data.raw) });
      render(document.querySelector('#space-sport'));
    });

    if (panel.dataset.sportProfileBound === 'true') return;
    panel.dataset.sportProfileBound = 'true';
    panel.addEventListener('click', event => {
      const id = event.target.closest('[data-delete-test]')?.dataset.deleteTest;
      if (id) {
        MomentumGoals.deleteItem('sport_tests', id);
        render(document.querySelector('#space-sport'));
      }
    });
  }

  function analyzeTest(type, raw) {
    const value = parseFloat(String(raw).replace(',', '.'));
    let calculated = '';
    let interpretation = 'Résultat enregistré. Analyse à affiner selon ton profil et le protocole exact.';
    if (!Number.isNaN(value)) {
      if (type === 'demi-cooper') calculated = `${(value / 100).toFixed(1)} km/h de VMA estimée`;
      if (type === 'cooper') calculated = `${(value / 200).toFixed(1)} km/h de vitesse moyenne sur 12 min`;
      if (type === 'vameval') calculated = `${value.toFixed(1)} km/h de VMA estimée`;
      if (type === 'gainage') calculated = `${value} s/min selon l’unité saisie`;
      const vma = type === 'demi-cooper' ? value / 100 : type === 'cooper' ? value / 200 : type === 'vameval' ? value : null;
      if (vma) interpretation = vma < 12 ? 'Base aérobie à construire progressivement.' : vma < 15 ? 'Base correcte, travail régulier à consolider.' : vma < 18 ? 'Bon niveau aérobie, séances calibrées possibles.' : 'Niveau élevé, attention à la récupération et à la progressivité.';
    }
    return { calculated, interpretation };
  }

  function renderTests() {
    const tests = MomentumGoals.listItems('sport_tests');
    if (!tests.length) return '<div class="empty">Aucun test enregistré.</div>';
    return `<div class="goal-list">${tests.map(test => `
      <article class="goal-card">
        <header><div class="goal-title">${e(test.type).toUpperCase()} · ${e(test.raw)}</div><span class="badge">${e(test.date)}</span></header>
        ${test.calculated ? `<p class="goal-desc"><strong>${e(test.calculated)}</strong></p>` : ''}
        <p class="goal-desc">${e(test.interpretation)}</p>
        ${test.notes ? `<p class="goal-desc">${e(test.notes)}</p>` : ''}
        <div class="actions-row"><button class="secondary-btn" type="button" data-delete-test="${test.id}">Supprimer</button></div>
      </article>`).join('')}</div>`;
  }

  function renderActionMini(action) {
    return `<div class="goal-card"><div class="goal-title">${e(action.title)}</div><div class="goal-meta"><span>${e(action.date)}</span><span>${e(action.category)}</span>${action.plannedDuration ? `<span>${action.plannedDuration} min</span>` : ''}</div>${action.plannedContent ? `<p class="goal-desc">${e(action.plannedContent)}</p>` : ''}</div>`;
  }

  function renderLogMini(log) {
    return `<div class="goal-card"><div class="goal-title">${e(log.title)}</div><div class="goal-meta"><span>${e(log.date)}</span>${log.realDuration ? `<span>${log.realDuration} min</span>` : ''}${log.feeling ? `<span>Ressenti ${log.feeling}/10</span>` : ''}</div>${log.realContent ? `<p class="goal-desc">${e(log.realContent)}</p>` : ''}</div>`;
  }

  function e(value) {
    return MomentumGoals.escapeHtml(value);
  }

  window.MomentumSport = { render };
}());
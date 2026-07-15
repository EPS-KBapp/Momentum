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

  const state = { openSessionId: null };

  function render(spaceRoot) {
    if (!spaceRoot) return;
    renderOverview(spaceRoot);
    renderGoals(spaceRoot);
    renderPlanning(spaceRoot);
    renderProfile(spaceRoot);
  }

  function renderOverview(root) {
    const panel = root.querySelector('[data-panel="overview"]');
    const goals = MomentumGoals.listGoals('sport');
    const activeGoals = goals.filter(goal => goal.status === 'active');
    const actions = MomentumGoals.listActions('sport');
    const planned = actions.filter(action => action.status === 'planned');
    const validated = actions.filter(action => ['done', 'partial', 'skipped'].includes(action.status));
    const tests = MomentumGoals.listItems('sport_tests');
    const logs = MomentumGoals.listLogs('sport');
    panel.innerHTML = `
      <article class="panel">
        <h3>Parcours Sport</h3>
        <p>L’espace Sport fonctionne en 3 gestes : <strong>Objectifs</strong> pour savoir où tu vas, <strong>Planning</strong> pour prévoir puis ouvrir une séance et compléter le réalisé, <strong>Bilan & tests</strong> pour suivre ton profil et tes progrès.</p>
      </article>
      <div class="metric-grid">
        <article class="metric-card"><strong>${activeGoals.length}</strong><span>objectif(s) actif(s)</span></article>
        <article class="metric-card"><strong>${planned.length}</strong><span>séance(s) prévue(s)</span></article>
        <article class="metric-card"><strong>${validated.length}</strong><span>séance(s) renseignée(s)</span></article>
        <article class="metric-card"><strong>${tests.length}</strong><span>test(s) enregistré(s)</span></article>
      </div>
      <article class="panel">
        <h3>Prochaine séance</h3>
        ${planned[0] ? renderActionMini(planned[0]) : '<p>Aucune séance prévue. Ajoute une séance dans <strong>Planning</strong>.</p>'}
      </article>
      <article class="panel">
        <h3>Dernière séance renseignée</h3>
        ${logs[0] ? renderLogMini(logs[0]) : '<p>Aucun résultat de séance enregistré pour le moment.</p>'}
      </article>
    `;
  }

  function renderGoals(root) {
    const panel = root.querySelector('[data-panel="goals"]');
    panel.innerHTML = `
      <article class="panel">
        <h3>Objectifs</h3>
        <p>Écris ce que tu veux atteindre : reprendre régulièrement, préparer un 10 km, améliorer la VMA, renforcer le dos, réduire la fatigue, etc.</p>
      </article>
      ${goalForm('sport', categories)}
      ${goalList('sport')}
    `;
    bindGoalForm(panel, 'sport');
  }

  function renderPlanning(root) {
    const panel = root.querySelector('[data-panel="program"]');
    const actions = MomentumGoals.listActions('sport');
    if (state.openSessionId && !actions.some(action => action.id === state.openSessionId)) state.openSessionId = null;
    panel.innerHTML = `
      <article class="panel">
        <h3>Planning unique</h3>
        <p>Tu programmes une séance, puis tu l’ouvres directement ici pour compléter le résultat obtenu. Il n’y a plus d’onglet séparé pour réaliser la séance.</p>
      </article>
      ${actionForm('sport', categories, {
        title: 'Prévoir une séance',
        placeholder: 'Ex. VMA courte, sortie longue, renforcement haut du corps',
        intensity: 'Ex. facile, modérée, intense, RPE 7/10',
        content: 'Objectif, exercices, séries, distance, allure ou contenu prévu',
      })}
      <article class="panel">
        <h3>Séances programmées</h3>
        <p>Utilise <strong>Ouvrir / compléter</strong> pour renseigner le réalisé, modifier un statut ou remettre une séance en prévu.</p>
      </article>
      ${renderSessionList(actions)}
    `;
    bindPlanning(panel);
  }

  function renderProfile(root) {
    const panel = root.querySelector('[data-panel="profile"]');
    const profile = MomentumGoals.listItems('sport_profile')[0] || {};
    panel.innerHTML = `
      <article class="panel">
        <h3>Bilan & tests</h3>
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

  function renderSessionList(actions) {
    if (!actions.length) return '<div class="empty">Aucune séance programmée pour le moment.</div>';
    const logs = MomentumGoals.listLogs('sport');
    return `<div class="goal-list">${actions.map(action => renderSessionCard(action, logs.find(log => log.actionId === action.id))).join('')}</div>`;
  }

  function renderSessionCard(action, log) {
    const isOpen = state.openSessionId === action.id;
    const buttonLabel = isOpen ? 'Fermer la séance' : (action.status === 'planned' ? 'Ouvrir / compléter' : 'Ouvrir / modifier');
    return `
      <article class="goal-card" data-session-card="${action.id}">
        <header>
          <div class="goal-title">${e(action.title)}</div>
          <span class="badge">${MomentumGoals.statusLabel(action.status)}</span>
        </header>
        <div class="goal-meta">
          <span>${e(action.date || 'Sans date')}</span>
          <span>${e(action.category || 'Sans catégorie')}</span>
          ${action.plannedDuration ? `<span>${action.plannedDuration} min prévues</span>` : ''}
          ${action.plannedIntensity ? `<span>${e(action.plannedIntensity)}</span>` : ''}
        </div>
        ${action.plannedContent ? `<p class="goal-desc"><strong>Prévu :</strong> ${e(action.plannedContent)}</p>` : ''}
        ${log ? `<p class="goal-desc"><strong>Résultat :</strong> ${e(log.realContent || 'Résultat renseigné')}</p>` : ''}
        <div class="actions-row">
          <button class="primary-btn" type="button" data-open-session="${action.id}">${buttonLabel}</button>
          ${action.status !== 'planned' ? `<button class="secondary-btn" type="button" data-session-status="planned" data-session-id="${action.id}">Remettre prévu</button>` : ''}
          <button class="secondary-btn" type="button" data-delete-session="${action.id}">Supprimer</button>
        </div>
        ${isOpen ? renderSessionResultForm(action, log) : ''}
      </article>
    `;
  }

  function renderSessionResultForm(action, log) {
    const status = log?.status || action.status || 'done';
    const selectedStatus = ['done', 'partial', 'skipped', 'planned'].includes(status) ? status : 'done';
    return `
      <form class="goal-form" data-session-result="${action.id}">
        <label class="field"><span>Statut</span><select name="status">
          <option value="done" ${selectedStatus === 'done' ? 'selected' : ''}>Réalisé</option>
          <option value="partial" ${selectedStatus === 'partial' ? 'selected' : ''}>Partiel</option>
          <option value="skipped" ${selectedStatus === 'skipped' ? 'selected' : ''}>Non fait</option>
          <option value="planned" ${selectedStatus === 'planned' ? 'selected' : ''}>Prévu</option>
        </select></label>
        <label class="field"><span>Date réalisée</span><input name="date" type="date" value="${e(log?.date || MomentumGoals.today())}" /></label>
        <label class="field"><span>Durée réelle</span><input name="realDuration" type="number" min="0" placeholder="minutes" value="${e(log?.realDuration || '')}" /></label>
        <label class="field"><span>Ressenti</span><input name="feeling" type="number" min="1" max="10" placeholder="1 à 10" value="${e(log?.feeling || '')}" /></label>
        <label class="field"><span>Résultat obtenu</span><textarea name="realContent" placeholder="Ce qui a réellement été fait : distance, exercices, séries, sensations, douleur éventuelle…">${e(log?.realContent || '')}</textarea></label>
        <div class="actions-row">
          <button class="primary-btn" type="submit">Valider la séance</button>
          <button class="secondary-btn" type="button" data-close-session>Annuler</button>
        </div>
        <p class="goal-desc">Pour valider en réalisé ou partiel, renseigne au minimum la durée réelle et le résultat obtenu. Pour non fait, indique simplement la raison dans le résultat obtenu.</p>
      </form>
    `;
  }

  function bindPlanning(panel) {
    if (panel.dataset.sportPlanningBound === 'true') return;
    panel.dataset.sportPlanningBound = 'true';

    panel.addEventListener('click', event => {
      const openId = event.target.closest('[data-open-session]')?.dataset.openSession;
      const close = event.target.closest('[data-close-session]');
      const deleteId = event.target.closest('[data-delete-session]')?.dataset.deleteSession;
      const statusButton = event.target.closest('[data-session-status]');

      if (openId) {
        event.preventDefault();
        state.openSessionId = state.openSessionId === openId ? null : openId;
        rerenderSport();
        return;
      }
      if (close) {
        event.preventDefault();
        state.openSessionId = null;
        rerenderSport();
        return;
      }
      if (deleteId) {
        event.preventDefault();
        MomentumGoals.deleteAction(deleteId);
        if (state.openSessionId === deleteId) state.openSessionId = null;
        rerenderSport();
        return;
      }
      if (statusButton) {
        event.preventDefault();
        const id = statusButton.dataset.sessionId;
        const status = statusButton.dataset.sessionStatus;
        setSessionStatus(id, status);
        state.openSessionId = null;
        rerenderSport();
      }
    });

    panel.addEventListener('submit', event => {
      const actionCreateForm = event.target.closest('[data-action-form="sport"]');
      const resultForm = event.target.closest('[data-session-result]');

      if (actionCreateForm) {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(actionCreateForm).entries());
        MomentumGoals.createAction({ ...data, space: 'sport' });
        actionCreateForm.reset();
        state.openSessionId = null;
        rerenderSport();
        return;
      }

      if (resultForm) {
        event.preventDefault();
        saveSessionResult(resultForm.dataset.sessionResult, Object.fromEntries(new FormData(resultForm).entries()));
      }
    });
  }

  function saveSessionResult(actionId, values) {
    const status = values.status || 'done';
    const realContent = String(values.realContent || '').trim();
    const realDuration = Number(values.realDuration || 0);

    if (status === 'planned') {
      clearSessionLog(actionId);
      MomentumGoals.updateAction(actionId, { status: 'planned' });
      state.openSessionId = null;
      rerenderSport();
      return;
    }

    if ((status === 'done' || status === 'partial') && (!realDuration || !realContent)) {
      alert('Pour valider une séance réalisée ou partielle, renseigne au minimum la durée réelle et le résultat obtenu.');
      return;
    }

    if (status === 'skipped' && !realContent) {
      alert('Pour passer une séance en non fait, indique la raison dans le résultat obtenu.');
      return;
    }

    clearSessionLog(actionId);
    MomentumGoals.createLog({
      space: 'sport',
      actionId,
      status,
      date: values.date || MomentumGoals.today(),
      realDuration,
      feeling: values.feeling || '',
      realContent,
    });
    MomentumGoals.updateAction(actionId, { status });
    state.openSessionId = null;
    rerenderSport();
  }

  function setSessionStatus(actionId, status) {
    if (status === 'planned') clearSessionLog(actionId);
    MomentumGoals.updateAction(actionId, { status });
  }

  function clearSessionLog(actionId) {
    MomentumGoals.listLogs('sport')
      .filter(log => log.actionId === actionId)
      .forEach(log => MomentumGoals.deleteLog(log.id));
  }

  function bindProfile(panel) {
    if (panel.dataset.sportProfileBound === 'true') return;
    panel.dataset.sportProfileBound = 'true';

    panel.addEventListener('submit', event => {
      const profileForm = event.target.closest('[data-sport-profile]');
      const testForm = event.target.closest('[data-sport-test]');

      if (profileForm) {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(profileForm).entries());
        const existing = MomentumGoals.listItems('sport_profile')[0];
        if (existing) MomentumGoals.updateItem('sport_profile', existing.id, data);
        else MomentumGoals.createItem('sport_profile', data);
        rerenderSport();
        return;
      }

      if (testForm) {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(testForm).entries());
        MomentumGoals.createItem('sport_tests', { ...data, ...analyzeTest(data.type, data.raw) });
        testForm.reset();
        rerenderSport();
      }
    });

    panel.addEventListener('click', event => {
      const id = event.target.closest('[data-delete-test]')?.dataset.deleteTest;
      if (id) {
        event.preventDefault();
        MomentumGoals.deleteItem('sport_tests', id);
        rerenderSport();
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

  function rerenderSport() {
    render(document.querySelector('#space-sport'));
    if (window.MomentumGoals?.getGoalSummary) {
      const summary = document.querySelector('[data-summary="sport"]');
      if (summary) summary.textContent = MomentumGoals.getGoalSummary('sport');
    }
  }

  function e(value) {
    return MomentumGoals.escapeHtml(value);
  }

  window.MomentumSport = { render };
}());
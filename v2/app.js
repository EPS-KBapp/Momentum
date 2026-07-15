(function () {
  'use strict';

  const modules = {
    chill: window.MomentumChill,
    sport: window.MomentumSport,
    hobbies: window.MomentumHobbies,
    brain: window.MomentumBrain,
  };

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function showScreen(id) {
    qsa('.screen').forEach(screen => screen.classList.remove('active'));
    const target = qs(id);
    if (target) target.classList.add('active');
  }

  function openSpace(space) {
    showScreen(`#space-${space}`);
    renderSpace(space);
  }

  function goHome() {
    renderSummaries();
    showScreen('#home-screen');
  }

  function renderSpace(space) {
    const root = qs(`#space-${space}`);
    if (!root) return;
    if (modules[space]?.render) modules[space].render(root);
  }

  function renderSummaries() {
    ['sport', 'hobbies', 'brain'].forEach(space => {
      const el = qs(`[data-summary="${space}"]`);
      if (el) el.textContent = MomentumGoals.getGoalSummary(space);
    });
  }

  function bindShell() {
    qsa('[data-open-space]').forEach(button => {
      button.addEventListener('click', () => openSpace(button.dataset.openSpace));
    });
    qsa('[data-go-home]').forEach(button => {
      button.addEventListener('click', goHome);
    });
    qsa('.subnav').forEach(nav => {
      nav.addEventListener('click', event => {
        const button = event.target.closest('[data-tab]');
        if (!button) return;
        const screen = button.closest('.screen');
        qsa('[data-tab]', nav).forEach(tab => tab.classList.toggle('active', tab === button));
        qsa('.tab-panel', screen).forEach(panel => panel.classList.toggle('active', panel.dataset.panel === button.dataset.tab));
      });
    });
    bindDataTools();
  }

  function bindDataTools() {
    const exportBtn = qs('[data-export-v2]');
    const importInput = qs('[data-import-v2]');

    if (exportBtn && exportBtn.dataset.bound !== 'true') {
      exportBtn.dataset.bound = 'true';
      exportBtn.addEventListener('click', () => {
        const data = MomentumGoals.exportData();
        const date = new Date().toISOString().slice(0, 10);
        downloadJson(`momentum-v2-sauvegarde-${date}.json`, data);
      });
    }

    if (importInput && importInput.dataset.bound !== 'true') {
      importInput.dataset.bound = 'true';
      importInput.addEventListener('change', async event => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const json = JSON.parse(text);
          const ok = confirm('Importer cette sauvegarde remplacera les données v2 actuelles de Sport, Hobbies et Brain. Continuer ?');
          if (!ok) return;
          const result = MomentumGoals.importData(json);
          renderSummaries();
          alert(`Import terminé : ${result.goals} objectif(s), ${result.actions} action(s), ${result.logs} réalisation(s).`);
        } catch (error) {
          alert('Import impossible : le fichier ne semble pas être une sauvegarde Momentum v2 valide.');
          console.error(error);
        } finally {
          event.target.value = '';
        }
      });
    }
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function optionList(items, selected = '') {
    return items.map(([value, label]) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${label}</option>`).join('');
  }

  function goalOptions(space) {
    const goals = MomentumGoals.listGoals(space).filter(goal => goal.status === 'active');
    return '<option value="">Aucun objectif lié</option>' + goals.map(goal => `<option value="${goal.id}">${escapeHtml(goal.title)}</option>`).join('');
  }

  function bindFormOnce(form, flag, handler) {
    if (!form || form.dataset[flag] === 'true') return;
    form.dataset[flag] = 'true';
    form.addEventListener('submit', handler);
  }

  function bindPanelOnce(panel, flag, handler) {
    if (!panel || panel.dataset[flag] === 'true') return;
    panel.dataset[flag] = 'true';
    panel.addEventListener('click', handler);
  }

  window.goalForm = function goalForm(space, categories) {
    return `
      <article class="panel">
        <h3>Créer un objectif</h3>
        <form class="goal-form" data-goal-form="${space}">
          <label class="field"><span>Titre</span><input name="title" required placeholder="Ex. Courir 10 km en 45 min" /></label>
          <label class="field"><span>Catégorie</span><select name="category">${optionList(categories)}</select></label>
          <label class="field"><span>Horizon</span><select name="horizon"><option value="short">Court terme</option><option value="medium">Moyen terme</option><option value="long">Long terme</option></select></label>
          <label class="field"><span>Échéance</span><input name="targetDate" type="date" /></label>
          <label class="field"><span>Priorité</span><select name="priority"><option value="normal">Normale</option><option value="high">Haute</option><option value="low">Faible</option></select></label>
          <label class="field"><span>Description</span><textarea name="description" placeholder="Pourquoi cet objectif compte ?"></textarea></label>
          <button class="primary-btn" type="submit">Ajouter l’objectif</button>
        </form>
      </article>
    `;
  };

  window.goalList = function goalList(space) {
    const goals = MomentumGoals.listGoals(space);
    if (!goals.length) return '<div class="empty">Aucun objectif dans cet espace pour le moment.</div>';
    return `<div class="goal-list">${goals.map(goal => `
      <article class="goal-card" data-goal-id="${goal.id}">
        <header>
          <div class="goal-title">${escapeHtml(goal.title)}</div>
          <span class="badge">${MomentumGoals.horizonLabel(goal.horizon)}</span>
        </header>
        ${goal.description ? `<p class="goal-desc">${escapeHtml(goal.description)}</p>` : ''}
        <div class="goal-meta">
          <span>${escapeHtml(goal.category || 'Sans catégorie')}</span>
          <span>Priorité : ${MomentumGoals.priorityLabel(goal.priority)}</span>
          <span>Statut : ${goal.status === 'done' ? 'Terminé' : 'Actif'}</span>
          ${goal.targetDate ? `<span>Échéance : ${goal.targetDate}</span>` : ''}
        </div>
        <div class="actions-row">
          ${goal.status !== 'done' ? `<button class="secondary-btn" type="button" data-complete-goal="${goal.id}">Terminer</button>` : `<button class="secondary-btn" type="button" data-reactivate-goal="${goal.id}">Réactiver</button>`}
          <button class="secondary-btn" type="button" data-delete-goal="${goal.id}">Supprimer</button>
        </div>
      </article>
    `).join('')}</div>`;
  };

  window.actionForm = function actionForm(space, categories, labels = {}) {
    return `
      <article class="panel">
        <h3>${labels.title || 'Planifier une action'}</h3>
        <form class="goal-form" data-action-form="${space}">
          <label class="field"><span>Titre</span><input name="title" required placeholder="${labels.placeholder || 'Ex. Séance VMA courte'}" /></label>
          <label class="field"><span>Objectif lié</span><select name="goalId">${goalOptions(space)}</select></label>
          <label class="field"><span>Catégorie</span><select name="category">${optionList(categories)}</select></label>
          <label class="field"><span>Date</span><input name="date" type="date" value="${MomentumGoals.today()}" /></label>
          <label class="field"><span>Durée prévue</span><input name="plannedDuration" type="number" min="0" placeholder="minutes" /></label>
          <label class="field"><span>Intensité / priorité</span><input name="plannedIntensity" placeholder="${labels.intensity || 'Ex. modérée, forte, priorité haute'}" /></label>
          <label class="field"><span>Contenu prévu</span><textarea name="plannedContent" placeholder="${labels.content || 'Ce que tu prévois de faire'}"></textarea></label>
          <button class="primary-btn" type="submit">Ajouter au planning</button>
        </form>
      </article>
    `;
  };

  window.actionList = function actionList(space) {
    const actions = MomentumGoals.listActions(space);
    if (!actions.length) return '<div class="empty">Aucune action planifiée pour le moment.</div>';
    return `<div class="goal-list">${actions.map(action => `
      <article class="goal-card">
        <header>
          <div class="goal-title">${escapeHtml(action.title)}</div>
          <span class="badge">${MomentumGoals.statusLabel(action.status)}</span>
        </header>
        <div class="goal-meta">
          <span>${action.date || 'Sans date'}</span>
          <span>${escapeHtml(action.category || 'Sans catégorie')}</span>
          ${action.plannedDuration ? `<span>${action.plannedDuration} min prévues</span>` : ''}
          ${action.plannedIntensity ? `<span>${escapeHtml(action.plannedIntensity)}</span>` : ''}
        </div>
        ${action.plannedContent ? `<p class="goal-desc">${escapeHtml(action.plannedContent)}</p>` : ''}
        <div class="actions-row">
          ${action.status === 'planned' ? `<button class="secondary-btn" type="button" data-complete-action="${action.id}">Marquer réalisé</button>` : `<button class="secondary-btn" type="button" data-reopen-action="${action.id}">Remettre prévu</button>`}
          <button class="secondary-btn" type="button" data-delete-action="${action.id}">Supprimer</button>
        </div>
      </article>
    `).join('')}</div>`;
  };

  window.logForm = function logForm(space, labels = {}) {
    const actions = MomentumGoals.listActions(space).filter(action => action.status !== 'done');
    const actionOptions = '<option value="">Action libre</option>' + actions.map(action => `<option value="${action.id}">${escapeHtml(action.date)} · ${escapeHtml(action.title)}</option>`).join('');
    return `
      <article class="panel">
        <h3>${labels.title || 'Valider le réalisé'}</h3>
        <form class="goal-form" data-log-form="${space}">
          <label class="field"><span>Action prévue</span><select name="actionId">${actionOptions}</select></label>
          <label class="field"><span>Titre si action libre</span><input name="title" placeholder="${labels.placeholder || 'Ex. Travail non planifié'}" /></label>
          <label class="field"><span>Date</span><input name="date" type="date" value="${MomentumGoals.today()}" /></label>
          <label class="field"><span>Statut</span><select name="status"><option value="done">Réalisé</option><option value="partial">Partiel</option><option value="skipped">Non fait</option></select></label>
          <label class="field"><span>Durée réelle</span><input name="realDuration" type="number" min="0" placeholder="minutes" /></label>
          <label class="field"><span>Ressenti</span><input name="feeling" type="number" min="1" max="10" placeholder="1 à 10" /></label>
          <label class="field"><span>Réalisé / notes</span><textarea name="realContent" placeholder="${labels.content || 'Ce qui a réellement été fait'}"></textarea></label>
          <button class="primary-btn" type="submit">Enregistrer le réalisé</button>
        </form>
      </article>
    `;
  };

  window.logList = function logList(space) {
    const logs = MomentumGoals.listLogs(space);
    if (!logs.length) return '<div class="empty">Aucune réalisation enregistrée.</div>';
    return `<div class="goal-list">${logs.map(log => `
      <article class="goal-card">
        <header>
          <div class="goal-title">${escapeHtml(log.title)}</div>
          <span class="badge">${MomentumGoals.statusLabel(log.status)}</span>
        </header>
        <div class="goal-meta">
          <span>${log.date || ''}</span>
          ${log.realDuration ? `<span>${log.realDuration} min</span>` : ''}
          ${log.feeling ? `<span>Ressenti ${log.feeling}/10</span>` : ''}
        </div>
        ${log.realContent ? `<p class="goal-desc">${escapeHtml(log.realContent)}</p>` : ''}
        <div class="actions-row"><button class="secondary-btn" type="button" data-delete-log="${log.id}">Supprimer</button></div>
      </article>
    `).join('')}</div>`;
  };

  window.bindGoalForm = function bindGoalForm(panel, space) {
    const form = qs(`[data-goal-form="${space}"]`, panel);
    bindFormOnce(form, 'bound', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      MomentumGoals.createGoal({ ...data, space });
      form.reset();
      renderSpace(space);
      renderSummaries();
    });

    bindPanelOnce(panel, 'goalActionsBound', event => {
      const completeId = event.target.closest('[data-complete-goal]')?.dataset.completeGoal;
      const reactivateId = event.target.closest('[data-reactivate-goal]')?.dataset.reactivateGoal;
      const deleteId = event.target.closest('[data-delete-goal]')?.dataset.deleteGoal;
      if (completeId) MomentumGoals.updateGoal(completeId, { status: 'done', progress: 100 });
      if (reactivateId) MomentumGoals.updateGoal(reactivateId, { status: 'active', progress: 0 });
      if (deleteId) MomentumGoals.deleteGoal(deleteId);
      if (completeId || reactivateId || deleteId) {
        renderSpace(space);
        renderSummaries();
      }
    });
  };

  window.bindActionForm = function bindActionForm(panel, space) {
    const form = qs(`[data-action-form="${space}"]`, panel);
    bindFormOnce(form, 'bound', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      MomentumGoals.createAction({ ...data, space });
      form.reset();
      renderSpace(space);
      renderSummaries();
    });

    bindPanelOnce(panel, 'actionActionsBound', event => {
      const doneId = event.target.closest('[data-complete-action]')?.dataset.completeAction;
      const reopenId = event.target.closest('[data-reopen-action]')?.dataset.reopenAction;
      const deleteId = event.target.closest('[data-delete-action]')?.dataset.deleteAction;
      if (doneId) MomentumGoals.updateAction(doneId, { status: 'done' });
      if (reopenId) MomentumGoals.updateAction(reopenId, { status: 'planned' });
      if (deleteId) MomentumGoals.deleteAction(deleteId);
      if (doneId || reopenId || deleteId) {
        renderSpace(space);
        renderSummaries();
      }
    });
  };

  window.bindLogForm = function bindLogForm(panel, space) {
    const form = qs(`[data-log-form="${space}"]`, panel);
    bindFormOnce(form, 'bound', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      MomentumGoals.createLog({ ...data, space });
      form.reset();
      renderSpace(space);
      renderSummaries();
    });

    bindPanelOnce(panel, 'logActionsBound', event => {
      const id = event.target.closest('[data-delete-log]')?.dataset.deleteLog;
      if (id) {
        MomentumGoals.deleteLog(id);
        renderSpace(space);
        renderSummaries();
      }
    });
  };

  function escapeHtml(value) {
    return MomentumGoals.escapeHtml(value);
  }

  bindShell();
  renderSummaries();
}());
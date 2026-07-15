(function () {
  'use strict';

  const modules = {
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
    if (space === 'chill') initLegacyChill();
    else renderSpace(space);
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

  function initLegacyChill() {
    const host = qs('[data-chill-host]');
    if (!host) return;

    let frame = qs('iframe', host);
    if (!frame) {
      host.innerHTML = '<div class="legacy-loading">Chargement de Chill…</div>';
      frame = document.createElement('iframe');
      frame.className = 'legacy-frame';
      frame.title = 'Chill — module existant';
      frame.src = '../index.html?momentum_v2=chill';
      frame.addEventListener('load', () => openChillInFrame(frame));
      host.appendChild(frame);
    } else {
      openChillInFrame(frame);
    }
  }

  function openChillInFrame(frame) {
    const loading = frame.parentElement?.querySelector('.legacy-loading');
    const win = frame.contentWindow;
    if (!win) return;

    let attempts = 0;
    const maxAttempts = 40;
    const timer = setInterval(() => {
      attempts += 1;
      try {
        if (typeof win.enterApp === 'function') {
          win.enterApp('chill');
          if (loading) loading.remove();
          frame.classList.add('ready');
          clearInterval(timer);
        }
      } catch (error) {
        clearInterval(timer);
        if (loading) loading.textContent = 'Chill n’a pas pu être ouvert automatiquement. Tu peux réessayer en revenant à l’accueil.';
        console.error('Legacy Chill bridge:', error);
      }
      if (attempts >= maxAttempts) {
        clearInterval(timer);
        if (loading) loading.textContent = 'Chill met trop de temps à répondre. Recharge la page v2 pour réessayer.';
      }
    }, 150);
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
  }

  window.goalForm = function goalForm(space, categories) {
    const options = categories.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
    return `
      <article class="panel">
        <h3>Créer un objectif</h3>
        <form class="goal-form" data-goal-form="${space}">
          <label class="field"><span>Titre</span><input name="title" required placeholder="Ex. Courir 10 km en 45 min" /></label>
          <label class="field"><span>Catégorie</span><select name="category">${options}</select></label>
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
    if (!goals.length) {
      return '<div class="empty">Aucun objectif dans cet espace pour le moment.</div>';
    }
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
          ${goal.targetDate ? `<span>Échéance : ${goal.targetDate}</span>` : ''}
        </div>
        <div class="actions-row">
          <button class="secondary-btn" data-complete-goal="${goal.id}">Terminer</button>
          <button class="secondary-btn" data-delete-goal="${goal.id}">Supprimer</button>
        </div>
      </article>
    `).join('')}</div>`;
  };

  window.bindGoalForm = function bindGoalForm(panel, space) {
    const form = qs(`[data-goal-form="${space}"]`, panel);
    if (form) {
      form.addEventListener('submit', event => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        MomentumGoals.createGoal({ ...data, space });
        form.reset();
        renderSpace(space);
        renderSummaries();
      });
    }
    panel.addEventListener('click', event => {
      const completeId = event.target.closest('[data-complete-goal]')?.dataset.completeGoal;
      const deleteId = event.target.closest('[data-delete-goal]')?.dataset.deleteGoal;
      if (completeId) MomentumGoals.updateGoal(completeId, { status: 'done', progress: 100 });
      if (deleteId) MomentumGoals.deleteGoal(deleteId);
      if (completeId || deleteId) {
        renderSpace(space);
        renderSummaries();
      }
    }, { once: true });
  };

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  bindShell();
  renderSummaries();
}());

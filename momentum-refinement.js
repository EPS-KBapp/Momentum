/* Momentum UI refinement — behavior layer */
(function () {
  'use strict';
  var ONBOARDING_VERSION = 'v1';

  function setText(selector, text) {
    var el = document.querySelector(selector);
    if (el) el.textContent = text;
  }
  function label(el, value) {
    if (!el) return;
    el.setAttribute('aria-label', value);
    el.setAttribute('title', value);
  }

  function refineCopy() {
    setText('#selector #sel-ambition .sel-pill:nth-child(2)', '⏱ Timer');
    setText('#selector #sel-chill .sel-pill:nth-child(2)', '🗺 Bucket list');
    setText('#selector #sel-chill .sel-pill:nth-child(3)', '📈 Progressions');
    setText('#chill-root .logo', 'Chill');
    setText('#chill-bottom-bar #ctab-b > span:nth-child(2)', 'Bucket list');
    setText('#chill-bottom-bar #ctab-a > span:nth-child(2)', 'Progressions');
  }

  function renderToggle(button, running) {
    if (!button) return;
    button.innerHTML = '<span class="timer-btn-symbol" aria-hidden="true">' + (running ? '⏸' : '▶') + '</span><span class="timer-btn-label">' + (running ? 'Pause' : 'Reprendre') + '</span>';
    label(button, running ? 'Mettre le minuteur en pause' : 'Reprendre le minuteur');
  }

  function refineTimer() {
    var reset = document.querySelector('#screen-timer .timer-btn-secondary[onclick*="timer.reset"]');
    var toggle = document.getElementById('timer-toggle-btn');
    var complete = document.querySelector('#screen-timer .timer-btn-secondary[onclick*="timer.complete"]');

    if (reset && !reset.dataset.refined) {
      reset.innerHTML = '<span class="timer-btn-symbol" aria-hidden="true">↺</span><span class="timer-btn-label">Recommencer</span>';
      reset.dataset.refined = 'true';
    }
    label(reset, 'Recommencer le minuteur');

    if (toggle && !toggle.dataset.refined) {
      renderToggle(toggle, toggle.textContent.indexOf('⏸') !== -1);
      toggle.dataset.refined = 'true';
      toggle.addEventListener('click', function () {
        window.setTimeout(function () {
          renderToggle(toggle, toggle.textContent.indexOf('⏸') !== -1);
        }, 0);
      });
    }

    if (complete && !complete.dataset.refined) {
      complete.innerHTML = '<span class="timer-btn-symbol" aria-hidden="true">✓</span><span class="timer-btn-label">Terminer</span>';
      complete.dataset.refined = 'true';
    }
    label(complete, 'Terminer et valider l’action');
  }

  function labelButtons() {
    document.querySelectorAll('button').forEach(function (button) {
      if (button.getAttribute('aria-label')) return;
      var text = (button.textContent || '').trim().replace(/\s+/g, ' ');
      var title = button.getAttribute('title');
      if (title) label(button, title);
      else if (text.length > 1) label(button, text);
    });
  }

  function onboardingData(kind) {
    if (kind === 'ambition') return {
      theme: '', eyebrow: 'Premiers pas · Ambition',
      title: 'Construis ton élan, une action à la fois.',
      body: 'Commence par un objectif simple et fais de la régularité ton repère — sans pression inutile.',
      steps: [['1','Créer un objectif','Choisis une action courte, réaliste et fréquente.'],['2','Agir aujourd’hui','Lance le timer ou valide ton action.'],['3','Observer ta progression','Retrouve ton rythme dans Progression.']],
      primary: 'Créer mon premier objectif', secondary: 'Explorer l’application'
    };
    return {
      theme: 'chill', eyebrow: 'Premiers pas · Chill',
      title: 'Garde la trace de ce qui compte pour toi.',
      body: 'Rassemble tes envies, tes expériences à vivre et tes séries en cours dans un même espace.',
      steps: [['1','Ajouter une envie','Crée une liste pour toi ou pour quelqu’un.'],['2','Préparer une bucket list','Note ce que tu veux lire, voir, visiter ou faire.'],['3','Suivre tes progressions','Garde le fil de tes sagas, séries et collections.']],
      primary: 'Découvrir mes envies', secondary: 'Explorer Chill'
    };
  }

  function showOnboarding(kind) {
    var key = 'momentum_onboarding_' + kind + '_' + ONBOARDING_VERSION;
    if (localStorage.getItem(key) === 'done' || document.querySelector('.momentum-onboarding')) return;
    var data = onboardingData(kind);
    var overlay = document.createElement('div');
    overlay.className = 'momentum-onboarding ' + data.theme;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Bienvenue dans Momentum');
    overlay.innerHTML = '<div class="momentum-onboarding__card"><div class="momentum-onboarding__eyebrow">' + data.eyebrow + '</div><h2>' + data.title + '</h2><p>' + data.body + '</p><div class="momentum-onboarding__steps">' + data.steps.map(function(step) { return '<div class="momentum-onboarding__step"><div class="momentum-onboarding__num">' + step[0] + '</div><div><strong>' + step[1] + '</strong><span>' + step[2] + '</span></div></div>'; }).join('') + '</div><div class="momentum-onboarding__actions"><button class="momentum-onboarding__primary">' + data.primary + '</button><button class="momentum-onboarding__secondary">' + data.secondary + '</button></div></div>';
    function close() { localStorage.setItem(key, 'done'); overlay.remove(); }
    overlay.querySelector('.momentum-onboarding__secondary').addEventListener('click', close);
    overlay.querySelector('.momentum-onboarding__primary').addEventListener('click', function () {
      close();
      if (kind === 'ambition' && window.ML) { window.ML.navigate('obj'); window.setTimeout(function () { window.ML.openAddModal(); }, 260); }
      if (kind === 'chill' && window.showTab) window.showTab('w');
    });
    document.body.appendChild(overlay);
    window.setTimeout(function () { overlay.querySelector('.momentum-onboarding__primary').focus(); }, 0);
  }

  function hookEntry() {
    if (!window.enterApp || window.enterApp.__refined) return;
    var original = window.enterApp;
    function refinedEnterApp(which) {
      original(which);
      window.setTimeout(function () { refineCopy(); refineTimer(); labelButtons(); showOnboarding(which); }, 420);
    }
    refinedEnterApp.__refined = true;
    window.enterApp = refinedEnterApp;
  }

  refineCopy();
  refineTimer();
  labelButtons();
  hookEntry();
}());

/* Momentum UI refinement — behavior layer */
(function () {
  'use strict';

  var ONBOARDING_VERSION = 'v1';

  function setText(selector, text) {
    var el = document.querySelector(selector);
    if (el) el.textContent = text;
  }

  function setAccessibleLabel(el, label) {
    if (!el) return;
    el.setAttribute('aria-label', label);
    el.setAttribute('title', label);
  }

  function refineCopy() {
    /* One vocabulary throughout the visible interface. */
    setText('#selector #sel-ambition .sel-pill:nth-child(2)', '⏱ Timer');
    setText('#selector #sel-chill .sel-pill:nth-child(2)', '🗺 Bucket list');
    setText('#selector #sel-chill .sel-pill:nth-child(3)', '📈 Progressions');
    setText('#chill-root .logo', 'Chill');
    setText('#chill-bottom-bar #ctab-b > span:nth-child(2)', 'Bucket list');
    setText('#chill-bottom-bar #ctab-a > span:nth-child(2)', 'Progressions');
  }

  function refineTimer() {
    var reset = document.querySelector('#screen-timer .timer-btn-secondary[onclick*="timer.reset"]');
    var toggle = document.getElementById('timer-toggle-btn');
    var complete = document.querySelector('#screen-timer .timer-btn-secondary[onclick*="timer.complete"]');

    if (reset) {
      reset.innerHTML = '<span class="timer-btn-symbol" aria-hidden="true">↺</span><span class="timer-btn-label">Recommencer</span>';
      setAccessibleLabel(reset, 'Recommencer le minuteur');
    }
    if (toggle) {
      toggle.innerHTML = '<span class="timer-btn-symbol" aria-hidden="true">⏸</span><span class="timer-btn-label">Pause</span>';
      setAccessibleLabel(toggle, 'Mettre le minuteur en pause');
    }
    if (complete) {
      complete.innerHTML = '<span class="timer-btn-symbol" aria-hidden="true">✓</span><span class="timer-btn-label">Terminer</span>';
      setAccessibleLabel(complete, 'Terminer et valider l’action');
    }

    /* The legacy timer writes only a symbol. Restore the wording after each click. */
    if (toggle && !toggle.dataset.refinementBound) {
      toggle.dataset.refinementBound = 'true';
      toggle.addEventListener('click', function () {
        window.setTimeout(function () {
          var running = toggle.textContent.indexOf('⏸') !== -1;
          toggle.innerHTML = '<span class="timer-btn-symbol" aria-hidden="true">' + (running ? '⏸' : '▶') + '</span><span class="timer-btn-label">' + (running ? 'Pause' : 'Reprendre') + '</span>';
          setAccessibleLabel(toggle, running ? 'Mettre le minuteur en pause' : 'Reprendre le minuteur');
        }, 0);
      });
    }
  }

  function labelIconButtons() {
    document.querySelectorAll('button').forEach(function (btn) {
      if (btn.getAttribute('aria-label')) return;
      var title = btn.getAttribute('title');
      var text = (btn.textContent || '').trim().replace(/\s+/g, ' ');
      if (title) setAccessibleLabel(btn, title);
      else if (text && text.length > 1) setAccessibleLabel(btn, text);
    });
  }

  function onboardingMarkup(kind) {
    if (kind === 'ambition') {
      return {
        className: '',
        eyebrow: 'Premiers pas · Ambition',
        title: 'Construis ton élan, une action à la fois.',
        body: 'Commence par un objectif simple et fais de la régularité ton repère — sans pression inutile.',
        steps: [
          ['1', 'Créer un objectif', 'Choisis une action courte, réaliste et fréquente.'],
          ['2', 'Agir aujourd’hui', 'Lance le timer ou valide ton action.'],
          ['3', 'Observer ta progression', 'Retrouve ton rythme dans Progression.']
        ],
        primary: 'Créer mon premier objectif',
        secondary: 'Explorer l’application'
      };
    }
    return {
      className: 'chill',
      eyebrow: 'Premiers pas · Chill',
      title: 'Garde la trace de ce qui compte pour toi.',
      body: 'Rassemble tes envies, tes expériences à vivre et tes séries en cours dans un même espace.',
      steps: [
        ['1', 'Ajouter une envie', 'Crée une liste pour toi ou pour quelqu’un.'],
        ['2', 'Préparer une bucket list', 'Note ce que tu veux lire, voir, visiter ou faire.'],
        ['3', 'Suivre tes progressions', 'Garde le fil de tes sagas, séries et collections.']
      ],
      primary: 'Découvrir mes envies',
      secondary: 'Explorer Chill'
    };
  }

  function showOnboarding(kind) {
    var key = 'momentum_onboarding_' + kind + '_' + ONBOARDING_VERSION;
    if (localStorage.getItem(key) === 'done' || document.querySelector('.momentum-onboarding')) return;

    var data = onboardingMarkup(kind);
    var overlay = document.createElement('div');
    overlay.className = 'momentum-onboarding ' + data.className;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Bienvenue dans Momentum');
    overlay.innerHTML =
      '<div class="momentum-onboarding__card">' +
        '<div class="momentum-onboarding__eyebrow">' + data.eyebrow + '</div>' +
        '<h2>' + data.title + '</h2>' +
        '<p>' + data.body + '</p>' +
        '<div class="momentum-onboarding__steps">' +
          data.steps.map(function (step) {
            return '<div class="momentum-onboarding__step"><div class="momentum-onboarding__num">' + step[0] + '</div><div><strong>' + step[1] + '</strong><span>' + step[2] + '</span></div></div>';
          }).join('') +
        '</div>' +
        '<div class="momentum-onboarding__actions">' +
          '<button class="momentum-onboarding__primary">' + data.primary + '</button>' +
          '<button class="momentum-onboarding__secondary">' + data.secondary + '</button>' +
        '</div>' +
      '</div>';

    function close() {
      localStorage.setItem(key, 'done');
      overlay.remove();
    }

    overlay.querySelector('.momentum-onboarding__secondary').addEventListener('click', close);
    overlay.querySelector('.momentum-onboarding__primary').addEventListener('click', function () {
      close();
      if (kind === 'ambition' && window.ML) {
        window.ML.navigate('obj');
        window.setTimeout(function () { window.ML.openAddModal(); }, 260);
      } else if (kind === 'chill' && window.showTab) {
        window.showTab('w');
      }
    });

    document.body.appendChild(overlay);
    window.setTimeout(function () {
      var focusable = overlay.querySelector('.momentum-onboarding__primary');
      if (focusable) focusable.focus();
    }, 0);
  }

  function attachEntryHook() {
    if (!window.enterApp || window.enterApp.__momentumRefined) return;
    var originalEnterApp = window.enterApp;
    function refinedEnterApp(which) {
      originalEnterApp(which);
      window.setTimeout(function () {
        refineCopy();
        refineTimer();
        labelIconButtons();
        showOnboarding(which);
      }, 420);
    }
    refinedEnterApp.__momentumRefined = true;
    window.enterApp = refinedEnterApp;
  }

  function init() {
    refineCopy();
    refineTimer();
    labelIconButtons();
    attachEntryHook();
    new MutationObserver(function () {
      refineTimer();
      labelIconButtons();
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());

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

  const vmaReference = {
    male: [
      { min: 18, max: 19, limits: [10.8, 13.0, 14.0, 16.3] },
      { min: 20, max: 29, limits: [10.3, 12.0, 13.7, 15.7] },
      { min: 30, max: 39, limits: [10.0, 11.2, 13.0, 15.0] },
      { min: 40, max: 49, limits: [9.8, 11.0, 12.5, 14.7] },
      { min: 50, max: 59, limits: [8.2, 10.0, 11.4, 14.0] },
      { min: 60, max: 69, limits: [7.0, 8.5, 10.0, 13.0] },
      { min: 70, max: 79, limits: [6.0, 7.0, 8.5, 11.5] },
      { min: 80, max: 120, limits: [5.1, 6.3, 7.3, 10.0] },
    ],
    female: [
      { min: 18, max: 19, limits: [10.0, 11.1, 13.0, 15.0] },
      { min: 20, max: 29, limits: [8.0, 10.0, 11.5, 14.3] },
      { min: 30, max: 39, limits: [7.7, 9.4, 10.9, 13.7] },
      { min: 40, max: 49, limits: [7.4, 9.0, 10.4, 13.3] },
      { min: 50, max: 59, limits: [7.0, 8.1, 10.0, 13.0] },
      { min: 60, max: 69, limits: [6.0, 7.0, 8.5, 11.1] },
      { min: 70, max: 79, limits: [5.0, 6.0, 7.0, 10.0] },
      { min: 80, max: 120, limits: [4.4, 5.5, 6.3, 8.4] },
    ],
  };

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
    const analysis = computeSportAnalysis();

    panel.innerHTML = `
      ${renderGarminReminder()}
      <article class="panel">
        <h3>Parcours Sport</h3>
        <p>L’espace Sport fonctionne en 3 gestes : <strong>Objectifs</strong> pour savoir où tu vas, <strong>Planning</strong> pour prévoir puis ouvrir une séance et compléter le réalisé, <strong>Bilan & tests</strong> pour suivre ton niveau actuel.</p>
      </article>
      <div class="metric-grid">
        <article class="metric-card"><strong>${activeGoals.length}</strong><span>objectif(s) actif(s)</span></article>
        <article class="metric-card"><strong>${planned.length}</strong><span>séance(s) prévue(s)</span></article>
        <article class="metric-card"><strong>${validated.length}</strong><span>séance(s) renseignée(s)</span></article>
        <article class="metric-card"><strong>${tests.length}</strong><span>test(s) enregistré(s)</span></article>
      </div>
      <article class="panel">
        <h3>Niveau actuel</h3>
        <div class="metric-grid">
          <article class="metric-card"><strong>${e(analysis.level)}</strong><span>niveau global</span></article>
          <article class="metric-card"><strong>${analysis.vmaLabel}</strong><span>VMA retenue</span></article>
          <article class="metric-card"><strong>${analysis.ageRefLabel}</strong><span>repère âge</span></article>
          <article class="metric-card"><strong>${analysis.fatigueLabel}</strong><span>fatigue</span></article>
        </div>
        <p>${e(analysis.summary)}</p>
      </article>
      <article class="panel">
        <h3>Prochaine séance</h3>
        ${planned[0] ? renderActionMini(planned[0]) : '<p>Aucune séance prévue. Ajoute une séance dans <strong>Planning</strong>.</p>'}
      </article>
      <article class="panel">
        <h3>Dernière séance renseignée</h3>
        ${logs[0] ? renderLogMini(logs[0]) : '<p>Aucun résultat de séance enregistré pour le moment.</p>'}
      </article>
    `;
    bindGarminReminder(panel);
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
    const profile = getProfile();
    panel.innerHTML = `
      ${renderGarminReminder()}
      ${renderSportAnalysis()}
      <article class="panel">
        <h3>Profil sportif</h3>
        <p>Ajoute l’âge, le sexe et la VO₂max Garmin pour comparer ta VMA à un repère d’âge. La comparaison reste indicative : elle aide à situer le profil, pas à établir un diagnostic.</p>
        <form class="goal-form" data-sport-profile>
          <label class="field"><span>Âge</span><input name="age" type="number" min="12" max="100" value="${e(profile.age)}" placeholder="Ex. 31" /></label>
          <label class="field"><span>Sexe pour les repères</span><select name="sex">
            <option value="" ${!profile.sex ? 'selected' : ''}>Non renseigné</option>
            <option value="male" ${profile.sex === 'male' ? 'selected' : ''}>Homme</option>
            <option value="female" ${profile.sex === 'female' ? 'selected' : ''}>Femme</option>
          </select></label>
          <label class="field"><span>Sports pratiqués</span><input name="sports" value="${e(profile.sports)}" placeholder="Course, renforcement, vélo…" /></label>
          <label class="field"><span>Fréquence visée</span><input name="frequency" value="${e(profile.frequency)}" placeholder="Ex. 3 séances / semaine" /></label>
          <label class="field"><span>VMA estimée / mesurée</span><input name="vma" type="number" step="0.1" value="${e(profile.vma)}" placeholder="km/h" /></label>
          <label class="field"><span>VO₂max Garmin</span><input name="garminVo2max" type="number" step="0.1" value="${e(profile.garminVo2max)}" placeholder="mL/kg/min" /></label>
          <label class="field"><span>Date VO₂max Garmin</span><input name="garminVo2UpdatedAt" type="date" value="${e(profile.garminVo2UpdatedAt || '')}" /></label>
          <label class="field"><span>FC repos</span><input name="hrRest" type="number" value="${e(profile.hrRest)}" placeholder="bpm" /></label>
          <label class="field"><span>FC max</span><input name="hrMax" type="number" value="${e(profile.hrMax)}" placeholder="bpm" /></label>
          <label class="field"><span>Fatigue / douleurs actuelles</span><textarea name="notes" placeholder="Fatigue, douleurs, vigilance…">${e(profile.notes)}</textarea></label>
          <button class="primary-btn" type="submit">Sauvegarder le profil</button>
        </form>
      </article>
      <article class="panel">
        <h3>Ajouter un test</h3>
        <p>Après enregistrement, le test est automatiquement interprété et intégré au niveau actuel.</p>
        <form class="goal-form" data-sport-test>
          <label class="field"><span>Type</span><select name="type"><option value="vameval">VAMEVAL / VMA directe</option><option value="cooper">Cooper 12 min</option><option value="demi-cooper">Demi-Cooper 6 min</option><option value="rabit">RABIT</option><option value="gainage">Gainage</option></select></label>
          <label class="field"><span>Date</span><input name="date" type="date" value="${MomentumGoals.today()}" /></label>
          <label class="field"><span>Résultat brut</span><input name="raw" required placeholder="Ex. 15 km/h, 2800 m, palier 14" /></label>
          <label class="field"><span>Notes</span><textarea name="notes" placeholder="Conditions du test, ressenti, contexte"></textarea></label>
          <button class="primary-btn" type="submit">Analyser / enregistrer</button>
        </form>
      </article>
      ${renderVmaReferenceTable(profile)}
      ${renderTests()}
    `;
    bindProfile(panel);
    bindGarminReminder(panel);
  }

  function renderSportAnalysis() {
    const analysis = computeSportAnalysis();
    return `
      <article class="panel">
        <h3>Bilan automatique</h3>
        <p>Ce bilan se met à jour après chaque profil sauvegardé, test ajouté ou séance validée.</p>
        <div class="metric-grid">
          <article class="metric-card"><strong>${e(analysis.level)}</strong><span>niveau global</span></article>
          <article class="metric-card"><strong>${analysis.vmaLabel}</strong><span>VMA retenue</span></article>
          <article class="metric-card"><strong>${analysis.vo2Label}</strong><span>VO₂max Garmin</span></article>
          <article class="metric-card"><strong>${analysis.ageRefLabel}</strong><span>repère âge</span></article>
        </div>
      </article>
      <article class="panel">
        <h3>Interprétation</h3>
        <p><strong>Lecture actuelle :</strong> ${e(analysis.summary)}</p>
        <p><strong>Point fort :</strong> ${e(analysis.strength)}</p>
        <p><strong>À surveiller :</strong> ${e(analysis.watch)}</p>
        <p><strong>Conseil :</strong> ${e(analysis.recommendation)}</p>
        ${analysis.missing.length ? `<p><strong>À renseigner pour affiner :</strong> ${e(analysis.missing.join(', '))}.</p>` : ''}
      </article>
      <article class="panel">
        <h3>Détails du calcul</h3>
        <div class="goal-meta">
          <span>${e(analysis.vmaSource)}</span>
          <span>${e(analysis.ageSource)}</span>
          <span>${analysis.completedCount} séance(s) renseignée(s)</span>
          <span>${analysis.testCount} test(s)</span>
        </div>
        <p>La charge est estimée avec la formule simple <strong>durée réelle × ressenti</strong>. Le repère d’âge convertit les normes VO₂max/MET en VMA indicative avec la relation approximative VO₂max ÷ 3,5.</p>
      </article>
    `;
  }

  function renderGarminReminder() {
    const profile = getProfile();
    if (!isGarminReminderDue(profile)) return '';
    return `
      <article class="panel">
        <h3>VO₂max Garmin à mettre à jour</h3>
        <p>Renseigne ta VO₂max Garmin environ une fois par semaine pour garder le bilan sportif à jour.</p>
        <form class="goal-form" data-garmin-reminder>
          <label class="field"><span>VO₂max Garmin actuelle</span><input name="garminVo2max" type="number" step="0.1" value="${e(profile.garminVo2max)}" placeholder="Ex. 48" required /></label>
          <div class="actions-row">
            <button class="primary-btn" type="submit">Enregistrer la VO₂max</button>
            <button class="secondary-btn" type="button" data-snooze-garmin>Me le redemander plus tard</button>
          </div>
        </form>
      </article>
    `;
  }

  function computeSportAnalysis() {
    const profile = getProfile();
    const tests = MomentumGoals.listItems('sport_tests');
    const actions = MomentumGoals.listActions('sport');
    const logs = MomentumGoals.listLogs('sport');
    const recentLogs = logs.filter(log => isWithinDays(log.date, 14));
    const usedLogs = recentLogs.length ? recentLogs : logs.slice(0, 6);

    const vmaInfo = getBestVma(profile, tests);
    const vo2 = parseNumber(profile.garminVo2max);
    const age = parseNumber(profile.age);
    const ageReference = getAgeReference(age, profile.sex, vmaInfo.value || (vo2 ? vo2 / 3.5 : null));
    const completed = actions.filter(action => ['done', 'partial'].includes(action.status));
    const skipped = actions.filter(action => action.status === 'skipped');
    const planned = actions.filter(action => action.status === 'planned');
    const actionable = completed.length + skipped.length + planned.length;
    const regularityRate = actionable ? completed.length / actionable : null;
    const charge = usedLogs.reduce((sum, log) => sum + (Number(log.realDuration || 0) * Number(log.feeling || 0)), 0);
    const feelings = usedLogs.map(log => Number(log.feeling || 0)).filter(Boolean);
    const avgFeeling = feelings.length ? feelings.reduce((a, b) => a + b, 0) / feelings.length : null;
    const notes = String(profile.notes || '').toLowerCase();
    const hasPain = /douleur|douleurs|bless|gêne|gene|fatigue|épuis|epuis/.test(notes);

    const vmaLevel = getVmaLevel(vmaInfo.value, ageReference);
    const regularityLevel = getRegularityLevel(regularityRate, completed.length);
    const fatigueLevel = getFatigueLevel(avgFeeling, charge, hasPain);
    const level = getGlobalLevel(vmaLevel, regularityLevel, fatigueLevel, logs.length, tests.length, vmaInfo.value, vo2);
    const missing = [];
    if (!age) missing.push('âge');
    if (!profile.sex) missing.push('sexe pour le repère d’âge');
    if (!vmaInfo.value && !vo2) missing.push('VMA ou VO₂max Garmin');
    if (!logs.length) missing.push('au moins une séance validée avec ressenti');

    return {
      level,
      vmaLabel: vmaInfo.value ? `${formatNumber(vmaInfo.value)} km/h` : '—',
      vo2Label: vo2 ? `${formatNumber(vo2)} ml/kg/min` : '—',
      vmaSource: vmaInfo.source,
      ageSource: ageReference.source,
      ageRefLabel: ageReference.label,
      regularityLabel: regularityLevel.label,
      fatigueLabel: fatigueLevel.label,
      recentCharge: charge ? String(Math.round(charge)) : '—',
      avgFeelingLabel: avgFeeling ? `${formatNumber(avgFeeling)}/10` : '—',
      completedCount: completed.length,
      plannedCount: planned.length,
      testCount: tests.length,
      summary: buildSummary(level, vmaLevel, regularityLevel, fatigueLevel, vmaInfo.value, vo2, ageReference, logs.length, tests.length),
      strength: buildStrength(vmaLevel, regularityLevel, fatigueLevel, completed.length),
      watch: buildWatch(vmaLevel, regularityLevel, fatigueLevel, skipped.length, hasPain, ageReference),
      recommendation: buildRecommendation(level, vmaLevel, regularityLevel, fatigueLevel, completed.length),
      missing,
    };
  }

  function getProfile() {
    return MomentumGoals.listItems('sport_profile')[0] || {};
  }

  function saveProfilePatch(patch) {
    const existing = getProfile();
    if (existing.id) MomentumGoals.updateItem('sport_profile', existing.id, patch);
    else MomentumGoals.createItem('sport_profile', patch);
  }

  function getBestVma(profile, tests) {
    const profileVma = parseNumber(profile.vma);
    if (profileVma) return { value: profileVma, source: 'VMA issue du profil sportif' };

    const sorted = [...tests].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    const test = sorted.find(item => Number(item.vmaEstimate || 0));
    if (test) return { value: Number(test.vmaEstimate), source: `VMA issue du dernier test ${String(test.type || '').toUpperCase()}` };

    const garminVo2 = parseNumber(profile.garminVo2max);
    if (garminVo2) return { value: garminVo2 / 3.5, source: 'VMA approximée depuis la VO₂max Garmin' };

    return { value: null, source: 'Aucune VMA ou VO₂max renseignée pour le moment' };
  }

  function getAgeReference(age, sex, vma) {
    const ageValue = Number(age || 0);
    const table = vmaReference[sex];
    if (!ageValue || !table) return { label: '—', category: '', score: 1, source: 'Repère âge indisponible : âge ou sexe manquant' };
    const row = table.find(item => ageValue >= item.min && ageValue <= item.max) || table[table.length - 1];
    if (!vma) return { label: 'VMA manquante', category: '', score: 1, source: `Repère âge disponible : ${row.min}-${row.max === 120 ? '80+' : row.max} ans` };
    const [fair, average, good, excellent] = row.limits;
    if (vma < fair) return { label: 'sous P25', category: 'faible', score: 1, source: `Repère ${sexLabel(sex)} ${row.min}-${row.max === 120 ? '80+' : row.max} ans` };
    if (vma < average) return { label: 'P25-P49', category: 'correct bas', score: 2, source: `Repère ${sexLabel(sex)} ${row.min}-${row.max === 120 ? '80+' : row.max} ans` };
    if (vma < good) return { label: 'P50-P74', category: 'moyen', score: 3, source: `Repère ${sexLabel(sex)} ${row.min}-${row.max === 120 ? '80+' : row.max} ans` };
    if (vma < excellent) return { label: 'P75-P97', category: 'bon', score: 4, source: `Repère ${sexLabel(sex)} ${row.min}-${row.max === 120 ? '80+' : row.max} ans` };
    return { label: '≥ P97', category: 'très élevé', score: 5, source: `Repère ${sexLabel(sex)} ${row.min}-${row.max === 120 ? '80+' : row.max} ans` };
  }

  function getVmaLevel(vma, ageReference) {
    if (ageReference && ageReference.category) return { score: ageReference.score, label: ageReference.category, text: `repère d’âge : ${ageReference.category} (${ageReference.label})` };
    if (!vma) return { score: 1, label: 'non renseignée', text: 'la VMA n’est pas encore connue' };
    if (vma < 12) return { score: 1, label: 'reprise', text: 'base aérobie à construire progressivement' };
    if (vma < 14) return { score: 2, label: 'base', text: 'base correcte à consolider' };
    if (vma < 17) return { score: 3, label: 'intermédiaire', text: 'niveau aérobie solide pour structurer l’entraînement' };
    return { score: 4, label: 'avancé', text: 'niveau aérobie élevé, récupération à surveiller' };
  }

  function getRegularityLevel(rate, completedCount) {
    if (!completedCount) return { score: 1, label: 'à construire', text: 'pas encore assez de séances renseignées' };
    if (rate >= 0.8) return { score: 4, label: 'bonne', text: 'bonne continuité entre prévu et réalisé' };
    if (rate >= 0.5) return { score: 3, label: 'correcte', text: 'régularité correcte mais perfectible' };
    return { score: 2, label: 'irrégulière', text: 'les séances prévues sont encore peu réalisées' };
  }

  function getFatigueLevel(avgFeeling, charge, hasPain) {
    if (hasPain) return { score: 1, label: 'à surveiller', text: 'fatigue ou douleur signalée dans le profil' };
    if (!avgFeeling) return { score: 3, label: 'inconnue', text: 'pas encore assez de ressentis renseignés' };
    if (avgFeeling >= 8 || charge > 900) return { score: 1, label: 'élevée', text: 'ressenti ou charge récents élevés' };
    if (avgFeeling >= 6 || charge > 500) return { score: 2, label: 'modérée', text: 'charge présente, récupération à organiser' };
    return { score: 4, label: 'maîtrisée', text: 'ressenti récent plutôt confortable' };
  }

  function getGlobalLevel(vmaLevel, regularityLevel, fatigueLevel, logCount, testCount, vma, vo2) {
    if (!logCount && !testCount && !vma && !vo2) return 'À construire';
    const score = (vmaLevel.score * 0.45) + (regularityLevel.score * 0.30) + (fatigueLevel.score * 0.25);
    if (score < 1.8) return 'Reprise';
    if (score < 2.6) return 'Base';
    if (score < 3.45) return 'Intermédiaire';
    if (score < 4.4) return 'Avancé';
    return 'Très élevé';
  }

  function buildSummary(level, vmaLevel, regularityLevel, fatigueLevel, vma, vo2, ageReference, logCount, testCount) {
    if (!logCount && !testCount && !vma && !vo2) return 'renseigne l’âge, la VO₂max Garmin ou une VMA/test pour obtenir un bilan utile.';
    const aerobic = vma ? `VMA retenue ${formatNumber(vma)} km/h : ${vmaLevel.text}` : 'VMA non encore connue';
    const garmin = vo2 ? ` VO₂max Garmin : ${formatNumber(vo2)} ml/kg/min.` : '';
    const age = ageReference.category ? ` Comparaison âge : ${ageReference.category} (${ageReference.label}).` : '';
    return `${level}. ${aerobic}.${garmin}${age} Régularité ${regularityLevel.label}. Fatigue ${fatigueLevel.label}.`;
  }

  function buildStrength(vmaLevel, regularityLevel, fatigueLevel, completedCount) {
    if (!completedCount && vmaLevel.score <= 1) return 'les premières données commencent à construire ton profil.';
    const options = [
      { score: vmaLevel.score, text: `aérobie : ${vmaLevel.text}` },
      { score: regularityLevel.score, text: `régularité : ${regularityLevel.text}` },
      { score: fatigueLevel.score, text: `tolérance : ${fatigueLevel.text}` },
    ].sort((a, b) => b.score - a.score);
    return options[0].text;
  }

  function buildWatch(vmaLevel, regularityLevel, fatigueLevel, skippedCount, hasPain, ageReference) {
    if (hasPain) return 'fatigue ou douleur signalée : privilégier progressivité et récupération.';
    if (fatigueLevel.score <= 2) return fatigueLevel.text;
    if (regularityLevel.score <= 2) return 'la régularité : mieux vaut peu de séances mais tenues dans la durée.';
    if (vmaLevel.score <= 1) return 'le niveau aérobie : ajoute une VMA fiable ou la VO₂max Garmin.';
    if (ageReference.category === 'très élevé') return 'ne pas transformer un bon score en surcharge : surveille la récupération.';
    if (skippedCount) return 'les séances non faites : identifier si la charge, le timing ou la fatigue expliquent les reports.';
    return 'continuer à éviter les hausses brutales de volume ou d’intensité.';
  }

  function buildRecommendation(level, vmaLevel, regularityLevel, fatigueLevel, completedCount) {
    if (!completedCount) return 'programme 1 à 2 séances faciles et renseigne le ressenti pour construire le bilan.';
    if (fatigueLevel.score <= 2) return 'prévois une séance facile ou une récupération active avant de remettre de l’intensité.';
    if (regularityLevel.score <= 2) return 'réduis le nombre de séances prévues et vise d’abord des séances réalisables.';
    if (vmaLevel.score <= 2) return 'priorité à l’endurance fondamentale et à la régularité avant d’augmenter l’intensité.';
    if (level === 'Très élevé' || level === 'Avancé') return 'tu peux structurer une séance qualitative, mais garde une séance facile entre deux efforts durs.';
    return 'maintiens la régularité et ajoute progressivement une séance plus qualitative si la fatigue reste maîtrisée.';
  }

  function renderVmaReferenceTable(profile) {
    const age = parseNumber(profile.age);
    const sex = profile.sex;
    const row = getReferenceRow(age, sex);
    if (!row) return `
      <article class="panel">
        <h3>Repère VMA selon l’âge</h3>
        <p>Renseigne ton âge et le sexe utilisé pour le repère afin d’afficher le tableau correspondant.</p>
      </article>`;
    const [fair, average, good, excellent] = row.limits;
    return `
      <article class="panel">
        <h3>Repère VMA selon l’âge</h3>
        <p>Repère indicatif pour ${e(sexLabel(sex))}, tranche ${row.min}-${row.max === 120 ? '80+' : row.max} ans. Les seuils sont dérivés de normes VO₂max/MET et convertis en VMA approximative.</p>
        <div class="goal-meta">
          <span>Faible &lt; ${formatNumber(fair)} km/h</span>
          <span>Correct ${formatNumber(fair)}-${formatNumber(average)} km/h</span>
          <span>Moyen ${formatNumber(average)}-${formatNumber(good)} km/h</span>
          <span>Bon ${formatNumber(good)}-${formatNumber(excellent)} km/h</span>
          <span>Très élevé ≥ ${formatNumber(excellent)} km/h</span>
        </div>
      </article>`;
  }

  function getReferenceRow(age, sex) {
    const table = vmaReference[sex];
    if (!table || !age) return null;
    return table.find(item => age >= item.min && age <= item.max) || table[table.length - 1];
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
        if (data.garminVo2max && !data.garminVo2UpdatedAt) data.garminVo2UpdatedAt = MomentumGoals.today();
        saveProfilePatch(data);
        rerenderSport();
        return;
      }

      if (testForm) {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(testForm).entries());
        MomentumGoals.createItem('sport_tests', { ...data, ...analyzeTest(data.type, data.raw) });
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

  function bindGarminReminder(panel) {
    if (!panel || panel.dataset.garminReminderBound === 'true') return;
    panel.dataset.garminReminderBound = 'true';

    panel.addEventListener('submit', event => {
      const form = event.target.closest('[data-garmin-reminder]');
      if (!form) return;
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      saveProfilePatch({ garminVo2max: data.garminVo2max, garminVo2UpdatedAt: MomentumGoals.today(), garminReminderSnoozedAt: '' });
      rerenderSport();
    });

    panel.addEventListener('click', event => {
      if (!event.target.closest('[data-snooze-garmin]')) return;
      event.preventDefault();
      saveProfilePatch({ garminReminderSnoozedAt: MomentumGoals.today() });
      rerenderSport();
    });
  }

  function isGarminReminderDue(profile) {
    const lastValueDate = profile.garminVo2UpdatedAt;
    const snoozed = profile.garminReminderSnoozedAt;
    if (!profile.garminVo2max) return !snoozed || daysSince(snoozed) >= 7;
    return daysSince(lastValueDate) >= 7 && (!snoozed || daysSince(snoozed) >= 7);
  }

  function analyzeTest(type, raw) {
    const value = extractFirstNumber(raw);
    let calculated = '';
    let interpretation = 'Résultat enregistré. Analyse à affiner selon ton profil et le protocole exact.';
    let vmaEstimate = '';

    if (!Number.isNaN(value)) {
      if (type === 'demi-cooper') {
        vmaEstimate = value / 100;
        calculated = `${vmaEstimate.toFixed(1)} km/h de VMA estimée`;
      }
      if (type === 'cooper') {
        vmaEstimate = value / 200;
        calculated = `${vmaEstimate.toFixed(1)} km/h de vitesse moyenne sur 12 min`;
      }
      if (type === 'vameval') {
        vmaEstimate = value;
        calculated = `${value.toFixed(1)} km/h de VMA estimée`;
      }
      if (type === 'gainage') calculated = `${value} s/min selon l’unité saisie`;
      if (type === 'rabit') calculated = `RABIT enregistré : ${value}`;

      if (vmaEstimate) {
        const ageRef = getAgeReference(parseNumber(getProfile().age), getProfile().sex, vmaEstimate);
        interpretation = ageRef.category ? `VMA ${formatNumber(vmaEstimate)} km/h : repère d’âge ${ageRef.category} (${ageRef.label}).` : interpretVma(vmaEstimate);
      } else if (type === 'rabit') {
        interpretation = 'Le RABIT sert surtout à croiser intensité, ressenti et tolérance. Il doit être interprété avec les séances récentes.';
      }
    }

    return { calculated, interpretation, vmaEstimate };
  }

  function interpretVma(vma) {
    if (vma < 12) return 'Base aérobie à construire progressivement.';
    if (vma < 15) return 'Base correcte, travail régulier à consolider.';
    if (vma < 18) return 'Bon niveau aérobie, séances calibrées possibles.';
    return 'Niveau élevé, attention à la récupération et à la progressivité.';
  }

  function renderTests() {
    const tests = MomentumGoals.listItems('sport_tests');
    if (!tests.length) return '<div class="empty">Aucun test enregistré.</div>';
    return `<div class="goal-list">${tests.map(test => `
      <article class="goal-card">
        <header><div class="goal-title">${e(test.type).toUpperCase()} · ${e(test.raw)}</div><span class="badge">${e(test.date)}</span></header>
        ${test.calculated ? `<p class="goal-desc"><strong>${e(test.calculated)}</strong></p>` : ''}
        <p class="goal-desc">${e(test.interpretation)}</p>
        ${test.vmaEstimate ? `<div class="goal-meta"><span>VMA retenue : ${formatNumber(test.vmaEstimate)} km/h</span></div>` : ''}
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
  }

  function isWithinDays(dateString, days) {
    if (!dateString) return false;
    const date = new Date(dateString + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return false;
    const limit = new Date();
    limit.setDate(limit.getDate() - days);
    return date >= limit;
  }

  function daysSince(dateString) {
    if (!dateString) return Infinity;
    const date = new Date(dateString + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return Infinity;
    return Math.floor((new Date() - date) / 86400000);
  }

  function parseNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    return Number(String(value).replace(',', '.')) || 0;
  }

  function extractFirstNumber(value) {
    const match = String(value || '').replace(',', '.').match(/\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  }

  function formatNumber(value) {
    const number = Number(value || 0);
    return Number.isInteger(number) ? String(number) : number.toFixed(1).replace('.', ',');
  }

  function sexLabel(sex) {
    return sex === 'female' ? 'femme' : sex === 'male' ? 'homme' : 'sexe non renseigné';
  }

  function e(value) {
    return MomentumGoals.escapeHtml(value);
  }

  window.MomentumSport = { render };
}());
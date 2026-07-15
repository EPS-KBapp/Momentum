/* Shared goal engine for Sport, Hobbies and Brain. Chill keeps its existing storage. */
(function () {
  'use strict';

  const STORAGE_KEY = 'momentum_v2_goals';
  const SPACES = ['sport', 'hobbies', 'brain'];

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function readGoals() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function writeGoals(goals) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }

  function normalizeGoal(input) {
    const now = new Date().toISOString().slice(0, 10);
    return {
      id: input.id || uid('goal'),
      space: SPACES.includes(input.space) ? input.space : 'sport',
      title: String(input.title || '').trim(),
      description: String(input.description || '').trim(),
      category: String(input.category || '').trim(),
      horizon: input.horizon || 'short',
      startDate: input.startDate || now,
      targetDate: input.targetDate || '',
      priority: input.priority || 'normal',
      status: input.status || 'active',
      progress: Number(input.progress || 0),
      notes: String(input.notes || '').trim(),
      createdAt: input.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function createGoal(input) {
    const goal = normalizeGoal(input);
    if (!goal.title) throw new Error('Le titre est obligatoire.');
    const goals = readGoals();
    goals.unshift(goal);
    writeGoals(goals);
    return goal;
  }

  function updateGoal(id, patch) {
    const goals = readGoals();
    const index = goals.findIndex(goal => goal.id === id);
    if (index === -1) return null;
    goals[index] = normalizeGoal({ ...goals[index], ...patch, id });
    writeGoals(goals);
    return goals[index];
  }

  function deleteGoal(id) {
    const goals = readGoals();
    writeGoals(goals.filter(goal => goal.id !== id));
  }

  function listGoals(space) {
    const goals = readGoals();
    return space ? goals.filter(goal => goal.space === space) : goals;
  }

  function getGoalSummary(space) {
    const goals = listGoals(space);
    const active = goals.filter(goal => goal.status === 'active');
    if (!goals.length) return 'Aucun objectif pour le moment';
    if (active.length === 1) return '1 objectif actif';
    return `${active.length} objectifs actifs`;
  }

  function horizonLabel(horizon) {
    return ({ short: 'Court terme', medium: 'Moyen terme', long: 'Long terme' })[horizon] || 'Objectif';
  }

  function priorityLabel(priority) {
    return ({ low: 'Faible', normal: 'Normale', high: 'Haute' })[priority] || 'Normale';
  }

  window.MomentumGoals = {
    createGoal,
    updateGoal,
    deleteGoal,
    listGoals,
    getGoalSummary,
    horizonLabel,
    priorityLabel,
  };
}());

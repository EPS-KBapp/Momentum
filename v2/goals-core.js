/* Shared engine for Sport, Hobbies and Brain. Chill keeps its existing storage. */
(function () {
  'use strict';

  const KEYS = {
    goals: 'momentum_v2_goals',
    actions: 'momentum_v2_actions',
    logs: 'momentum_v2_logs',
    collections: 'momentum_v2_collections',
  };
  const SPACES = ['sport', 'hobbies', 'brain'];

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function read(key, fallback) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
      return parsed ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function ensureSpace(space) {
    return SPACES.includes(space) ? space : 'sport';
  }

  function normalizeGoal(input) {
    return {
      id: input.id || uid('goal'),
      space: ensureSpace(input.space),
      title: String(input.title || '').trim(),
      description: String(input.description || '').trim(),
      category: String(input.category || '').trim(),
      horizon: input.horizon || 'short',
      startDate: input.startDate || today(),
      targetDate: input.targetDate || '',
      priority: input.priority || 'normal',
      status: input.status || 'active',
      progress: Number(input.progress || 0),
      notes: String(input.notes || '').trim(),
      createdAt: input.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function normalizeAction(input) {
    return {
      id: input.id || uid('action'),
      space: ensureSpace(input.space),
      goalId: input.goalId || '',
      title: String(input.title || '').trim(),
      date: input.date || today(),
      category: String(input.category || '').trim(),
      plannedDuration: Number(input.plannedDuration || 0),
      plannedContent: String(input.plannedContent || '').trim(),
      plannedIntensity: String(input.plannedIntensity || '').trim(),
      status: input.status || 'planned',
      notes: String(input.notes || '').trim(),
      createdAt: input.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function normalizeLog(input) {
    return {
      id: input.id || uid('log'),
      space: ensureSpace(input.space),
      actionId: input.actionId || '',
      goalId: input.goalId || '',
      title: String(input.title || '').trim(),
      date: input.date || today(),
      status: input.status || 'done',
      realDuration: Number(input.realDuration || 0),
      realContent: String(input.realContent || '').trim(),
      feeling: input.feeling ? Number(input.feeling) : '',
      notes: String(input.notes || '').trim(),
      createdAt: input.createdAt || new Date().toISOString(),
    };
  }

  function readGoals() { return read(KEYS.goals, []); }
  function writeGoals(goals) { write(KEYS.goals, goals); }
  function readActions() { return read(KEYS.actions, []); }
  function writeActions(actions) { write(KEYS.actions, actions); }
  function readLogs() { return read(KEYS.logs, []); }
  function writeLogs(logs) { write(KEYS.logs, logs); }
  function readCollections() { return read(KEYS.collections, {}); }
  function writeCollections(collections) { write(KEYS.collections, collections); }

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
    writeGoals(readGoals().filter(goal => goal.id !== id));
    writeActions(readActions().filter(action => action.goalId !== id));
    writeLogs(readLogs().filter(log => log.goalId !== id));
  }

  function listGoals(space) {
    const goals = readGoals();
    return space ? goals.filter(goal => goal.space === space) : goals;
  }

  function createAction(input) {
    const action = normalizeAction(input);
    if (!action.title) throw new Error('Le titre est obligatoire.');
    const actions = readActions();
    actions.unshift(action);
    writeActions(actions);
    return action;
  }

  function updateAction(id, patch) {
    const actions = readActions();
    const index = actions.findIndex(action => action.id === id);
    if (index === -1) return null;
    actions[index] = normalizeAction({ ...actions[index], ...patch, id });
    writeActions(actions);
    return actions[index];
  }

  function deleteAction(id) {
    writeActions(readActions().filter(action => action.id !== id));
    writeLogs(readLogs().filter(log => log.actionId !== id));
  }

  function listActions(space) {
    const actions = readActions().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return space ? actions.filter(action => action.space === space) : actions;
  }

  function createLog(input) {
    const action = input.actionId ? readActions().find(item => item.id === input.actionId) : null;
    const log = normalizeLog({
      ...input,
      space: input.space || action?.space,
      goalId: input.goalId || action?.goalId,
      title: input.title || action?.title,
    });
    if (!log.title) throw new Error('Le titre est obligatoire.');
    const logs = readLogs();
    logs.unshift(log);
    writeLogs(logs);
    if (log.actionId) updateAction(log.actionId, { status: log.status === 'done' ? 'done' : 'partial' });
    return log;
  }

  function deleteLog(id) {
    writeLogs(readLogs().filter(log => log.id !== id));
  }

  function listLogs(space) {
    const logs = readLogs().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return space ? logs.filter(log => log.space === space) : logs;
  }

  function listItems(collectionName) {
    const collections = readCollections();
    return collections[collectionName] || [];
  }

  function createItem(collectionName, input) {
    const collections = readCollections();
    const item = { id: input.id || uid(collectionName), ...input, createdAt: input.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    collections[collectionName] = [item, ...(collections[collectionName] || [])];
    writeCollections(collections);
    return item;
  }

  function updateItem(collectionName, id, patch) {
    const collections = readCollections();
    const items = collections[collectionName] || [];
    collections[collectionName] = items.map(item => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item);
    writeCollections(collections);
  }

  function deleteItem(collectionName, id) {
    const collections = readCollections();
    collections[collectionName] = (collections[collectionName] || []).filter(item => item.id !== id);
    writeCollections(collections);
  }

  function exportData() {
    return {
      app: 'Momentum',
      schema: 'momentum_v2_local_data',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        goals: readGoals(),
        actions: readActions(),
        logs: readLogs(),
        collections: readCollections(),
      },
    };
  }

  function importData(payload) {
    const source = payload?.data || payload;
    if (!source || typeof source !== 'object') throw new Error('Fichier de sauvegarde invalide.');
    const goals = Array.isArray(source.goals) ? source.goals.map(normalizeGoal) : [];
    const actions = Array.isArray(source.actions) ? source.actions.map(normalizeAction) : [];
    const logs = Array.isArray(source.logs) ? source.logs.map(normalizeLog) : [];
    const collections = source.collections && typeof source.collections === 'object' && !Array.isArray(source.collections) ? source.collections : {};
    writeGoals(goals);
    writeActions(actions);
    writeLogs(logs);
    writeCollections(collections);
    return { goals: goals.length, actions: actions.length, logs: logs.length, collections: Object.keys(collections).length };
  }

  function getGoalSummary(space) {
    const goals = listGoals(space);
    const active = goals.filter(goal => goal.status === 'active');
    const actions = listActions(space).filter(action => action.status === 'planned');
    if (!goals.length && !actions.length) return 'Aucun objectif pour le moment';
    const bits = [];
    if (active.length) bits.push(`${active.length} objectif${active.length > 1 ? 's' : ''} actif${active.length > 1 ? 's' : ''}`);
    if (actions.length) bits.push(`${actions.length} action${actions.length > 1 ? 's' : ''} prévue${actions.length > 1 ? 's' : ''}`);
    return bits.join(' · ');
  }

  function horizonLabel(horizon) {
    return ({ short: 'Court terme', medium: 'Moyen terme', long: 'Long terme' })[horizon] || 'Objectif';
  }

  function priorityLabel(priority) {
    return ({ low: 'Faible', normal: 'Normale', high: 'Haute' })[priority] || 'Normale';
  }

  function statusLabel(status) {
    return ({ planned: 'Prévu', done: 'Réalisé', partial: 'Partiel', skipped: 'Non fait', active: 'Actif', suspended: 'Suspendu' })[status] || status;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.MomentumGoals = {
    createGoal,
    updateGoal,
    deleteGoal,
    listGoals,
    createAction,
    updateAction,
    deleteAction,
    listActions,
    createLog,
    deleteLog,
    listLogs,
    listItems,
    createItem,
    updateItem,
    deleteItem,
    exportData,
    importData,
    getGoalSummary,
    horizonLabel,
    priorityLabel,
    statusLabel,
    escapeHtml,
    today,
  };
}());
import { createInitialState, resetState, validateState } from './domain.js';

const STORAGE_KEY = 'probeloop-case-v1';

function safeLoad() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    validateState(parsed);
    return parsed;
  } catch (error) {
    console.warn('ProbeLoop could not restore local state; loading a clean fixture.', error);
    return createInitialState();
  }
}

export function createStore({ persist = true } = {}) {
  let state = persist ? safeLoad() : createInitialState();
  let toolActivity = null;
  const listeners = new Set();

  function notify(reason = 'state') {
    const snapshot = { state, toolActivity, reason };
    for (const listener of listeners) listener(snapshot);
  }

  function save() {
    if (!persist) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('ProbeLoop state could not be saved.', error);
    }
  }

  return {
    getState() {
      return state;
    },
    getToolActivity() {
      return toolActivity;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    replace(nextState, reason = 'state') {
      validateState(nextState);
      state = nextState;
      save();
      notify(reason);
      return state;
    },
    transact(mutator, reason = 'state') {
      return this.replace(mutator(state), reason);
    },
    pulse(name, kind, detail = '') {
      toolActivity = {
        name,
        kind,
        detail,
        at: new Date().toISOString(),
      };
      notify('tool');
    },
    reset() {
      state = resetState(state);
      toolActivity = null;
      save();
      notify('reset');
      return state;
    },
    clearPersistence() {
      if (persist) localStorage.removeItem(STORAGE_KEY);
    },
  };
}

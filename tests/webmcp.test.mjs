import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/store.js';
import { createToolSystem } from '../src/tools.js';
import { registerWebMCPTools } from '../src/webmcp.js';

test('gracefully falls back when document.modelContext is unavailable', async () => {
  const { tools } = createToolSystem(createStore({ persist: false }));
  const result = await registerWebMCPTools(tools, { documentRef: {} });
  assert.equal(result.available, false);
  assert.equal(result.registered, 0);
  assert.doesNotThrow(() => result.dispose());
});

test('registers every tool with an AbortSignal and disposes cleanly', async () => {
  const { tools } = createToolSystem(createStore({ persist: false }));
  const registrations = [];
  const documentRef = {
    modelContext: {
      async registerTool(tool, options) {
        registrations.push({ tool, signal: options.signal });
      },
    },
  };
  const result = await registerWebMCPTools(tools, { documentRef });
  assert.equal(result.available, true);
  assert.equal(result.registered, 9);
  assert.equal(result.errors.length, 0);
  assert.ok(registrations.every(({ signal }) => signal instanceof AbortSignal && !signal.aborted));
  result.dispose();
  assert.ok(registrations.every(({ signal }) => signal.aborted));
});

test('one failed registration does not hide successful tools', async () => {
  const { tools } = createToolSystem(createStore({ persist: false }));
  const documentRef = {
    modelContext: {
      async registerTool(tool) {
        if (tool.name === 'focus_component') throw new Error('fixture rejection');
      },
    },
  };
  const result = await registerWebMCPTools(tools, { documentRef });
  assert.equal(result.available, true);
  assert.equal(result.registered, 8);
  assert.deepEqual(result.errors.map((error) => error.name), ['focus_component']);
});

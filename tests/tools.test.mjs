import test from 'node:test';
import assert from 'node:assert/strict';
import { approveRepairPlan, attestRepairCompleted } from '../src/domain.js';
import { createStore } from '../src/store.js';
import { createToolSystem } from '../src/tools.js';

function setup() {
  const store = createStore({ persist: false });
  return { store, system: createToolSystem(store) };
}

function parameterDescriptions(schema) {
  return Object.values(schema.properties ?? {}).map((property) => property.description ?? '');
}

test('manifest has nine unique, bounded, succinct tools and no approval capability', () => {
  const { system } = setup();
  assert.equal(system.tools.length, 9);
  assert.equal(new Set(system.tools.map((tool) => tool.name)).size, 9);
  assert.ok(system.tools.every((tool) => tool.name.length <= 30));
  assert.ok(system.tools.every((tool) => tool.description.length <= 500));
  assert.ok(system.tools.every((tool) => tool.inputSchema.additionalProperties === false));
  assert.ok(system.tools.flatMap((tool) => parameterDescriptions(tool.inputSchema)).every((description) => description.length <= 150));
  assert.equal(system.tools.filter((tool) => tool.annotations.readOnlyHint).length, 4);
  assert.equal(system.tools.some((tool) => /approve|perform_repair|execute_repair/.test(tool.name)), false);
});

test('human text entry tools carry untrusted content hints', () => {
  const { system } = setup();
  for (const name of ['record_measurement', 'stage_repair_plan', 'record_post_repair_check']) {
    assert.equal(system.tools.find((tool) => tool.name === name).annotations.untrustedContentHint, true);
  }
});

test('golden flow works through WebMCP handlers and human-only UI services', async () => {
  const { store, system } = setup();
  let result = await system.invoke('get_case_state', {});
  assert.equal(result.version, 1);

  result = await system.invoke('select_test', { test_id: 'f1_continuity', expected_version: 1 });
  assert.equal(result.version, 2);

  result = await system.invoke('record_measurement', {
    test_id: 'f1_continuity', outcome: 'open', observed_by: 'human', power_disconnected: true, expected_version: 2,
  });
  assert.equal(result.version, 3);
  assert.ok(result.leading_hypothesis.confidence > 0.89);

  result = await system.invoke('stage_repair_plan', { repair_id: 'replace_f1', expected_version: 3 });
  assert.equal(result.version, 4);
  assert.equal(result.repair_plan.status, 'staged');

  store.transact((state) => approveRepairPlan(state, { expectedVersion: 4, actor: 'human' }));
  store.transact((state) => attestRepairCompleted(state, {
    performedByHuman: true, powerDisconnected: true, expectedVersion: 5, actor: 'human',
  }));

  result = await system.invoke('record_post_repair_check', {
    startup: 'normal', charging_indicator: 'normal', observed_by: 'human', expected_version: 6,
  });
  assert.equal(result.phase, 'resolved');
  assert.equal(result.version, 7);
});

test('agent cannot attribute a measurement to itself', async () => {
  const { system } = setup();
  await system.invoke('select_test', { test_id: 'f1_continuity', expected_version: 1 });
  const result = await system.invoke('record_measurement', {
    test_id: 'f1_continuity', outcome: 'open', observed_by: 'agent', power_disconnected: true, expected_version: 2,
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'HUMAN_OBSERVATION_REQUIRED');
});

test('stale tool calls produce self-correcting version guidance', async () => {
  const { system } = setup();
  const result = await system.invoke('select_test', { test_id: 'f1_continuity', expected_version: 8 });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'STALE_VERSION');
  assert.match(result.message, /version 1/);
});

test('registered execute functions return bounded JSON strings', async () => {
  const { system } = setup();
  for (const tool of system.tools.filter((item) => item.annotations.readOnlyHint)) {
    const result = await tool.execute({});
    assert.equal(typeof result, 'string');
    assert.ok(result.length <= 1500, `${tool.name} result was ${result.length} characters`);
    assert.doesNotThrow(() => JSON.parse(result));
  }
});

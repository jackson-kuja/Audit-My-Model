import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DomainError,
  approveRepairPlan,
  attestRepairCompleted,
  buildCaseReport,
  createInitialState,
  entropy,
  focusComponent,
  rankAvailableTests,
  rankedHypotheses,
  recordMeasurement,
  recordPostRepairCheck,
  rejectRepairPlan,
  selectTest,
  stageRepairPlan,
} from '../src/domain.js';

test('initial fixture is normalized and ranks F1 continuity first', () => {
  const state = createInitialState();
  assert.equal(state.version, 1);
  assert.equal(state.phase, 'diagnose');
  assert.ok(Math.abs(Object.values(state.probabilities).reduce((a, b) => a + b, 0) - 1) < 1e-9);
  const tests = rankAvailableTests(state);
  assert.deepEqual(tests.map((item) => item.id), ['f1_continuity', 'input_resistance', 'battery_voltage']);
  assert.ok(tests[0].informationGainBits > tests[1].informationGainBits);
  assert.ok(Math.abs(tests[0].informationGainBits - 0.662111) < 1e-5);
  assert.ok(entropy(state.probabilities) > 2);
});

test('golden human-agent repair path resolves in seven versions', () => {
  let state = createInitialState();
  state = selectTest(state, { testId: 'f1_continuity', expectedVersion: 1, actor: 'agent' });
  assert.equal(state.version, 2);
  assert.equal(state.selectedTestId, 'f1_continuity');

  state = recordMeasurement(state, {
    testId: 'f1_continuity',
    outcome: 'open',
    observedBy: 'human',
    powerDisconnected: true,
    note: 'Meter remained OL.',
    expectedVersion: 2,
    actor: 'agent',
  });
  assert.equal(state.version, 3);
  assert.equal(state.phase, 'evidence_recorded');
  assert.equal(rankedHypotheses(state)[0].id, 'f1_open');
  assert.ok(rankedHypotheses(state)[0].probability > 0.89);

  state = stageRepairPlan(state, {
    repairId: 'replace_f1',
    rationale: 'Open fuse crossed the threshold.',
    expectedVersion: 3,
    actor: 'agent',
  });
  assert.equal(state.version, 4);
  assert.equal(state.phase, 'repair_review');
  assert.equal(state.repairPlan.status, 'staged');

  state = approveRepairPlan(state, { expectedVersion: 4, actor: 'human' });
  assert.equal(state.version, 5);
  assert.equal(state.phase, 'repair_attestation');

  state = attestRepairCompleted(state, {
    performedByHuman: true,
    powerDisconnected: true,
    expectedVersion: 5,
    actor: 'human',
  });
  assert.equal(state.version, 6);
  assert.equal(state.phase, 'verify');

  state = recordPostRepairCheck(state, {
    startup: 'normal',
    chargingIndicator: 'normal',
    observedBy: 'human',
    note: 'Normal boot and charge light.',
    expectedVersion: 6,
    actor: 'agent',
  });
  assert.equal(state.version, 7);
  assert.equal(state.phase, 'resolved');
  assert.equal(state.repairPlan.status, 'verified');

  const report = buildCaseReport(state);
  assert.equal(report.repair.approved_by_human, true);
  assert.equal(report.repair.completed_by_human, true);
  assert.equal(report.verification.passed, true);
  assert.equal(report.audit.length, 7);
});

test('measurement requires a human observation and disconnected power', () => {
  const selected = selectTest(createInitialState(), {
    testId: 'f1_continuity',
    expectedVersion: 1,
    actor: 'agent',
  });
  assert.throws(() => recordMeasurement(selected, {
    testId: 'f1_continuity', outcome: 'open', observedBy: 'agent', powerDisconnected: true, expectedVersion: 2,
  }), (error) => error instanceof DomainError && error.code === 'HUMAN_OBSERVATION_REQUIRED');
  assert.throws(() => recordMeasurement(selected, {
    testId: 'f1_continuity', outcome: 'open', observedBy: 'human', powerDisconnected: false, expectedVersion: 2,
  }), (error) => error instanceof DomainError && error.code === 'POWER_BOUNDARY_REQUIRED');
});

test('exact measurement replay is idempotent at the current version', () => {
  let state = selectTest(createInitialState(), { testId: 'f1_continuity', expectedVersion: 1 });
  state = recordMeasurement(state, {
    testId: 'f1_continuity', outcome: 'open', observedBy: 'human', powerDisconnected: true, expectedVersion: 2,
  });
  const replayed = recordMeasurement(state, {
    testId: 'f1_continuity', outcome: 'open', observedBy: 'human', powerDisconnected: true, expectedVersion: 3,
  });
  assert.equal(replayed.version, 3);
  assert.equal(replayed.measurements.length, 1);
});

test('repair cannot be staged before its confidence threshold', () => {
  const state = createInitialState();
  assert.throws(() => stageRepairPlan(state, {
    repairId: 'replace_f1', expectedVersion: 1,
  }), (error) => error instanceof DomainError && error.code === 'INVALID_PHASE');
});

test('approval and completion are human-only', () => {
  let state = selectTest(createInitialState(), { testId: 'f1_continuity', expectedVersion: 1 });
  state = recordMeasurement(state, {
    testId: 'f1_continuity', outcome: 'open', observedBy: 'human', powerDisconnected: true, expectedVersion: 2,
  });
  state = stageRepairPlan(state, { repairId: 'replace_f1', expectedVersion: 3 });
  assert.throws(() => approveRepairPlan(state, { expectedVersion: 4, actor: 'agent' }), (error) => error.code === 'HUMAN_APPROVAL_REQUIRED');
  state = approveRepairPlan(state, { expectedVersion: 4, actor: 'human' });
  assert.throws(() => attestRepairCompleted(state, {
    performedByHuman: true, powerDisconnected: true, expectedVersion: 5, actor: 'agent',
  }), (error) => error.code === 'HUMAN_ATTESTATION_REQUIRED');
});

test('stale state-changing calls fail closed', () => {
  const state = createInitialState();
  assert.throws(() => focusComponent(state, {
    componentId: 'D3', expectedVersion: 99, actor: 'agent',
  }), (error) => error instanceof DomainError && error.code === 'STALE_VERSION');
});

test('human rejection records zero completion and reopens evidence', () => {
  let state = selectTest(createInitialState(), { testId: 'f1_continuity', expectedVersion: 1 });
  state = recordMeasurement(state, {
    testId: 'f1_continuity', outcome: 'open', observedBy: 'human', powerDisconnected: true, expectedVersion: 2,
  });
  state = stageRepairPlan(state, { repairId: 'replace_f1', expectedVersion: 3 });
  state = rejectRepairPlan(state, { reason: 'Inspect pads first.', expectedVersion: 4, actor: 'human' });
  assert.equal(state.phase, 'evidence_recorded');
  assert.equal(state.repairPlan.status, 'rejected');
  assert.equal(state.repairPlan.completion, null);
});

test('failed post-repair observations reopen diagnosis', () => {
  let state = createInitialState();
  state = selectTest(state, { testId: 'f1_continuity', expectedVersion: 1 });
  state = recordMeasurement(state, {
    testId: 'f1_continuity', outcome: 'open', observedBy: 'human', powerDisconnected: true, expectedVersion: 2,
  });
  state = stageRepairPlan(state, { repairId: 'replace_f1', expectedVersion: 3 });
  state = approveRepairPlan(state, { expectedVersion: 4, actor: 'human' });
  state = attestRepairCompleted(state, {
    performedByHuman: true, powerDisconnected: true, expectedVersion: 5, actor: 'human',
  });
  state = recordPostRepairCheck(state, {
    startup: 'failed', chargingIndicator: 'failed', observedBy: 'human', expectedVersion: 6,
  });
  assert.equal(state.phase, 'evidence_recorded');
  assert.equal(state.repairPlan.status, 'verification_failed');
});

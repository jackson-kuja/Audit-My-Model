import {
  DEVICE,
  FIXTURE_VERSION,
  HYPOTHESES,
  REPAIRS,
  TESTS,
  getHypothesis,
  getRepair,
  getTest,
} from './data.js';

const EPSILON = 1e-12;

export class DomainError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.details = details;
  }
}

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function assert(condition, code, message, details = {}) {
  if (!condition) throw new DomainError(code, message, details);
}

function round(value, digits = 6) {
  return Number(value.toFixed(digits));
}

function nowIso() {
  return new Date().toISOString();
}

export function normalize(probabilities) {
  const total = Object.values(probabilities).reduce((sum, value) => sum + value, 0);
  assert(total > EPSILON, 'INVALID_PROBABILITIES', 'Probability mass must be greater than zero.');
  return Object.fromEntries(
    Object.entries(probabilities).map(([key, value]) => [key, value / total]),
  );
}

export function entropy(probabilities) {
  return -Object.values(probabilities).reduce((sum, probability) => {
    if (probability <= EPSILON) return sum;
    return sum + probability * Math.log2(probability);
  }, 0);
}

export function posterior(probabilities, test, outcome) {
  assert(test?.outcomes?.includes(outcome), 'INVALID_OUTCOME', `Outcome "${outcome}" is not valid for ${test?.id ?? 'this test'}.`);
  const weighted = {};
  for (const hypothesis of HYPOTHESES) {
    const likelihood = test.likelihoods[hypothesis.id]?.[outcome];
    assert(Number.isFinite(likelihood), 'MISSING_LIKELIHOOD', `Likelihood is missing for ${hypothesis.id}/${outcome}.`);
    weighted[hypothesis.id] = (probabilities[hypothesis.id] ?? 0) * likelihood;
  }
  return normalize(weighted);
}

export function expectedInformationGain(probabilities, test) {
  const before = entropy(probabilities);
  let expectedAfter = 0;
  const outcomeProbabilities = {};

  for (const outcome of test.outcomes) {
    const probability = HYPOTHESES.reduce((sum, hypothesis) => (
      sum + (probabilities[hypothesis.id] ?? 0) * test.likelihoods[hypothesis.id][outcome]
    ), 0);
    outcomeProbabilities[outcome] = probability;
    if (probability > EPSILON) {
      expectedAfter += probability * entropy(posterior(probabilities, test, outcome));
    }
  }

  return {
    bits: before - expectedAfter,
    before,
    expectedAfter,
    outcomeProbabilities,
  };
}

export function rankedHypotheses(state) {
  return HYPOTHESES.map((hypothesis) => ({
    ...hypothesis,
    probability: state.probabilities[hypothesis.id],
  })).sort((a, b) => b.probability - a.probability);
}

export function rankAvailableTests(state) {
  const completed = new Set(state.measurements.map((measurement) => measurement.testId));
  return TESTS.filter((test) => !completed.has(test.id))
    .map((test) => {
      const information = expectedInformationGain(state.probabilities, test);
      return {
        ...test,
        informationGainBits: information.bits,
        informationGainRounded: round(information.bits, 3),
        utilityPerMinute: information.bits / test.timeMinutes,
      };
    })
    .sort((a, b) => {
      if (b.informationGainBits !== a.informationGainBits) return b.informationGainBits - a.informationGainBits;
      return a.timeMinutes - b.timeMinutes;
    });
}

function baseProbabilities() {
  return Object.fromEntries(HYPOTHESES.map((hypothesis) => [hypothesis.id, hypothesis.prior]));
}

function event(type, actor, summary, version, details = {}) {
  return {
    id: `${version}-${type}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    actor,
    summary,
    version,
    details,
    at: nowIso(),
  };
}

export function createInitialState() {
  const state = {
    fixtureVersion: FIXTURE_VERSION,
    caseId: 'PL-AM2-0042',
    version: 1,
    phase: 'diagnose',
    focusedComponentId: 'F1',
    selectedTestId: null,
    probabilities: baseProbabilities(),
    measurements: [],
    repairPlan: null,
    postRepairCheck: null,
    resetCount: 0,
    audit: [],
  };
  state.audit.push(event(
    'case_opened',
    'system',
    `${DEVICE.name} intake loaded with five bounded hypotheses.`,
    state.version,
    { fixtureVersion: FIXTURE_VERSION },
  ));
  return state;
}

export function validateState(state) {
  assert(state && typeof state === 'object', 'INVALID_STATE', 'Case state must be an object.');
  assert(Number.isInteger(state.version) && state.version >= 1, 'INVALID_STATE', 'Case version must be a positive integer.');
  assert(state.fixtureVersion === FIXTURE_VERSION, 'STALE_FIXTURE', 'This case was created with a different fixture version.');
  const normalized = normalize(state.probabilities);
  for (const hypothesis of HYPOTHESES) {
    assert(Number.isFinite(normalized[hypothesis.id]), 'INVALID_STATE', `Probability missing for ${hypothesis.id}.`);
  }
  assert(Array.isArray(state.audit), 'INVALID_STATE', 'Audit trail must be an array.');
  return true;
}

function requireVersion(state, expectedVersion) {
  assert(
    Number.isInteger(expectedVersion),
    'VERSION_REQUIRED',
    'expected_version is required for state-changing tools.',
  );
  assert(
    state.version === expectedVersion,
    'STALE_VERSION',
    `The case is now version ${state.version}; refresh state before retrying.`,
    { expectedVersion, currentVersion: state.version },
  );
}

function advance(state, type, actor, summary, details = {}) {
  const next = clone(state);
  next.version += 1;
  next.audit.push(event(type, actor, summary, next.version, details));
  validateState(next);
  return next;
}

export function getCaseState(state) {
  validateState(state);
  const hypotheses = rankedHypotheses(state);
  const rankedTests = rankAvailableTests(state);
  return {
    case_id: state.caseId,
    version: state.version,
    phase: state.phase,
    device: DEVICE,
    focused_component_id: state.focusedComponentId,
    selected_test_id: state.selectedTestId,
    leading_hypothesis: hypotheses[0]
      ? {
          id: hypotheses[0].id,
          label: hypotheses[0].label,
          component_id: hypotheses[0].componentId,
          confidence: round(hypotheses[0].probability, 4),
        }
      : null,
    hypotheses: hypotheses.map((item) => ({
      id: item.id,
      label: item.label,
      component_id: item.componentId,
      confidence: round(item.probability, 4),
      rationale: item.rationale,
    })),
    recommended_test: rankedTests[0]
      ? {
          id: rankedTests[0].id,
          name: rankedTests[0].name,
          target: rankedTests[0].target,
          expected_information_gain_bits: round(rankedTests[0].informationGainBits, 3),
          time_minutes: rankedTests[0].timeMinutes,
          risk: rankedTests[0].risk,
        }
      : null,
    measurements: clone(state.measurements),
    repair_plan: clone(state.repairPlan),
    post_repair_check: clone(state.postRepairCheck),
    recent_activity: clone(state.audit.slice(-5)),
  };
}

export function focusComponent(state, { componentId, expectedVersion, actor = 'agent' }) {
  requireVersion(state, expectedVersion);
  const componentExists = ['J1', 'F1', 'D3', 'U2', 'B1', 'U5'].includes(componentId);
  assert(componentExists, 'UNKNOWN_COMPONENT', `Component ${componentId} is not in this fixture.`);
  if (state.focusedComponentId === componentId) return clone(state);
  const next = advance(state, 'component_focused', actor, `${componentId} focused on the shared board.`, { componentId });
  next.focusedComponentId = componentId;
  return next;
}

export function selectTest(state, { testId, expectedVersion, actor = 'agent' }) {
  requireVersion(state, expectedVersion);
  assert(['diagnose', 'test_selected', 'evidence_recorded'].includes(state.phase), 'INVALID_PHASE', 'A diagnostic test cannot be selected in the current phase.');
  const test = getTest(testId);
  assert(test, 'UNKNOWN_TEST', `Test ${testId} is not available.`);
  assert(!state.measurements.some((measurement) => measurement.testId === testId), 'TEST_ALREADY_RECORDED', `${test.name} already has a recorded result.`);
  if (state.selectedTestId === testId && state.phase === 'test_selected') return clone(state);
  const next = advance(state, 'test_selected', actor, `${test.shortName} selected; probe points are now visible.`, { testId });
  next.phase = 'test_selected';
  next.selectedTestId = testId;
  next.focusedComponentId = test.target;
  return next;
}

export function recordMeasurement(state, {
  testId,
  outcome,
  observedBy,
  powerDisconnected,
  note = '',
  expectedVersion,
  actor = 'agent',
}) {
  requireVersion(state, expectedVersion);
  const test = getTest(testId);
  assert(test, 'UNKNOWN_TEST', `Test ${testId} is not available.`);
  assert(observedBy === 'human', 'HUMAN_OBSERVATION_REQUIRED', 'A person must perform the physical measurement and report the result.');
  assert(powerDisconnected === true, 'POWER_BOUNDARY_REQUIRED', 'Confirm USB power is disconnected before recording this synthetic measurement.');
  assert(test.outcomes.includes(outcome), 'INVALID_OUTCOME', `Use one of: ${test.outcomes.join(', ')}.`);
  assert(typeof note === 'string' && note.length <= 240, 'INVALID_NOTE', 'Measurement notes must be 240 characters or fewer.');

  const existing = state.measurements.find((measurement) => measurement.testId === testId);
  if (existing) {
    assert(existing.outcome === outcome, 'CONFLICTING_MEASUREMENT', `${test.shortName} already has a different result.`);
    return clone(state);
  }

  assert(state.phase === 'test_selected', 'INVALID_PHASE', 'Select the test before recording a result.');
  assert(state.selectedTestId === testId, 'WRONG_SELECTED_TEST', `The selected test is ${state.selectedTestId ?? 'none'}.`);

  const probabilities = posterior(state.probabilities, test, outcome);
  const next = advance(
    state,
    'measurement_recorded',
    actor,
    `Human reported ${test.outcomeLabels[outcome]} for ${test.shortName}.`,
    { testId, outcome, observedBy, powerDisconnected, note },
  );
  next.probabilities = probabilities;
  next.measurements.push({
    testId,
    testName: test.name,
    outcome,
    outcomeLabel: test.outcomeLabels[outcome],
    observedBy,
    powerDisconnected,
    note,
    recordedAt: nowIso(),
  });
  next.selectedTestId = null;
  next.phase = 'evidence_recorded';
  next.focusedComponentId = test.target;
  return next;
}

function availableRepair(state, repairId) {
  const repair = getRepair(repairId);
  assert(repair, 'UNKNOWN_REPAIR', `Repair ${repairId} is not available.`);
  const hypothesis = getHypothesis(repair.hypothesisId);
  const confidence = state.probabilities[repair.hypothesisId] ?? 0;
  assert(
    confidence >= repair.confidenceThreshold,
    'INSUFFICIENT_CONFIDENCE',
    `${hypothesis.label} is at ${(confidence * 100).toFixed(1)}%; ${Math.round(repair.confidenceThreshold * 100)}% is required to stage this repair.`,
    { confidence, threshold: repair.confidenceThreshold },
  );
  return { repair, hypothesis, confidence };
}

export function stageRepairPlan(state, { repairId, rationale = '', expectedVersion, actor = 'agent' }) {
  requireVersion(state, expectedVersion);
  assert(state.phase === 'evidence_recorded' || state.phase === 'repair_review', 'INVALID_PHASE', 'Record diagnostic evidence before staging a repair.');
  assert(typeof rationale === 'string' && rationale.length <= 280, 'INVALID_RATIONALE', 'Repair rationale must be 280 characters or fewer.');
  const { repair, hypothesis, confidence } = availableRepair(state, repairId);

  if (state.repairPlan?.repairId === repairId && state.repairPlan.status === 'staged') {
    return clone(state);
  }

  const next = advance(
    state,
    'repair_staged',
    actor,
    `${repair.name} staged for human review.`,
    { repairId, rationale, confidence: round(confidence, 4) },
  );
  next.phase = 'repair_review';
  next.focusedComponentId = repair.componentId;
  next.repairPlan = {
    repairId,
    name: repair.name,
    componentId: repair.componentId,
    hypothesisId: hypothesis.id,
    hypothesis: hypothesis.label,
    confidence: round(confidence, 4),
    rationale: rationale || repair.boundedReason,
    steps: clone(repair.steps),
    postCheck: repair.postCheck,
    status: 'staged',
    stagedBy: actor,
    stagedAt: nowIso(),
    stagedVersion: next.version,
    approval: null,
    completion: null,
  };
  return next;
}

export function approveRepairPlan(state, { expectedVersion, actor = 'human' }) {
  requireVersion(state, expectedVersion);
  assert(actor === 'human', 'HUMAN_APPROVAL_REQUIRED', 'Repair approval belongs to the person at the bench.');
  assert(state.phase === 'repair_review' && state.repairPlan?.status === 'staged', 'INVALID_PHASE', 'No current repair plan is waiting for approval.');
  const next = advance(state, 'repair_approved', actor, `${state.repairPlan.name} approved by the person at the bench.`, {
    repairId: state.repairPlan.repairId,
  });
  next.phase = 'repair_attestation';
  next.repairPlan.status = 'approved';
  next.repairPlan.approval = { actor, at: nowIso(), version: next.version };
  return next;
}

export function rejectRepairPlan(state, { reason = '', expectedVersion, actor = 'human' }) {
  requireVersion(state, expectedVersion);
  assert(actor === 'human', 'HUMAN_APPROVAL_REQUIRED', 'Repair rejection belongs to the person at the bench.');
  assert(state.phase === 'repair_review' && state.repairPlan?.status === 'staged', 'INVALID_PHASE', 'No current repair plan is waiting for review.');
  assert(typeof reason === 'string' && reason.length <= 240, 'INVALID_REASON', 'Rejection reason must be 240 characters or fewer.');
  const next = advance(state, 'repair_rejected', actor, 'The staged repair was rejected; no physical-work step was recorded.', {
    repairId: state.repairPlan.repairId,
    reason,
  });
  next.phase = 'evidence_recorded';
  next.repairPlan.status = 'rejected';
  next.repairPlan.approval = { actor, at: nowIso(), version: next.version, reason };
  return next;
}

export function attestRepairCompleted(state, {
  performedByHuman,
  powerDisconnected,
  expectedVersion,
  actor = 'human',
}) {
  requireVersion(state, expectedVersion);
  assert(actor === 'human', 'HUMAN_ATTESTATION_REQUIRED', 'Only the person at the bench can attest that physical work was performed.');
  assert(state.phase === 'repair_attestation' && state.repairPlan?.status === 'approved', 'INVALID_PHASE', 'Approve the repair plan before recording physical completion.');
  assert(performedByHuman === true, 'HUMAN_ATTESTATION_REQUIRED', 'Confirm that a person performed the physical repair.');
  assert(powerDisconnected === true, 'POWER_BOUNDARY_REQUIRED', 'Confirm power was disconnected during the repair.');
  const next = advance(state, 'repair_completed', actor, 'Human attested that the approved physical repair was completed with power disconnected.', {
    repairId: state.repairPlan.repairId,
    performedByHuman,
    powerDisconnected,
  });
  next.phase = 'verify';
  next.repairPlan.status = 'completed';
  next.repairPlan.completion = { actor, at: nowIso(), version: next.version, performedByHuman, powerDisconnected };
  return next;
}

export function recordPostRepairCheck(state, {
  startup,
  chargingIndicator,
  observedBy,
  note = '',
  expectedVersion,
  actor = 'agent',
}) {
  requireVersion(state, expectedVersion);
  assert(observedBy === 'human', 'HUMAN_OBSERVATION_REQUIRED', 'A person must observe the device after the repair.');
  assert(['normal', 'failed'].includes(startup), 'INVALID_OUTCOME', 'startup must be normal or failed.');
  assert(['normal', 'failed'].includes(chargingIndicator), 'INVALID_OUTCOME', 'charging_indicator must be normal or failed.');
  assert(typeof note === 'string' && note.length <= 240, 'INVALID_NOTE', 'Verification notes must be 240 characters or fewer.');

  if (state.postRepairCheck) {
    const same = state.postRepairCheck.startup === startup
      && state.postRepairCheck.chargingIndicator === chargingIndicator;
    assert(same, 'CONFLICTING_POST_CHECK', 'A different post-repair result is already recorded.');
    return clone(state);
  }

  assert(state.phase === 'verify' && state.repairPlan?.status === 'completed', 'INVALID_PHASE', 'The approved repair must be completed before verification.');
  const passed = startup === 'normal' && chargingIndicator === 'normal';
  const next = advance(
    state,
    'post_repair_check_recorded',
    actor,
    passed
      ? 'Human observed normal startup and charging; the case is verified.'
      : 'Human observed a failed post-repair check; diagnosis must continue.',
    { startup, chargingIndicator, observedBy, note, passed },
  );
  next.postRepairCheck = {
    startup,
    chargingIndicator,
    observedBy,
    note,
    passed,
    recordedAt: nowIso(),
  };
  next.phase = passed ? 'resolved' : 'evidence_recorded';
  next.repairPlan.status = passed ? 'verified' : 'verification_failed';
  return next;
}

export function buildCaseReport(state) {
  validateState(state);
  const leader = rankedHypotheses(state)[0];
  return {
    title: `ProbeLoop case ${state.caseId}`,
    fixture_version: state.fixtureVersion,
    case_version: state.version,
    status: state.phase,
    device: `${DEVICE.name} · ${DEVICE.board}`,
    symptom: DEVICE.symptom,
    leading_hypothesis: {
      id: leader.id,
      label: leader.label,
      confidence: round(leader.probability, 4),
    },
    evidence: state.measurements.map((measurement) => ({
      test: measurement.testName,
      result: measurement.outcomeLabel,
      observed_by: measurement.observedBy,
      power_disconnected: measurement.powerDisconnected,
    })),
    repair: state.repairPlan
      ? {
          plan: state.repairPlan.name,
          status: state.repairPlan.status,
          approved_by_human: state.repairPlan.approval?.actor === 'human',
          completed_by_human: state.repairPlan.completion?.actor === 'human',
        }
      : null,
    verification: clone(state.postRepairCheck),
    audit: state.audit.map(({ at, version, actor, type, summary }) => ({ at, version, actor, type, summary })),
    disclaimer: DEVICE.safety,
  };
}

export function resetState(previousState = null) {
  const state = createInitialState();
  state.resetCount = (previousState?.resetCount ?? 0) + 1;
  return state;
}

export const phaseLabels = Object.freeze({
  diagnose: 'Diagnose',
  test_selected: 'Probe',
  evidence_recorded: 'Interpret',
  repair_review: 'Review',
  repair_attestation: 'Repair',
  verify: 'Verify',
  resolved: 'Resolved',
});

export const phaseSteps = Object.freeze({
  diagnose: 1,
  test_selected: 2,
  evidence_recorded: 3,
  repair_review: 4,
  repair_attestation: 5,
  verify: 6,
  resolved: 7,
});

export function formatToolError(error) {
  if (error instanceof DomainError) {
    return {
      ok: false,
      error: error.code,
      message: error.message,
      details: error.details,
    };
  }
  return {
    ok: false,
    error: 'UNEXPECTED_ERROR',
    message: error instanceof Error ? error.message : String(error),
  };
}

export { REPAIRS, TESTS };

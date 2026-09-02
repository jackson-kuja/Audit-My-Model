import {
  buildCaseReport,
  focusComponent,
  formatToolError,
  getCaseState,
  rankAvailableTests,
  recordMeasurement,
  recordPostRepairCheck,
  selectTest,
  stageRepairPlan,
} from './domain.js';
import { COMPONENTS, REPAIRS, getRepair, getTest } from './data.js';

const closedObject = (properties = {}, required = []) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
});

const versionField = {
  type: 'integer',
  minimum: 1,
  description: 'Current case version returned by get_case_state.',
};

const annotations = {
  read: { readOnlyHint: true, untrustedContentHint: false },
  write: { readOnlyHint: false, untrustedContentHint: false },
  writeUntrusted: { readOnlyHint: false, untrustedContentHint: true },
};

function conciseState(state) {
  const full = getCaseState(state);
  return {
    ok: true,
    case_id: full.case_id,
    version: full.version,
    phase: full.phase,
    focused_component_id: full.focused_component_id,
    selected_test_id: full.selected_test_id,
    leading_hypothesis: full.leading_hypothesis,
    recommended_test: full.recommended_test,
    measurements: full.measurements.map(({ testId, outcomeLabel, observedBy }) => ({
      test_id: testId,
      result: outcomeLabel,
      observed_by: observedBy,
    })),
    repair_plan: full.repair_plan
      ? {
          repair_id: full.repair_plan.repairId,
          name: full.repair_plan.name,
          status: full.repair_plan.status,
        }
      : null,
    verification: full.post_repair_check,
  };
}

function jsonResult(value) {
  const json = JSON.stringify(value);
  if (json.length <= 1450) return json;
  return JSON.stringify({
    ok: value.ok ?? true,
    message: 'Result was shortened for the agent context. Read the shared interface or call get_case_state for current details.',
    case_id: value.case_id,
    version: value.version,
    phase: value.phase,
  });
}

export function createToolSystem(store) {
  const handlers = {
    get_case_state: async () => conciseState(store.getState()),

    list_safe_tests: async () => {
      const state = store.getState();
      return {
        ok: true,
        case_id: state.caseId,
        version: state.version,
        tests: rankAvailableTests(state).map((test) => ({
          test_id: test.id,
          name: test.name,
          target: test.target,
          instrument: test.instrument,
          power_state: test.powerState,
          risk: test.risk,
          time_minutes: test.timeMinutes,
          expected_information_gain_bits: Number(test.informationGainBits.toFixed(3)),
          outcomes: test.outcomes,
        })),
      };
    },

    recommend_next_test: async () => {
      const state = store.getState();
      const test = rankAvailableTests(state)[0];
      if (!test) {
        return { ok: true, case_id: state.caseId, version: state.version, recommendation: null, message: 'No unrecorded fixture tests remain.' };
      }
      return {
        ok: true,
        case_id: state.caseId,
        version: state.version,
        recommendation: {
          test_id: test.id,
          name: test.name,
          target: test.target,
          why: test.why,
          prompt_for_human: test.prompt,
          expected_information_gain_bits: Number(test.informationGainBits.toFixed(3)),
          time_minutes: test.timeMinutes,
          risk: test.risk,
          power_state: test.powerState,
        },
      };
    },

    focus_component: async ({ component_id, expected_version }) => {
      const next = focusComponent(store.getState(), {
        componentId: component_id,
        expectedVersion: expected_version,
        actor: 'agent',
      });
      store.replace(next, 'tool');
      return {
        ...conciseState(next),
        message: `${component_id} is focused in the shared fault map.`,
      };
    },

    select_test: async ({ test_id, expected_version }) => {
      const next = selectTest(store.getState(), {
        testId: test_id,
        expectedVersion: expected_version,
        actor: 'agent',
      });
      store.replace(next, 'tool');
      const test = getTest(test_id);
      return {
        ...conciseState(next),
        message: `${test.name} is selected. The human-facing probe card and board points are visible.`,
        human_instruction: test.prompt,
      };
    },

    record_measurement: async ({
      test_id,
      outcome,
      observed_by,
      power_disconnected,
      note = '',
      expected_version,
    }) => {
      const next = recordMeasurement(store.getState(), {
        testId: test_id,
        outcome,
        observedBy: observed_by,
        powerDisconnected: power_disconnected,
        note,
        expectedVersion: expected_version,
        actor: 'agent',
      });
      store.replace(next, 'tool');
      return {
        ...conciseState(next),
        message: 'The human-reported measurement was recorded and the hypothesis ranking was recomputed.',
      };
    },

    stage_repair_plan: async ({ repair_id, rationale = '', expected_version }) => {
      const next = stageRepairPlan(store.getState(), {
        repairId: repair_id,
        rationale,
        expectedVersion: expected_version,
        actor: 'agent',
      });
      store.replace(next, 'tool');
      const repair = getRepair(repair_id);
      return {
        ...conciseState(next),
        message: `${repair.name} is staged. A person must approve it in the visible interface; no approval tool exists.`,
      };
    },

    record_post_repair_check: async ({
      startup,
      charging_indicator,
      observed_by,
      note = '',
      expected_version,
    }) => {
      const next = recordPostRepairCheck(store.getState(), {
        startup,
        chargingIndicator: charging_indicator,
        observedBy: observed_by,
        note,
        expectedVersion: expected_version,
        actor: 'agent',
      });
      store.replace(next, 'tool');
      return {
        ...conciseState(next),
        message: next.phase === 'resolved'
          ? 'The human-observed post-repair checks passed. The case is now verified.'
          : 'The post-repair check failed. ProbeLoop reopened diagnosis.',
      };
    },

    get_case_report: async () => {
      const report = buildCaseReport(store.getState());
      return {
        ok: true,
        case_id: store.getState().caseId,
        version: store.getState().version,
        phase: store.getState().phase,
        report: {
          status: report.status,
          device: report.device,
          symptom: report.symptom,
          leading_hypothesis: report.leading_hypothesis,
          evidence: report.evidence,
          repair: report.repair,
          verification: report.verification,
          audit_event_count: report.audit.length,
          disclaimer: report.disclaimer,
        },
      };
    },
  };

  const definitions = [
    {
      name: 'get_case_state',
      description: 'Read the current shared repair case: version, phase, hypotheses, selected test, recorded human evidence, staged repair, and verification status. Use first and after any state change.',
      inputSchema: closedObject(),
      annotations: annotations.read,
    },
    {
      name: 'list_safe_tests',
      description: 'List remaining bounded tests for this synthetic low-voltage fixture, ranked by expected information gain. Returns instrument, target, time, risk, power state, and valid outcomes.',
      inputSchema: closedObject(),
      annotations: annotations.read,
    },
    {
      name: 'recommend_next_test',
      description: 'Recommend the single most informative remaining safe test and explain why it should be performed next by the person at the bench.',
      inputSchema: closedObject(),
      annotations: annotations.read,
    },
    {
      name: 'focus_component',
      description: 'Focus one known component on the visible shared fault map so the person and agent inspect the same location. This changes only the case view and increments its version.',
      inputSchema: closedObject({
        component_id: {
          type: 'string',
          enum: COMPONENTS.map((item) => item.id),
          description: 'Fixture component to focus.',
        },
        expected_version: versionField,
      }, ['component_id', 'expected_version']),
      annotations: annotations.write,
    },
    {
      name: 'select_test',
      description: 'Select one bounded diagnostic test and reveal its exact human probe instructions and points in the shared interface. This does not perform or invent a measurement.',
      inputSchema: closedObject({
        test_id: {
          type: 'string',
          enum: ['f1_continuity', 'input_resistance', 'battery_voltage'],
          description: 'Bounded fixture test to prepare.',
        },
        expected_version: versionField,
      }, ['test_id', 'expected_version']),
      annotations: annotations.write,
    },
    {
      name: 'record_measurement',
      description: 'Record a result that a person actually observed on the selected test, then recompute the diagnosis. Requires human attribution and power-disconnected confirmation; it cannot measure hardware itself.',
      inputSchema: closedObject({
        test_id: {
          type: 'string',
          enum: ['f1_continuity', 'input_resistance', 'battery_voltage'],
          description: 'The already selected test.',
        },
        outcome: {
          type: 'string',
          enum: ['continuity', 'open', 'low', 'normal', 'present', 'absent'],
          description: 'Exact observed fixture outcome.',
        },
        observed_by: {
          type: 'string',
          const: 'human',
          description: 'Must be human; tools cannot observe the meter.',
        },
        power_disconnected: {
          type: 'boolean',
          const: true,
          description: 'Human confirms USB power is disconnected.',
        },
        note: {
          type: 'string',
          maxLength: 240,
          description: 'Optional human observation; treated as untrusted text.',
        },
        expected_version: versionField,
      }, ['test_id', 'outcome', 'observed_by', 'power_disconnected', 'expected_version']),
      annotations: annotations.writeUntrusted,
    },
    {
      name: 'stage_repair_plan',
      description: 'Stage one predefined repair after its evidence threshold is met. The plan becomes visible for human review; this tool cannot approve the plan or claim physical work was completed.',
      inputSchema: closedObject({
        repair_id: {
          type: 'string',
          enum: REPAIRS.map((item) => item.id),
          description: 'Evidence-gated fixture repair to stage.',
        },
        rationale: {
          type: 'string',
          maxLength: 280,
          description: 'Optional rationale shown to the human reviewer.',
        },
        expected_version: versionField,
      }, ['repair_id', 'expected_version']),
      annotations: annotations.writeUntrusted,
    },
    {
      name: 'record_post_repair_check',
      description: 'Record startup and charging results observed by a person after an approved repair was physically completed. Passing observations resolve the case; failed observations reopen diagnosis.',
      inputSchema: closedObject({
        startup: {
          type: 'string',
          enum: ['normal', 'failed'],
          description: 'Human-observed startup result.',
        },
        charging_indicator: {
          type: 'string',
          enum: ['normal', 'failed'],
          description: 'Human-observed charging indicator.',
        },
        observed_by: {
          type: 'string',
          const: 'human',
          description: 'Must be human.',
        },
        note: {
          type: 'string',
          maxLength: 240,
          description: 'Optional human observation; treated as untrusted text.',
        },
        expected_version: versionField,
      }, ['startup', 'charging_indicator', 'observed_by', 'expected_version']),
      annotations: annotations.writeUntrusted,
    },
    {
      name: 'get_case_report',
      description: 'Read a concise evidence report containing the diagnosis, human-observed measurements, human approval and completion flags, verification, and audit count.',
      inputSchema: closedObject(),
      annotations: annotations.read,
    },
  ];

  async function invoke(name, args = {}) {
    const handler = handlers[name];
    if (!handler) {
      return { ok: false, error: 'UNKNOWN_TOOL', message: `No ProbeLoop tool named ${name}.` };
    }
    store.pulse(name, 'running', 'Agent tool is updating the shared bench.');
    try {
      const result = await handler(args);
      store.pulse(name, 'success', result.message ?? 'Tool completed.');
      return result;
    } catch (error) {
      const result = formatToolError(error);
      store.pulse(name, 'error', result.message);
      return result;
    }
  }

  const tools = definitions.map((definition) => ({
    ...definition,
    execute: async (args = {}) => jsonResult(await invoke(definition.name, args)),
  }));

  return { tools, definitions, invoke };
}

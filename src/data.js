export const FIXTURE_VERSION = '2026.09.02';

export const DEVICE = Object.freeze({
  id: 'aurora-mini-am2',
  name: 'Aurora Mini Speaker',
  board: 'AM-2 rev C',
  category: 'Portable Bluetooth speaker',
  symptom: 'No power after a USB-C cable tug',
  intakeNote: 'The charge light blinked once, then the speaker went completely dark.',
  powerBoundary: 'All diagnostic tests in this demo are performed with USB power disconnected.',
  safety: 'Synthetic low-voltage fixture. Never use this workflow on mains-powered equipment.',
});

export const COMPONENTS = Object.freeze([
  {
    id: 'J1',
    label: 'J1 · USB-C',
    type: 'connector',
    x: 12,
    y: 43,
    note: '5 V input connector. Mechanical tug originated here.',
  },
  {
    id: 'F1',
    label: 'F1 · 1.1 A resettable fuse',
    type: 'protection',
    x: 31,
    y: 43,
    note: 'Series protection between USB-C input and charger rail.',
  },
  {
    id: 'D3',
    label: 'D3 · TVS diode',
    type: 'protection',
    x: 49,
    y: 27,
    note: 'Clamps input transients to ground.',
  },
  {
    id: 'U2',
    label: 'U2 · charger IC',
    type: 'integrated-circuit',
    x: 57,
    y: 52,
    note: 'Battery-charge controller and input power-path manager.',
  },
  {
    id: 'B1',
    label: 'B1 · battery connector',
    type: 'connector',
    x: 78,
    y: 72,
    note: 'Connects the protected cell pack to the board.',
  },
  {
    id: 'U5',
    label: 'U5 · controller',
    type: 'integrated-circuit',
    x: 78,
    y: 31,
    note: 'Main controller. A lower-priority cause after the input path is tested.',
  },
]);

export const HYPOTHESES = Object.freeze([
  {
    id: 'f1_open',
    label: 'F1 open after connector stress',
    componentId: 'F1',
    prior: 0.36,
    rationale: 'Highest prior because F1 sits directly downstream of the stressed connector.',
  },
  {
    id: 'd3_short',
    label: 'D3 shorted to ground',
    componentId: 'D3',
    prior: 0.24,
    rationale: 'A failed clamp can collapse the entire input rail.',
  },
  {
    id: 'u2_fault',
    label: 'U2 charge-path failure',
    componentId: 'U2',
    prior: 0.18,
    rationale: 'The charge-path controller can produce a full no-power symptom.',
  },
  {
    id: 'battery_disconnected',
    label: 'Battery connector displaced',
    componentId: 'B1',
    prior: 0.14,
    rationale: 'A mechanical shock can disturb a marginal battery connection.',
  },
  {
    id: 'controller_fault',
    label: 'Controller rail or firmware fault',
    componentId: 'U5',
    prior: 0.08,
    rationale: 'Possible, but less likely than an input-path fault after a cable tug.',
  },
]);

export const TESTS = Object.freeze([
  {
    id: 'f1_continuity',
    name: 'Check continuity across F1',
    shortName: 'F1 continuity',
    target: 'F1',
    instrument: 'Multimeter · continuity or resistance mode',
    timeMinutes: 2,
    risk: 'low',
    powerState: 'USB disconnected',
    prompt: 'Place one probe on each copper pad of F1 and report CONTINUITY or OPEN.',
    outcomes: ['continuity', 'open'],
    outcomeLabels: { continuity: 'Continuity / near 0 Ω', open: 'Open / OL' },
    likelihoods: {
      f1_open: { continuity: 0.04, open: 0.96 },
      d3_short: { continuity: 0.92, open: 0.08 },
      u2_fault: { continuity: 0.94, open: 0.06 },
      battery_disconnected: { continuity: 0.96, open: 0.04 },
      controller_fault: { continuity: 0.95, open: 0.05 },
    },
    points: ['F1-left', 'F1-right'],
    why: 'Separates the leading fuse hypothesis from every downstream fault in one low-risk measurement.',
  },
  {
    id: 'input_resistance',
    name: 'Measure input resistance to ground',
    shortName: 'Input resistance',
    target: 'D3',
    instrument: 'Multimeter · resistance mode',
    timeMinutes: 3,
    risk: 'low',
    powerState: 'USB disconnected',
    prompt: 'Measure resistance from the protected 5 V rail to ground and report LOW or NORMAL.',
    outcomes: ['low', 'normal'],
    outcomeLabels: { low: 'Low resistance', normal: 'Normal / rising resistance' },
    likelihoods: {
      f1_open: { low: 0.08, normal: 0.92 },
      d3_short: { low: 0.9, normal: 0.1 },
      u2_fault: { low: 0.32, normal: 0.68 },
      battery_disconnected: { low: 0.06, normal: 0.94 },
      controller_fault: { low: 0.18, normal: 0.82 },
    },
    points: ['RAIL-5V', 'GND'],
    why: 'Efficiently distinguishes an input clamp short from open-circuit and downstream causes.',
  },
  {
    id: 'battery_voltage',
    name: 'Measure battery connector voltage',
    shortName: 'Battery voltage',
    target: 'B1',
    instrument: 'Multimeter · DC volts',
    timeMinutes: 3,
    risk: 'low',
    powerState: 'USB disconnected',
    prompt: 'Measure across the battery connector and report PRESENT or ABSENT.',
    outcomes: ['present', 'absent'],
    outcomeLabels: { present: 'Battery voltage present', absent: 'No battery voltage' },
    likelihoods: {
      f1_open: { present: 0.88, absent: 0.12 },
      d3_short: { present: 0.86, absent: 0.14 },
      u2_fault: { present: 0.76, absent: 0.24 },
      battery_disconnected: { present: 0.08, absent: 0.92 },
      controller_fault: { present: 0.9, absent: 0.1 },
    },
    points: ['B1-positive', 'B1-negative'],
    why: 'Confirms or eliminates the mechanical battery-connection branch.',
  },
]);

export const REPAIRS = Object.freeze([
  {
    id: 'replace_f1',
    name: 'Replace F1 with a like-for-like 1.1 A resettable fuse',
    hypothesisId: 'f1_open',
    componentId: 'F1',
    confidenceThreshold: 0.85,
    steps: [
      'Disconnect USB and battery power.',
      'Remove the open F1 component without lifting its pads.',
      'Install a matching 1.1 A resettable fuse in the same footprint.',
      'Inspect for bridges, then reconnect the battery before USB power.',
    ],
    postCheck: 'Confirm normal startup and charging indication.',
    boundedReason: 'This plan is available only when the F1-open hypothesis exceeds 85% confidence.',
  },
]);

export function getComponent(id) {
  return COMPONENTS.find((item) => item.id === id) ?? null;
}

export function getHypothesis(id) {
  return HYPOTHESES.find((item) => item.id === id) ?? null;
}

export function getTest(id) {
  return TESTS.find((item) => item.id === id) ?? null;
}

export function getRepair(id) {
  return REPAIRS.find((item) => item.id === id) ?? null;
}

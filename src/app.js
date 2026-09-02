import {
  COMPONENTS,
  DEVICE,
  REPAIRS,
  getComponent,
  getTest,
} from './data.js';
import {
  approveRepairPlan,
  attestRepairCompleted,
  buildCaseReport,
  entropy,
  focusComponent,
  phaseLabels,
  phaseSteps,
  rankAvailableTests,
  rankedHypotheses,
  recordMeasurement,
  recordPostRepairCheck,
  rejectRepairPlan,
  selectTest,
  stageRepairPlan,
} from './domain.js';
import { createStore } from './store.js';
import { createToolSystem } from './tools.js';
import { registerWebMCPTools } from './webmcp.js';

const params = new URLSearchParams(location.search);
if (params.get('reset') === '1') {
  localStorage.removeItem('probeloop-case-v1');
  params.delete('reset');
  const cleanQuery = params.toString();
  history.replaceState({}, '', `${location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}${location.hash}`);
}

const store = createStore();
const toolSystem = createToolSystem(store);
const webmcp = await registerWebMCPTools(toolSystem.tools);

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const elements = {
  status: $('#webmcp-status'),
  statusDot: $('#status-dot'),
  statusPill: $('#site-tool-pill'),
  journey: $('#journey-steps'),
  version: $('#version-chip'),
  board: $('#board'),
  boardCallout: $('#board-callout'),
  hypothesisList: $('#hypothesis-list'),
  entropy: $('#entropy-label'),
  actionKicker: $('#action-kicker'),
  actionHeading: $('#action-heading'),
  phaseBadge: $('#phase-badge'),
  actionContent: $('#action-content'),
  auditList: $('#audit-list'),
  toolPulse: $('#tool-pulse'),
  toolPulseName: $('#tool-pulse-name'),
  toolPulseDetail: $('#tool-pulse-detail'),
  toolsDialog: $('#tools-dialog'),
  toolManifest: $('#tool-manifest'),
  consoleDialog: $('#console-dialog'),
  consoleTool: $('#console-tool'),
  consoleArgs: $('#console-args'),
  consoleOutput: $('#console-output'),
  consoleTiming: $('#console-timing'),
  toast: $('#toast'),
};

let toastTimer = null;
let verificationDraft = { startup: null, chargingIndicator: null };

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showToast(message, duration = 2600) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = setTimeout(() => { elements.toast.hidden = true; }, duration);
}

function formatPercent(value, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function formatTime(iso) {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(iso));
  } catch {
    return '';
  }
}

function actorMark(actor) {
  if (actor === 'agent') return 'AI';
  if (actor === 'human') return 'H';
  return 'S';
}

function mutate(mutator, successMessage = '') {
  try {
    store.transact(mutator, 'human');
    if (successMessage) showToast(successMessage);
  } catch (error) {
    showToast(error?.message ?? String(error), 4200);
  }
}

function renderWebMCPStatus() {
  elements.statusDot.classList.remove('available', 'partial');
  if (!webmcp.available) {
    elements.status.textContent = '9 tools · rehearsal mode';
    elements.statusPill.title = 'This browser does not expose document.modelContext. Open the agent rehearsal to call the same handlers.';
    return;
  }
  if (webmcp.registered === toolSystem.tools.length) {
    elements.statusDot.classList.add('available');
    elements.status.textContent = `${webmcp.registered} site tools available`;
    elements.statusPill.title = 'WebMCP registered successfully on this top-level page.';
    return;
  }
  elements.statusDot.classList.add('partial');
  elements.status.textContent = `${webmcp.registered}/${toolSystem.tools.length} tools registered`;
  elements.statusPill.title = webmcp.errors.map((error) => `${error.name}: ${error.message}`).join('\n');
}

function renderJourney(state) {
  const current = phaseSteps[state.phase] ?? 1;
  $$('li', elements.journey).forEach((item) => {
    const step = Number(item.dataset.step);
    item.classList.toggle('complete', step < current);
    item.classList.toggle('current', step === current);
    item.setAttribute('aria-current', step === current ? 'step' : 'false');
  });
  elements.version.textContent = `CASE v${state.version}`;
}

function renderBoard(state) {
  $$('.component', elements.board).forEach((component) => {
    component.classList.toggle('is-focus', component.dataset.component === state.focusedComponentId);
  });
  $$('.probe-point', elements.board).forEach((point) => point.classList.remove('is-visible'));
  const selectedTest = getTest(state.selectedTestId);
  if (selectedTest) {
    for (const pointId of selectedTest.points) {
      const point = $(`[data-probe="${pointId}"]`, elements.board);
      if (point) point.classList.add('is-visible');
    }
  }
  const component = getComponent(state.focusedComponentId);
  elements.boardCallout.innerHTML = component
    ? `<strong>${escapeHtml(component.label)}</strong> — ${escapeHtml(component.note)}`
    : 'Select a component to focus the shared board.';
}

function renderHypotheses(state) {
  const hypotheses = rankedHypotheses(state);
  elements.entropy.textContent = `${entropy(state.probabilities).toFixed(2)} bits uncertainty`;
  elements.hypothesisList.innerHTML = hypotheses.map((hypothesis, index) => `
    <div class="hypothesis-row ${index === 0 ? 'leading' : ''}">
      <span class="hypothesis-name" title="${escapeHtml(hypothesis.label)}">${escapeHtml(hypothesis.label)}</span>
      <span class="probability-track" aria-hidden="true"><span class="probability-fill" style="width:${Math.max(1.5, hypothesis.probability * 100)}%"></span></span>
      <span class="probability-value">${formatPercent(hypothesis.probability)}</span>
    </div>
  `).join('');
}

function boundaryCard(copy) {
  return `
    <div class="boundary-card">
      <div class="boundary-title"><span class="boundary-icon" aria-hidden="true">⌁</span> Human authority is structural</div>
      <p>${escapeHtml(copy)}</p>
    </div>
  `;
}

function recommendationCard(state) {
  const recommended = rankAvailableTests(state)[0];
  if (!recommended) return '<p class="action-lead">All bounded fixture tests have recorded evidence.</p>';
  return `
    <p class="action-lead">One test removes more uncertainty than the alternatives while keeping the fixture unpowered.</p>
    <div class="recommendation-card">
      <div class="recommendation-top">
        <div><h3>${escapeHtml(recommended.name)}</h3><p class="recommendation-reason">${escapeHtml(recommended.why)}</p></div>
        <div class="info-score" aria-label="${recommended.informationGainRounded} bits expected information gain"><strong>${recommended.informationGainRounded}</strong><span>bits gained</span></div>
      </div>
      <div class="meta-row">
        <span class="meta-chip safe">${escapeHtml(recommended.risk)} risk</span>
        <span class="meta-chip">${recommended.timeMinutes} min</span>
        <span class="meta-chip">${escapeHtml(recommended.instrument)}</span>
      </div>
      <button class="primary-button prepare-test" type="button" data-test-id="${recommended.id}">Show me where to probe</button>
    </div>
    ${boundaryCard('The agent can choose and prepare a test. It cannot see a physical meter, invent a reading, or silently advance the case.')}
  `;
}

function measurementCard(state) {
  const test = getTest(state.selectedTestId);
  if (!test) return recommendationCard(state);
  return `
    <p class="action-lead">The board now highlights the exact probe points. A person supplies the observation.</p>
    <div class="measurement-card">
      <h3>${escapeHtml(test.shortName)}</h3>
      <div class="meta-row"><span class="meta-chip safe">${escapeHtml(test.powerState)}</span><span class="meta-chip">${escapeHtml(test.instrument)}</span></div>
      <p class="probe-instruction">${escapeHtml(test.prompt)}</p>
      <label class="safety-check"><input id="power-disconnected" type="checkbox"><span><strong>Bench safety gate:</strong> I confirm USB power is disconnected.</span></label>
      <textarea class="human-note" id="measurement-note" maxlength="240" placeholder="Optional observation, e.g. meter remained OL in both probe directions"></textarea>
      <div class="outcome-grid">
        ${test.outcomes.map((outcome) => `<button class="choice-button record-outcome" type="button" disabled data-outcome="${outcome}" data-test-id="${test.id}">I measured<br>${escapeHtml(test.outcomeLabels[outcome])}</button>`).join('')}
      </div>
    </div>
    ${boundaryCard('Only a human-attributed result with the power boundary confirmed can enter the fault model.')}
  `;
}

function interpretationCard(state) {
  const leader = rankedHypotheses(state)[0];
  const repair = REPAIRS.find((item) => item.hypothesisId === leader.id);
  const eligible = Boolean(repair && leader.probability >= repair.confidenceThreshold);
  const latest = state.measurements.at(-1);
  const prior = latest?.testId === 'f1_continuity' ? 0.36 : null;
  return `
    <p class="action-lead">The human observation changed the ranking. ProbeLoop shows the arithmetic before suggesting a repair.</p>
    <div class="confidence-hero">
      <div class="confidence-ring" style="--progress:${leader.probability * 360}deg"><strong>${formatPercent(leader.probability)}</strong></div>
      <div class="confidence-copy"><h3>${escapeHtml(leader.label)}</h3><p>${eligible ? 'Evidence threshold crossed.' : 'More evidence is required before a repair can be staged.'}</p></div>
    </div>
    <div class="evidence-receipt">
      ${latest ? `<div class="receipt-row"><span>Observed test</span><strong>${escapeHtml(latest.outcomeLabel)}</strong></div>` : ''}
      ${prior !== null ? `<div class="receipt-row"><span>Prior → posterior</span><strong>${formatPercent(prior, 0)} → ${formatPercent(leader.probability)}</strong></div>` : ''}
      <div class="receipt-row"><span>Current leader</span><strong>${escapeHtml(leader.componentId)}</strong></div>
    </div>
    <div class="threshold-note">Repair staging threshold: ${repair ? formatPercent(repair.confidenceThreshold, 0) : 'not met for this hypothesis'}.</div>
    <div class="button-row">
      ${eligible ? `<button class="primary-button stage-repair" type="button" data-repair-id="${repair.id}">Stage evidence-supported repair</button>` : '<button class="primary-button prepare-next-test" type="button">Prepare next test</button>'}
    </div>
    ${boundaryCard('Staging is a proposal, not authorization. ProbeLoop exposes no agent tool for approving or performing the repair.')}
  `;
}

function repairReviewCard(state) {
  const plan = state.repairPlan;
  return `
    <p class="action-lead">The agent’s proposal is frozen at case version ${plan.stagedVersion}. Review the exact intervention before any physical work.</p>
    <div class="repair-card">
      <div class="meta-row"><span class="meta-chip safe">${formatPercent(plan.confidence)} confidence</span><span class="meta-chip">${escapeHtml(plan.componentId)}</span></div>
      <h3>${escapeHtml(plan.name)}</h3>
      <ol class="repair-steps">${plan.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
      <div class="approval-gate"><strong>Human-only decision</strong><p>Approval is intentionally absent from the WebMCP manifest. The physical repair remains blocked until a person acts here.</p></div>
      <div class="button-row">
        <button class="secondary-button reject-repair" type="button">Reject</button>
        <button class="primary-button approve-repair" type="button">Approve this exact plan</button>
      </div>
    </div>
    ${boundaryCard('A stale or altered plan cannot be approved: every state mutation carries the visible case version.')}
  `;
}

function repairAttestationCard(state) {
  return `
    <p class="action-lead">Approval unlocked the physical-work checkpoint. ProbeLoop still cannot claim the component was replaced.</p>
    <div class="repair-card">
      <h3>${escapeHtml(state.repairPlan.name)}</h3>
      <div class="attestation-check">
        <label><input id="attest-human" type="checkbox"><span>I personally performed the approved physical repair.</span></label>
        <label><input id="attest-power" type="checkbox"><span>USB and battery power were disconnected during the repair.</span></label>
      </div>
      <button class="primary-button attest-repair" type="button" disabled>Record human completion</button>
    </div>
    ${boundaryCard('The agent can wait, explain, and verify later. Only the person at the bench can unlock the next phase.')}
  `;
}

function verifyCard() {
  const startup = verificationDraft.startup;
  const charging = verificationDraft.chargingIndicator;
  return `
    <p class="action-lead">The repair is complete only after the person observes the device under normal operation.</p>
    <div class="verify-card">
      <h3>Post-repair functional check</h3>
      <div class="verify-option"><span>Device startup</span><div class="segmented" data-verify-group="startup"><button type="button" data-value="normal" class="${startup === 'normal' ? 'active' : ''}">Normal</button><button type="button" data-value="failed" class="${startup === 'failed' ? 'active' : ''}">Failed</button></div></div>
      <div class="verify-option"><span>Charging indicator</span><div class="segmented" data-verify-group="chargingIndicator"><button type="button" data-value="normal" class="${charging === 'normal' ? 'active' : ''}">Normal</button><button type="button" data-value="failed" class="${charging === 'failed' ? 'active' : ''}">Failed</button></div></div>
      <textarea class="human-note" id="verification-note" maxlength="240" placeholder="Optional verification note"></textarea>
      <button class="primary-button record-verification" type="button" ${startup && charging ? '' : 'disabled'}>Record what I observed</button>
    </div>
    ${boundaryCard('A failed observation reopens diagnosis. A passing human observation creates the final verified state.')}
  `;
}

function resolvedCard(state) {
  const leader = rankedHypotheses(state)[0];
  return `
    <div class="resolved-card">
      <div class="resolved-mark" aria-hidden="true">✓</div>
      <h3>Evidence loop closed.</h3>
      <p>Human-observed startup and charging checks passed after the approved F1 repair. The complete chain is visible and exportable.</p>
      <div class="metric-grid">
        <div class="metric"><strong>${formatPercent(leader.probability)}</strong><span class="metric-label">diagnostic confidence</span></div>
        <div class="metric"><strong>${state.measurements.length}</strong><span class="metric-label">physical reading</span></div>
        <div class="metric"><strong>${state.audit.length}</strong><span class="metric-label">audit events</span></div>
      </div>
      <button class="primary-button export-resolved" type="button">Export evidence report</button>
    </div>
    ${boundaryCard('The report distinguishes agent inference from human observation, approval, physical completion, and verification.')}
  `;
}

function renderAction(state) {
  elements.phaseBadge.textContent = phaseLabels[state.phase] ?? state.phase;
  const modes = {
    diagnose: ['Best next move', 'Remove the most uncertainty', recommendationCard],
    test_selected: ['Human observation required', 'Probe the highlighted points', measurementCard],
    evidence_recorded: ['Bayesian update complete', 'Evidence changed the answer', interpretationCard],
    repair_review: ['Consequential action gate', 'Review the staged repair', repairReviewCard],
    repair_attestation: ['Physical work checkpoint', 'The agent cannot cross this line', repairAttestationCard],
    verify: ['Human observation required', 'Verify the device, not the story', verifyCard],
    resolved: ['Case resolved', 'A repair with receipts', resolvedCard],
  };
  const [kicker, heading, renderer] = modes[state.phase] ?? modes.diagnose;
  elements.actionKicker.textContent = kicker;
  elements.actionHeading.textContent = heading;
  elements.actionContent.innerHTML = renderer(state);
}

function renderAudit(state) {
  const events = [...state.audit].reverse().slice(0, 8);
  elements.auditList.innerHTML = events.map((entry) => `
    <li class="audit-item ${escapeHtml(entry.actor)}">
      <span class="audit-icon" aria-hidden="true">${actorMark(entry.actor)}</span>
      <div class="audit-copy">
        <p>${escapeHtml(entry.summary)}</p>
        <div class="audit-meta"><span>${escapeHtml(entry.actor)}</span><span>v${entry.version}</span><span>${formatTime(entry.at)}</span></div>
      </div>
    </li>
  `).join('');
}

function renderToolPulse() {
  const activity = store.getToolActivity();
  if (!activity) {
    elements.toolPulse.hidden = true;
    return;
  }
  elements.toolPulse.hidden = false;
  elements.toolPulse.classList.remove('running', 'success', 'error');
  elements.toolPulse.classList.add(activity.kind);
  elements.toolPulseName.textContent = activity.name;
  elements.toolPulseDetail.textContent = activity.detail;
}

function renderManifest() {
  elements.toolManifest.innerHTML = toolSystem.definitions.map((tool) => {
    const read = tool.annotations.readOnlyHint;
    return `
      <div class="tool-row">
        <span class="tool-kind ${read ? 'read' : 'write'}">${read ? 'read' : 'state'}</span>
        <div><strong>${escapeHtml(tool.name)}</strong><p>${escapeHtml(tool.description)}</p></div>
      </div>
    `;
  }).join('');
}

function defaultArgsFor(toolName) {
  const state = store.getState();
  const recommended = rankAvailableTests(state)[0];
  const selected = getTest(state.selectedTestId);
  const defaults = {
    get_case_state: {},
    list_safe_tests: {},
    recommend_next_test: {},
    focus_component: { component_id: state.focusedComponentId ?? 'F1', expected_version: state.version },
    select_test: { test_id: recommended?.id ?? 'f1_continuity', expected_version: state.version },
    record_measurement: {
      test_id: selected?.id ?? 'f1_continuity',
      outcome: selected?.id === 'input_resistance' ? 'normal' : selected?.id === 'battery_voltage' ? 'present' : 'open',
      observed_by: 'human',
      power_disconnected: true,
      note: 'Human read the meter at the highlighted points.',
      expected_version: state.version,
    },
    stage_repair_plan: {
      repair_id: 'replace_f1',
      rationale: 'The F1 continuity result raised the open-fuse hypothesis above the evidence threshold.',
      expected_version: state.version,
    },
    record_post_repair_check: {
      startup: 'normal',
      charging_indicator: 'normal',
      observed_by: 'human',
      note: 'Human observed normal startup and charging indication.',
      expected_version: state.version,
    },
    get_case_report: {},
  };
  return defaults[toolName] ?? {};
}

function syncConsoleArgs() {
  elements.consoleArgs.value = JSON.stringify(defaultArgsFor(elements.consoleTool.value), null, 2);
}

function renderConsoleOptions() {
  elements.consoleTool.innerHTML = toolSystem.definitions.map((tool) => `<option value="${tool.name}">${tool.name}</option>`).join('');
  syncConsoleArgs();
}

function render() {
  const state = store.getState();
  renderWebMCPStatus();
  renderJourney(state);
  renderBoard(state);
  renderHypotheses(state);
  renderAction(state);
  renderAudit(state);
  renderToolPulse();
  if (elements.consoleDialog.open) syncConsoleArgs();
}

function downloadReport() {
  const state = store.getState();
  const report = buildCaseReport(state);
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `probeloop-${state.caseId.toLowerCase()}-v${state.version}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  showToast('Evidence report exported locally.');
}

function activateComponent(componentId) {
  mutate(
    (state) => focusComponent(state, { componentId, expectedVersion: state.version, actor: 'human' }),
    `${componentId} focused.`,
  );
}

for (const component of $$('.component', elements.board)) {
  component.addEventListener('click', () => activateComponent(component.dataset.component));
  component.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateComponent(component.dataset.component);
    }
  });
}

elements.actionContent.addEventListener('change', (event) => {
  if (event.target.id === 'power-disconnected') {
    $$('.record-outcome', elements.actionContent).forEach((button) => { button.disabled = !event.target.checked; });
  }
  if (event.target.id === 'attest-human' || event.target.id === 'attest-power') {
    const button = $('.attest-repair', elements.actionContent);
    const human = $('#attest-human', elements.actionContent)?.checked;
    const power = $('#attest-power', elements.actionContent)?.checked;
    if (button) button.disabled = !(human && power);
  }
});

elements.actionContent.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const state = store.getState();

  if (button.matches('.prepare-test')) {
    mutate((current) => selectTest(current, { testId: button.dataset.testId, expectedVersion: current.version, actor: 'human' }));
  } else if (button.matches('.record-outcome')) {
    const power = $('#power-disconnected', elements.actionContent)?.checked === true;
    const note = $('#measurement-note', elements.actionContent)?.value ?? '';
    mutate((current) => recordMeasurement(current, {
      testId: button.dataset.testId,
      outcome: button.dataset.outcome,
      observedBy: 'human',
      powerDisconnected: power,
      note,
      expectedVersion: current.version,
      actor: 'human',
    }), 'Measurement recorded; diagnosis recomputed.');
  } else if (button.matches('.stage-repair')) {
    mutate((current) => stageRepairPlan(current, {
      repairId: button.dataset.repairId,
      rationale: 'Evidence threshold met in the shared fault model.',
      expectedVersion: current.version,
      actor: 'human',
    }));
  } else if (button.matches('.prepare-next-test')) {
    const nextTest = rankAvailableTests(state)[0];
    if (nextTest) mutate((current) => selectTest(current, { testId: nextTest.id, expectedVersion: current.version, actor: 'human' }));
  } else if (button.matches('.approve-repair')) {
    mutate((current) => approveRepairPlan(current, { expectedVersion: current.version, actor: 'human' }), 'Repair plan approved by human.');
  } else if (button.matches('.reject-repair')) {
    mutate((current) => rejectRepairPlan(current, { expectedVersion: current.version, actor: 'human', reason: 'Human requested more evidence.' }), 'Repair rejected; diagnosis reopened.');
  } else if (button.matches('.attest-repair')) {
    mutate((current) => attestRepairCompleted(current, {
      performedByHuman: true,
      powerDisconnected: true,
      expectedVersion: current.version,
      actor: 'human',
    }), 'Physical completion recorded by human.');
  } else if (button.closest('.segmented')) {
    const group = button.closest('.segmented').dataset.verifyGroup;
    verificationDraft[group] = button.dataset.value;
    renderAction(state);
  } else if (button.matches('.record-verification')) {
    const note = $('#verification-note', elements.actionContent)?.value ?? '';
    mutate((current) => recordPostRepairCheck(current, {
      startup: verificationDraft.startup,
      chargingIndicator: verificationDraft.chargingIndicator,
      observedBy: 'human',
      note,
      expectedVersion: current.version,
      actor: 'human',
    }), 'Post-repair observation recorded.');
  } else if (button.matches('.export-resolved')) {
    downloadReport();
  }
});

$('#reset-case').addEventListener('click', () => {
  if (confirm('Reset the synthetic repair case and clear its local proof trail?')) {
    verificationDraft = { startup: null, chargingIndicator: null };
    store.reset();
    showToast('Synthetic case reset.');
  }
});

$('#download-report').addEventListener('click', downloadReport);

elements.statusPill.addEventListener('click', () => elements.toolsDialog.showModal());
$('#open-console').addEventListener('click', () => elements.consoleDialog.showModal());
$('.close-console').addEventListener('click', () => elements.consoleDialog.close());

elements.consoleTool.addEventListener('change', syncConsoleArgs);
$('#run-console-tool').addEventListener('click', async () => {
  const name = elements.consoleTool.value;
  let args;
  try {
    args = JSON.parse(elements.consoleArgs.value || '{}');
  } catch (error) {
    elements.consoleOutput.textContent = JSON.stringify({ ok: false, error: 'INVALID_JSON', message: error.message }, null, 2);
    return;
  }
  const started = performance.now();
  const result = await toolSystem.invoke(name, args);
  const elapsed = Math.round(performance.now() - started);
  elements.consoleTiming.textContent = `${elapsed} ms`;
  elements.consoleOutput.textContent = JSON.stringify(result, null, 2);
  syncConsoleArgs();
});

$('#copy-prompt').addEventListener('click', async () => {
  const prompt = $('#golden-prompt').textContent.trim();
  try {
    await navigator.clipboard.writeText(prompt);
    showToast('Judge prompt copied.');
  } catch {
    showToast('Select the visible prompt to copy it.');
  }
});

for (const dialog of $$('.modal')) {
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    const inDialog = event.clientX >= rect.left && event.clientX <= rect.right
      && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inDialog) dialog.close();
  });
}

store.subscribe(render);
renderManifest();
renderConsoleOptions();
render();

if (params.get('judge') === '1') {
  setTimeout(() => showToast('Judge lane ready: 9 bounded tools, one human-only approval gate.', 4200), 450);
}

window.addEventListener('beforeunload', () => webmcp.dispose());
window.__PROBELOOP__ = {
  store,
  tools: toolSystem.tools,
  definitions: toolSystem.definitions,
  invoke: toolSystem.invoke,
  webmcp,
  downloadReport,
};

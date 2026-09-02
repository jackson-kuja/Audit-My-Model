import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const LIVE_URL = process.env.PROBELOOP_LIVE_URL;
if (!LIVE_URL) throw new Error('Set PROBELOOP_LIVE_URL to the immutable public app URL.');

const EXPECTED_TOOLS = [
  'get_case_state',
  'list_safe_tests',
  'recommend_next_test',
  'focus_component',
  'select_test',
  'record_measurement',
  'stage_repair_plan',
  'record_post_repair_check',
  'get_case_report',
];

await fs.mkdir('artifacts', { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  acceptDownloads: true,
});

await context.addInitScript(() => {
  window.__registeredWebMCPTools = [];
  Object.defineProperty(document, 'modelContext', {
    configurable: true,
    value: {
      async registerTool(tool, options = {}) {
        window.__registeredWebMCPTools.push({ tool, signal: options.signal });
      },
    },
  });
});

const page = await context.newPage();
const browserErrors = [];
page.on('pageerror', (error) => browserErrors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') browserErrors.push(`console.error: ${message.text()}`);
});

try {
  const response = await page.goto(`${LIVE_URL}?reset=1`, {
    waitUntil: 'networkidle',
    timeout: 90_000,
  });
  assert(response, 'The live app did not return a navigation response.');
  assert.equal(response.status(), 200, 'The live app must return HTTP 200.');

  await page.waitForFunction(
    () => window.__PROBELOOP__ && window.__registeredWebMCPTools?.length === 9,
    undefined,
    { timeout: 30_000 },
  );

  assert.equal(await page.title(), 'ProbeLoop — Human-agent repair bench');
  assert.equal(await page.locator('#phase-badge').innerText(), 'DIAGNOSE');
  assert.equal(await page.locator('#webmcp-status').innerText(), '9 site tools available');
  assert.equal(await page.locator('iframe').count(), 0, 'Tool discovery must not depend on an iframe.');

  const names = await page.evaluate(() => window.__registeredWebMCPTools.map(({ tool }) => tool.name));
  assert.deepEqual(names, EXPECTED_TOOLS);
  assert(!names.some((name) => /approve|perform|complete_repair/i.test(name)), 'No agent approval or physical-work tool may exist.');

  const callTool = async (name, args = {}) => page.evaluate(
    async ({ toolName, toolArgs }) => {
      const registration = window.__registeredWebMCPTools.find(({ tool }) => tool.name === toolName);
      if (!registration) throw new Error(`Missing registered tool: ${toolName}`);
      return JSON.parse(await registration.tool.execute(toolArgs));
    },
    { toolName: name, toolArgs: args },
  );

  const selected = await callTool('select_test', {
    test_id: 'f1_continuity',
    expected_version: 1,
  });
  assert.equal(selected.version, 2);
  assert.equal(await page.locator('#phase-badge').innerText(), 'PROBE');
  assert.equal(await page.locator('.probe-point.is-visible').count(), 2);

  const measured = await callTool('record_measurement', {
    test_id: 'f1_continuity',
    outcome: 'open',
    observed_by: 'human',
    power_disconnected: true,
    note: 'Human read OL at the highlighted pads.',
    expected_version: 2,
  });
  assert.equal(measured.version, 3);
  assert(measured.leading_hypothesis.confidence >= 0.89, 'The evidence must cross the repair threshold.');

  const staged = await callTool('stage_repair_plan', {
    repair_id: 'replace_f1',
    rationale: 'The human-observed open result crossed the evidence threshold.',
    expected_version: 3,
  });
  assert.equal(staged.version, 4);
  assert.equal(staged.repair_plan.status, 'staged');
  assert.equal(await page.locator('.approval-gate').count(), 1);

  await page.locator('.approve-repair').click();
  assert.equal(await page.evaluate(() => window.__PROBELOOP__.store.getState().version), 5);
  await page.locator('#attest-human').check();
  await page.locator('#attest-power').check();
  await page.locator('.attest-repair').click();
  assert.equal(await page.evaluate(() => window.__PROBELOOP__.store.getState().version), 6);

  const verified = await callTool('record_post_repair_check', {
    startup: 'normal',
    charging_indicator: 'normal',
    observed_by: 'human',
    note: 'Human observed a normal boot and charge light.',
    expected_version: 6,
  });
  assert.equal(verified.version, 7);
  assert.equal(verified.phase, 'resolved');
  assert.equal(await page.locator('#phase-badge').innerText(), 'RESOLVED');

  const report = await callTool('get_case_report');
  assert.equal(report.report.repair.approved_by_human, true);
  assert.equal(report.report.repair.completed_by_human, true);
  assert.equal(report.report.verification.startup, 'normal');
  assert.equal(report.report.verification.charging_indicator, 'normal');

  await page.evaluate(() => {
    window.scrollTo(0, 0);
    const toast = document.querySelector('#toast');
    if (toast) toast.hidden = true;
    const skip = document.querySelector('.skip-link');
    if (skip) skip.style.visibility = 'hidden';
  });
  await page.screenshot({ path: 'artifacts/probeloop-live.png', fullPage: true });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__PROBELOOP__ && window.__registeredWebMCPTools?.length === 9);
  assert.equal(await page.evaluate(() => window.__PROBELOOP__.store.getState().version), 7);
  assert.equal(await page.evaluate(() => window.__PROBELOOP__.store.getState().phase), 'resolved');

  assert.deepEqual(browserErrors, [], `Browser errors:\n${browserErrors.join('\n')}`);
  console.log(`Remote browser verification passed for ${LIVE_URL}`);
  console.log('Verified: HTTP 200, direct 9-tool registration, golden repair loop, human-only gates, persistence, and clean browser console.');
} finally {
  await context.close();
  await browser.close();
}

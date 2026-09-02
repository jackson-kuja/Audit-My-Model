import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const LIVE_URL = process.env.PROBELOOP_LIVE_URL;
if (!LIVE_URL) throw new Error('Set PROBELOOP_LIVE_URL.');

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function verifyJourney(browser, attempt) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
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
    const separator = LIVE_URL.includes('?') ? '&' : '?';
    const response = await page.goto(`${LIVE_URL}${separator}reset=1&attempt=${attempt}`, {
      waitUntil: 'load',
      timeout: 90_000,
    });
    assert(response, 'No navigation response.');
    assert.equal(response.status(), 200, `Expected HTTP 200, received ${response.status()}.`);

    await page.waitForFunction(
      () => window.__PROBELOOP__ && window.__registeredWebMCPTools?.length === 9,
      undefined,
      { timeout: 30_000 },
    );

    assert.equal(await page.title(), 'ProbeLoop — Human-agent repair bench');
    assert.equal(await page.locator('#phase-badge').innerText(), 'DIAGNOSE');
    assert.equal(await page.locator('#webmcp-status').innerText(), '9 site tools available');
    assert.equal(await page.locator('iframe').count(), 0);

    const names = await page.evaluate(() => window.__registeredWebMCPTools.map(({ tool }) => tool.name));
    assert.deepEqual(names, EXPECTED_TOOLS);
    assert(!names.some((name) => /approve|perform|complete_repair/i.test(name)));

    const callTool = (name, args = {}) => page.evaluate(
      async ({ name, args }) => {
        const registration = window.__registeredWebMCPTools.find(({ tool }) => tool.name === name);
        if (!registration) throw new Error(`Missing registered tool: ${name}`);
        return JSON.parse(await registration.tool.execute(args));
      },
      { name, args },
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
    assert(measured.leading_hypothesis.confidence >= 0.89);

    const staged = await callTool('stage_repair_plan', {
      repair_id: 'replace_f1',
      rationale: 'Human-observed open result crossed the evidence threshold.',
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

    await page.reload({ waitUntil: 'load', timeout: 90_000 });
    await page.waitForFunction(
      () => window.__PROBELOOP__ && window.__registeredWebMCPTools?.length === 9,
      undefined,
      { timeout: 30_000 },
    );
    assert.equal(await page.evaluate(() => window.__PROBELOOP__.store.getState().version), 7);
    assert.equal(await page.evaluate(() => window.__PROBELOOP__.store.getState().phase), 'resolved');
    assert.deepEqual(browserErrors, [], `Browser errors:\n${browserErrors.join('\n')}`);
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
let lastError;
try {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      console.log(`Hosted-browser verification ${attempt}/3: ${LIVE_URL}`);
      await verifyJourney(browser, attempt);
      console.log(`Remote browser verification passed for ${LIVE_URL}`);
      console.log('Verified: HTTP 200, 9 direct site tools, v1→v7 repair loop, human-only gates, persistence, and clean console.');
      lastError = undefined;
      break;
    } catch (error) {
      lastError = error;
      console.error(error.stack ?? error.message);
      if (attempt < 3) await sleep(attempt * 4_000);
    }
  }
  if (lastError) throw lastError;
} finally {
  await browser.close();
}

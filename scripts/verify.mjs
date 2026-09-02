import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createStore } from '../src/store.js';
import { createToolSystem } from '../src/tools.js';

const root = resolve(new URL('..', import.meta.url).pathname);
const failures = [];
const pass = (condition, message) => { if (!condition) failures.push(message); };

async function text(path) {
  return readFile(resolve(root, path), 'utf8');
}

const [html, webmcp, packageJson, license, evals] = await Promise.all([
  text('index.html'),
  text('src/webmcp.js'),
  text('package.json'),
  text('LICENSE'),
  text('evals/tool-contract-cases.json'),
]);

pass(html.includes('type="module"'), 'index.html must load a top-level module.');
pass(!/<iframe\b/i.test(html), 'WebMCP tools must not be isolated in an iframe.');
pass(webmcp.includes('documentRef?.modelContext'), 'WebMCP integration must use document.modelContext.');
pass(webmcp.includes('registerTool'), 'WebMCP integration must call registerTool.');
pass(webmcp.includes('AbortController'), 'Tool registrations must have lifecycle cleanup.');
pass(license.startsWith('MIT License'), 'A detectable top-level MIT license is required.');

const pkg = JSON.parse(packageJson);
pass(!pkg.dependencies, 'Runtime dependencies should remain zero for the judge path.');
pass(pkg.license === 'MIT', 'package.json license must be MIT.');

const { tools } = createToolSystem(createStore({ persist: false }));
pass(tools.length === 9, 'Exactly nine intentional tools are expected.');
pass(!tools.some((tool) => /approve|execute_repair|perform_repair/.test(tool.name)), 'Human repair authority must not be exposed as an agent tool.');
pass(tools.every((tool) => tool.inputSchema.additionalProperties === false), 'Every input schema must be closed.');
pass(tools.filter((tool) => tool.annotations.readOnlyHint).length === 4, 'Four tools should be marked read-only.');
pass(tools.filter((tool) => tool.annotations.untrustedContentHint).length === 3, 'Three tools accepting human text should mark it untrusted.');

const contractCases = JSON.parse(evals);
pass(contractCases.length >= 20, 'At least twenty tool-strategy contract cases are required.');
pass(contractCases.filter((item) => item.expected_tool === null).length >= 5, 'Evaluation must include explicit no-tool safety cases.');

for (const required of ['README.md', 'DEVPOST.md', 'DEMO_SCRIPT.md', 'JUDGES.md', 'SECURITY.md', 'THIRD_PARTY_NOTICES.md']) {
  try {
    pass((await stat(resolve(root, required))).size > 100, `${required} must be substantive.`);
  } catch {
    failures.push(`${required} is missing.`);
  }
}

if (failures.length) {
  console.error(`Release verification failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Release verification passed: static judge path, WebMCP lifecycle, bounded schemas, authority boundary, license, and eval contract.');

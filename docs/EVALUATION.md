# Evaluation and release evidence

## Automated coverage

### Node test suite — 18 tests

`npm test` covers:

- normalized priors and deterministic information-gain ordering;
- complete v1 → v7 golden flow;
- Bayesian posterior threshold;
- human attribution and power-disconnected requirements;
- idempotent exact measurement replay;
- evidence-gated repair staging;
- human-only approval and completion;
- stale-version failure;
- zero-completion rejection behavior;
- failed verification reopening diagnosis;
- nine unique bounded tools and no approval tool;
- annotation correctness;
- full WebMCP-handler flow;
- self-correcting tool errors;
- result character budgets;
- unavailable WebMCP fallback;
- `AbortSignal` registration/disposal;
- partial-registration resilience.

### Static release gate

`npm run verify` additionally checks:

- top-level module and no iframe;
- direct `document.modelContext` and `registerTool` integration;
- lifecycle cleanup;
- detectable MIT license;
- zero runtime dependencies;
- closed schemas;
- expected read/untrusted annotations;
- required submission documents;
- at least 20 prompt-to-tool/no-tool contracts.

### Real Chromium gate

`python3 scripts/browser_verify.py`:

1. starts an isolated static server;
2. mounts a mock `document.modelContext` before application code;
3. captures all nine real tool registrations and their signals;
4. calls the registered `select_test`, `record_measurement`, `stage_repair_plan`, and `record_post_repair_check` functions;
5. crosses approval and physical-work attestation only through visible UI controls;
6. verifies the absence of approval/perform tools;
7. checks v7 resolution, refresh persistence, and exported provenance;
8. checks duplicate IDs and unnamed buttons;
9. verifies no page/console errors;
10. checks the 390 px mobile layout for horizontal overflow;
11. captures release screenshots.

## Tool-strategy contract set

`evals/tool-contract-cases.json` contains 24 prompts:

- two cases for each read or action intent;
- specific prompts for physical observations and repair staging;
- explicit no-tool cases for approval, claimed physical work, arbitrary JavaScript, autonomous measurement, unknown URL fetching, and audit deletion.

These are deterministic design contracts rather than a claim of model accuracy. They make the intended tool boundaries inspectable and ready for isolated model trials.

## Manual screen-reader and keyboard checklist

- Skip link appears on keyboard focus.
- All board components are reachable with Tab and activate on Enter or Space.
- Buttons have visible focus and accessible names.
- Phase changes and action content use live regions without taking focus.
- Progress uses text and `aria-current`, not color alone.
- Dialogs use native `<dialog>` semantics.
- Reduced-motion preference disables nonessential transitions.
- The intentionally synthetic PCB graphic has a title and description.

## Release commands

```bash
npm run verify
python3 scripts/browser_verify.py
```

A release is blocked unless both commands return zero.

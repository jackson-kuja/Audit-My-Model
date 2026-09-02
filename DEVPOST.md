# ProbeLoop — Devpost submission copy

## Project name

**ProbeLoop**

## Tagline

**Agents reason. People probe. Devices get another life.**

## Elevator pitch

ProbeLoop is a WebMCP repair bench where an AI agent and a person diagnose a physical device together. The agent ranks safe tests, focuses a shared PCB, updates a Bayesian fault model from evidence, and stages a bounded repair. The person remains the authority over reality: only a person can observe the meter, approve the repair, attest that physical work occurred, and verify the result.

## Inspiration

The most interesting human-agent workflows are not the ones where an agent replaces another set of clicks. They are the ones where each side has a capability the other genuinely lacks.

Physical repair has exactly that shape. An agent can synthesize troubleshooting knowledge and reason across competing causes. A person can touch the device, place probes, notice what actually happened, and accept responsibility for a consequential intervention. Today those capabilities live in separate places: a chat transcript, a browser tab, a meter reading, and someone's memory.

ProbeLoop turns them into one visible evidence loop.

This matters at scale. The UN's Global E-waste Monitor reports that the world generated 62 billion kg of e-waste in 2022, while 22.3% was documented as formally collected and recycled. Better repair workflows will not solve that problem alone, but making diagnosis clearer, safer, and more auditable is a useful piece of the repairability stack.

## What it does

The challenge fixture is a fictional Aurora Mini Speaker that went dark after a USB-C cable tug. ProbeLoop starts with five possible causes and a simplified shared board.

The agent can use nine WebMCP site tools to:

- read the current case and evidence;
- compare safe tests by expected information gain;
- recommend the single best next measurement;
- focus a component on the visible board;
- select a bounded test and reveal exact probe points;
- record only a result explicitly attributed to a human;
- stage an evidence-gated repair for review;
- record human-observed post-repair checks;
- return an attributable evidence report.

The person sees every change in the same page. When the agent selects continuity across F1, ProbeLoop highlights the two fuse pads and displays the meter setup. When the person reports OPEN / OL with USB disconnected, the open-fuse hypothesis rises from 36.0% to 89.7%. The agent can then stage a like-for-like F1 repair—but it cannot approve it.

Approval lives only in the human interface. After approval, a second human-only checkpoint records that a person actually performed the physical work with power disconnected. Only then can the agent record the person's normal startup and charging observations and resolve the case.

The final JSON report keeps agent inference, human observation, human approval, physical completion, and verification distinct.

## Why WebMCP

ProbeLoop is designed around the difference between an agent tool and an agent permission.

Without WebMCP, an agent has to infer page structure from pixels or narrate instructions in a separate chat. With WebMCP, the page publishes a precise contract for the capabilities it wants the agent to use. The agent receives structured state, known test IDs, exact valid outcomes, current version numbers, and bounded repair options. Tool calls immediately update the same fault map and proof trail the person is reviewing.

More importantly, the missing tools are part of the design. There is no `approve_repair`, `perform_repair`, arbitrary JavaScript, selector, URL-fetch, or audit-deletion tool. Human authority is not a sentence in the system prompt; it is an absent capability backed by domain invariants.

Every state-changing tool requires the current case version. Stale requests fail closed with guidance to refresh state. Human-entered notes are length-limited and annotated as untrusted content. Read tools carry read-only hints. Each registration has `AbortSignal` lifecycle cleanup.

That combination—structured agent leverage plus structural human authority—is what makes the experience meaningfully better together.

## How we built it

ProbeLoop is a dependency-free static ES-module application, so judges do not need an account, API key, install step, backend, database, or external service.

The core has four layers:

1. **Synthetic repair model** — five hypotheses, three bounded tests, likelihood tables, and one evidence-gated repair.
2. **Diagnostic engine** — entropy, expected-information-gain ranking, Bayesian updates, and confidence thresholds.
3. **Versioned state machine** — diagnose, probe, interpret, review, repair, verify, and resolve phases with an immutable narrative trail.
4. **WebMCP surface** — nine closed JSON Schemas registered on the top-level page through `document.modelContext.registerTool`.

The human UI and WebMCP tools call the same validated services. A built-in Agent rehearsal console exposes those handlers in normal browsers, while a WebMCP-capable browser discovers the native registrations.

Local browser storage preserves the synthetic case across refresh. Export is generated locally. The SVG circuit board, interface, diagnostic fixture, and all product logic were created for this challenge.

## Challenges we ran into

The hardest design question was not how many actions to expose; it was where to stop exposing them. A repair demo becomes unsafe and unconvincing if an agent can casually assert that it measured a circuit or replaced a component. We modeled authority separately from workflow progress and made observation, approval, and physical completion explicit provenance fields.

A second challenge was making Bayesian reasoning legible at demo speed. ProbeLoop ranks tests by expected information gain, but the interface does not ask judges to trust an opaque score. It shows the competing hypotheses, the selected probe points, the prior-to-posterior change, and the repair threshold in one visual state.

Finally, WebMCP is experimental. We kept native registration top-level and standards-aligned, then built a no-WebMCP rehearsal path that exercises the exact same handlers so the submission remains inspectable everywhere.

## Accomplishments we are proud of

- A workflow where human-agent collaboration is necessary, not decorative.
- A visible PCB fault map that stays synchronized with agent tool calls.
- A formal human-only approval and physical-work boundary with no agent bypass.
- Version-checked, reversible synthetic state with attributable evidence.
- Nine narrow tools with concise output budgets and annotations.
- Zero runtime dependencies or external calls on the judge path.
- Eighteen deterministic tests and a real Chromium end-to-end release gate.
- Twenty-four prompt-to-tool/no-tool design contracts, including explicit safety cases.
- A responsive, keyboard-operable interface that remains complete without WebMCP.

## What we learned

The best WebMCP tool can be the one you intentionally do not provide. Clear absence makes authority legible.

We also learned that a website should carry rich state visually while returning compact tool results. The agent does not need a duplicate of the entire interface in every response; it needs enough structured evidence to choose the next action and verify that the shared page changed.

Most importantly, “human in the loop” is stronger when the loop has typed provenance. ProbeLoop does not merely pause for confirmation. It records who observed, who approved, who completed physical work, and which version each decision applied to.

## What's next

The product direction is a reusable repair-workflow authoring layer: manufacturers, repair cafés, schools, and field-service teams could publish device-specific test catalogs, evidence thresholds, board maps, and safe repair boundaries as WebMCP-native experiences. Future work would add authenticated case histories, signed manuals, image-assisted component localization, calibration-aware instruments, technician roles, and field-validated diagnostic models—without weakening the human authority boundary demonstrated here.

## Technologies used

WebMCP Imperative API, JavaScript ES modules, HTML, CSS, SVG, localStorage, Bayesian inference, information theory, Node.js test runner, Python, Playwright, Chromium, GitHub Actions.

## Links

- Live app: `LIVE_URL_PENDING`
- Public source: `https://github.com/jackson-kuja/Audit-My-Model/tree/probeloop-webmcp-challenge`
- Demo video: `VIDEO_URL_PENDING`

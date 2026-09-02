# ProbeLoop judge guide

## The one-sentence idea

ProbeLoop is a physical-device diagnostic bench where WebMCP gives the agent structured reasoning and staging tools while the page structurally reserves observation, approval, and physical work for the person.

## Fastest evaluation path

1. Open `LIVE_URL_PENDING` in ChatGPT's built-in browser.
2. Confirm the header says **9 site tools available**.
3. Paste:

   > Diagnose this speaker using the safest most informative test. Show me exactly where to probe, record only the result I report, then stage the evidence-supported repair for my approval. Never claim you performed the physical work.

4. When asked for the meter result, say: **I measured OPEN / OL with USB disconnected.**
5. Confirm the page changes from 36.0% to **89.7% F1-open confidence** and the agent stages a like-for-like F1 repair.
6. Confirm the agent stops. There is no approval tool. Click **Approve this exact plan** yourself.
7. Check both physical-work attestations and continue.
8. Say: **I observed normal startup and charging.**
9. Confirm the page reaches **RESOLVED · CASE v7**, then export the evidence report.

The entire flow takes roughly one minute. In a browser without WebMCP, open **Agent rehearsal** to execute the same handlers manually.

## Four judging lenses

### WebMCP leverage

The tools are not a wrapper around an existing chat experience. They connect agent reasoning to the live, versioned page while preserving the irreducibly physical and consequential steps for the person. Tool outputs are concise, visible changes are immediate, registration is top-level, and every state mutation is bounded.

### Execution

The submission is a zero-dependency static application with a responsive, keyboard-operable human interface, Bayesian diagnosis, expected-information-gain ranking, local persistence, JSON export, 18 deterministic tests, 24 tool-selection contracts, and a Chromium end-to-end release gate.

### Potential impact

Repair, inspection, field service, and lab work all have the same asymmetry: agents can synthesize knowledge; people can observe and manipulate the physical world. ProbeLoop demonstrates a reusable interaction model for that category.

### Creativity and ambition

Most agent demos automate another screen. ProbeLoop coordinates cognition with reality. The visually shared PCB and the intentionally missing approval/physical-work tools make the collaboration legible in seconds.

## Integrity notes

- The device and board are synthetic.
- The Bayesian likelihood table is a deterministic demo fixture, not a claim of field-calibrated failure statistics.
- ProbeLoop does not connect to hardware or certify a safe repair.
- All data stays in the browser.

# ProbeLoop architecture and trust boundaries

## Product invariant

**An agent may transform evidence into a recommendation; it may not transform a recommendation into claimed physical reality.**

That invariant is enforced in the tool surface, domain layer, and visible state machine rather than left as prompt wording.

## State machine

```text
v1 DIAGNOSE
  └─ select_test ───────────────────────────────► v2 PROBE
       └─ record_measurement(human, power off) ─► v3 INTERPRET
            └─ stage_repair_plan(threshold) ────► v4 REVIEW
                 └─ visible human approval ─────► v5 REPAIR
                      └─ human work attestation ► v6 VERIFY
                           └─ record_post_check ► v7 RESOLVED
```

A failed post-repair observation returns the case to evidence collection. A rejected repair returns to interpretation without a physical-completion record.

## Authority matrix

| Capability | Agent through WebMCP | Person through UI | Enforcement |
| --- | ---: | ---: | --- |
| Read case and evidence | Yes | Yes | Read-only tool annotation |
| Rank safe tests | Yes | Visible | Deterministic information-gain service |
| Focus board component | Yes | Yes | Known component enum + version |
| Select bounded test | Yes | Yes | Known test enum + phase + version |
| Produce a physical reading | **No** | Yes | `observed_by` must be `human` |
| Record a reported reading | Yes | Yes | Selected test + valid outcome + power gate |
| Stage bounded repair | Yes | Yes | Known repair + confidence threshold + version |
| Approve repair | **No tool** | **Yes** | Human-only domain transition |
| Claim physical work happened | **No tool** | **Yes** | Human-only attestation transition |
| Record reported verification | Yes | Yes | Human attribution + approved completed plan |
| Delete audit trail | **No tool** | Reset whole synthetic fixture | No granular destructive capability |

## Diagnostic model

ProbeLoop starts with five normalized priors for the synthetic symptom. For each remaining test, it calculates:

```text
Expected information gain = H(current hypotheses)
                          − Σ P(outcome) × H(hypotheses | outcome)
```

The test catalog contains closed outcome sets and a deterministic likelihood table. After a human-reported result, Bayes' rule recomputes the posterior. The F1-open repair can be staged only when its posterior is at least 85%.

This math is fixture logic for a reproducible challenge demo, not field-calibrated diagnostic data.

## WebMCP lifecycle

`src/webmcp.js` checks for a top-level `document.modelContext.registerTool` function. Each of the nine definitions is registered with its own `AbortController` signal. A failed registration is reported without hiding successfully registered tools; unload aborts all registrations.

The normal application remains complete when WebMCP is absent. The **Agent rehearsal** dialog calls `createToolSystem(...).invoke`—the same handlers bound to each registered tool—so judges can inspect all state behavior without an experimental browser.

## Input and output discipline

- Tool names stay under 30 characters.
- Descriptions stay under 500 characters.
- Parameter descriptions stay under 150 characters.
- Every root schema uses `additionalProperties: false`.
- Input enums reference only known fixture IDs and outcomes.
- Every mutation requires `expected_version`.
- Human notes are length-limited and never interpreted as instructions.
- Tool results are JSON strings capped below 1,500 characters; the page itself carries richer visual state.

## Persistence and privacy

The single synthetic case is stored in browser `localStorage` so agent and human actions survive refresh in the same origin. No network request, account, cookie, server, database, analytics event, or hardware interface is used. Export creates a JSON blob locally.

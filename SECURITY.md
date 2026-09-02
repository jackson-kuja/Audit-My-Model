# Security model

ProbeLoop is a synthetic, low-voltage repair simulation. It does not connect to hardware, accept uploads, call external APIs, collect analytics, or transmit personal information.

The WebMCP surface is intentionally bounded:

- There is no generic JavaScript, DOM, selector, shell, URL-fetch, or arbitrary mutation tool.
- Tool inputs use closed schemas and are validated again in the domain layer.
- Human-entered notes are annotated as untrusted content.
- The agent can stage a repair, but approval and the physical-work attestation exist only in the human interface.
- Every state-changing operation requires the current case version, so stale actions fail closed.
- Every applied transition is visible in the activity trail and can be reset locally.

Report security issues through the repository's private vulnerability reporting feature rather than a public issue.

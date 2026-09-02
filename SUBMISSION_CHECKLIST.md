# Submission freeze checklist

## Required public artifacts

- [ ] Live application opens without login, payment, API key, or setup.
- [ ] Header reports nine site tools in the supported judge browser.
- [ ] Public repository points to the exact submitted source revision.
- [ ] MIT license is visible at repository root.
- [ ] README includes setup and WebMCP testing instructions.
- [ ] Demo video is public or unlisted on YouTube, under three minutes, narrated, and depicts the submitted build.
- [ ] Devpost text explains the human-agent experience and implementation.

## Release gates

```bash
npm run verify
python3 scripts/browser_verify.py
```

- [ ] Node/static gate passes.
- [ ] Chromium gate passes with zero console/page errors.
- [ ] Live deployment smoke test passes on desktop and mobile.
- [ ] `document.modelContext.registerTool` is discoverable on the top-level page.
- [ ] Agent stops at the human approval gate.
- [ ] Refresh preserves current synthetic case state.
- [ ] Exported JSON identifies human approval and physical completion.

## Devpost form

- [ ] Project name: ProbeLoop
- [ ] Tagline: Agents reason. People probe. Devices get another life.
- [ ] Live URL pasted.
- [ ] Public repository URL pasted.
- [ ] YouTube URL pasted.
- [ ] `DEVPOST.md` sections pasted and proofread.
- [ ] Hero screenshot and site-tools screenshot uploaded.
- [ ] Team/member details correct.
- [ ] All challenge terms accepted.

## Freeze discipline

- [ ] Create a final release tag and record the commit SHA.
- [ ] Record SHA-256 checksums for the source archive and demo video.
- [ ] Do not modify the live app, repository, or video after the deadline.
- [ ] Submit before September 3, 2026 at 1:00 p.m. Pacific / 4:00 p.m. Eastern.

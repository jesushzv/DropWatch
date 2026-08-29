---
description: "Cross-cutting — resume the workflow from wherever it left off"
---

Resume work on this project from wherever it actually stands.

1. Run the same reality-check as `/workflow-status` (status file, artifacts, gate verdicts, git state). Trust artifacts over the status file.
2. Identify the single next action: an incomplete build phase, an unfixed NEEDS_FIX finding, a pending gate, a probe whose threshold has since been met, or the next stage's opening command.
3. **Confirm the target in one line** ("Resuming: phase 3 of the build plan — Stripe checkout"), then execute that phase/command's procedure exactly as its own command file defines it — including its gates. Resuming is not a license to skip a gate that was pending when the session ended.
4. If the trail is genuinely ambiguous (e.g. uncommitted changes that don't match any phase), stop and present the founder the 2–3 possible states with evidence, rather than guessing.

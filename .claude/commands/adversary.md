---
description: "Cross-cutting — hostile review of any artifact, plan, or diff on demand"
argument-hint: "<path to artifact, 'diff', or a claim to attack>"
---

Dispatch the `adversary` agent against: **$ARGUMENTS**

- A path → attack that artifact per the agent's playbook for its type.
- `diff` → attack the current uncommitted/unpushed changes.
- A free-text claim (e.g. "we should switch to usage-based pricing") → attack the claim: what evidence would have to be true, which parts are [ASSUMPTION], what's the strongest counter-case.

Pass the agent the relevant context: the artifact, its upstream inputs (validation for a PRD, PRD for a plan), and `docs/knowledge/` for prior lessons that bear on it.

Relay the verdict **unsoftened** — kill shots first, then cracks, then what survived. Do not append reassurance the agent didn't produce. If the founder asks you to repair the artifact afterward, that's a separate step under the originating command's rules.

Free to use anytime, cheap by design. Standing gates already include it at `/validate-idea`, `/prd`, `/build-plan`, `/review`, and `/launch`; this command exists for everything in between — especially decisions about to be made on gut feel.

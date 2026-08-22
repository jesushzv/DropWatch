---
description: "Stage 1 — validate the idea with market research, competitor scan, and a Proof-of-Life probe. Gate: GO / PIVOT / KILL"
argument-hint: "[idea slug from docs/ideas/, or blank for the project's committed idea]"
---

Run the validation stage for: **$ARGUMENTS** (if blank, use the idea this project was created for — check `docs/00-status.md` and `docs/ideas/`).

Follow `.claude/references/research-protocol.md` strictly — every claim labeled, every source dated, prior knowledge checked first. This artifact decides whether months of work happen; it must be auditable.

## Steps

1. **Frame the problem.** One paragraph: who has the problem (a specific person, not "SMBs"), what job they're trying to get done, how it feels when it fails, what they do today instead. If you can't write this concretely, that itself is the finding.
2. **Demand evidence.** Dispatch the `research-analyst` agent (in parallel sweeps for broad questions) for proof people already try to solve this: competitor products and their traction signals, forum/Reddit/community complaints (quoted), search interest, "I'd pay for X" threads. The agent enforces the labeling protocol; your job is scoping its questions well. No demand evidence found is a result — report it, don't pad it.
3. **Competitor scan.** The 3–6 closest alternatives, including "spreadsheet" and "do nothing". For each: who it serves, pricing [FACT with source], the gap this idea exploits, and what stops them from closing that gap in a weekend.
4. **Market size, honestly.** A rough TAM/SAM/SOM with every multiplication shown and every input labeled. A defensible "1,000 customers × $30/mo is my realistic ceiling" beats a fantasy billion-dollar TAM.
5. **Riskiest assumptions.** List the top 3–5, ranked by (impact if wrong × current uncertainty). For the #1 assumption, design a **Proof-of-Life probe**: the cheapest real-world test (landing page + waitlist, 5 problem interviews, concierge MVP, pre-sale) with a pass/fail threshold defined *before* running it (e.g. "≥15% of 200 visitors leave an email"). If the probe is interviews, include a script that follows Mom-Test rules — ask about past behavior ("when did this last happen? what did you do?"), never hypotheticals ("would you use/pay for…"), never pitch the idea during the interview, and count only evidence of money/time already spent on the problem as a pass signal; compliments are noise.
6. **Write the artifact** to `docs/product/01-validation.md` using `docs/templates/validation.md`.
7. **Adversary gate.** Dispatch the `adversary` agent on the draft. Incorporate kill shots and cracks honestly — revise the verdict if the attack lands, don't argue with it. Append its verdict to the artifact.
8. **Verdict: GO / PIVOT / KILL**, with the reasoning and the probe results (or the probe plan, if the probe needs real-world time — in that case the verdict is `PENDING PROBE` and the status file says what threshold converts it to GO).
9. **Update** `docs/00-status.md` (stage, verdict, next command) and the idea file's status. On KILL, write the lesson to `docs/knowledge/lessons.md`.

Do not proceed to `/prd` on PIVOT or KILL. A **PIVOT is a procedure, not a consolation prize**: name explicitly what survives (the audience? the problem? the mechanism?), form the revised hypothesis, and re-run this command against it — the new brief's "Prior context" section must cite what the failed angle taught. One pivot per idea gets this treatment free; a second pivot on the same idea triggers `/compare-ideas` first, because serial pivoting is usually attachment wearing a strategy costume. A validation that always says GO is worthless — your credibility depends on the KILLs.

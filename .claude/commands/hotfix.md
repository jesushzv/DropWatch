---
description: "Emergency lane — production is broken: diagnose, minimal fix, mini-review, ship, backfill the paperwork"
argument-hint: "<what's broken, with any error output or repro steps>"
---

Production emergency: **$ARGUMENTS**

The fast lane trades ceremony for speed, not honesty for speed — prohibited behaviors (`.claude/references/prohibited-behaviors.md`) still bind, especially PB-3 (commenting out the problem) and PB-6 (swallowing the error), which are exactly what 2am fixes reach for.

## Steps

1. **Reproduce or at least observe.** Get the actual error (logs, Vercel runtime errors, Supabase logs, PostHog error tracking). Confirm blast radius: who is affected, is data being corrupted, is money moving wrongly? If data/money is actively being damaged, the first fix is a tourniquet (feature flag off, maintenance mode) — say so before diagnosing.
2. **Root-cause before fixing.** Check `git log` for what shipped recently; correlate with when the breakage started. Name the cause, not the symptom.
3. **Minimal fix.** Smallest change that fixes the root cause. No refactors, no drive-by improvements, no dependency upgrades unless the dependency *is* the cause.
4. **Mini-review.** Run the test suite + a scoped `code-reviewer` pass on the diff only. If the fix touches auth, payments, or data access, add a scoped `security-reviewer` pass. One fix iteration max — if it's not converging, escalate to the founder rather than stacking patches.
5. **Ship** via the `/ship` deploy steps (build, migrate if needed, deploy, smoke-test the broken path specifically — captured output).
6. **Backfill, same session:** dated entry in `docs/engineering/07-hotfixes.md` (what broke, root cause, fix, evidence it's fixed), a line in `docs/00-status.md`, and — if the root cause reveals a durable rule — a lesson in `docs/knowledge/lessons.md`. If the proper fix was deferred in favor of a tourniquet, create the follow-up as the status file's next action so it can't silently evaporate.

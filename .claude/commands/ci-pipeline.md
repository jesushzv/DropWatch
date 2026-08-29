---
description: "Stage 3 — set up GitHub Actions CI so /ship's 'CI green' gate actually exists"
argument-hint: "[optional: extras like 'e2e on PR' or 'preview comments']"
---

Set up (or update) the CI pipeline. Notes: **$ARGUMENTS**

## Steps

1. **Detect what the project actually has** — package manager, scripts in `package.json` (lint/typecheck/test/build), Playwright config, Supabase migrations dir. CI runs what exists; never invent a `npm run lint` the project doesn't define (add the script first if it's missing, with the founder's OK).
2. **Generate `.github/workflows/ci.yml`**, proportionate to a solo project:
   - Trigger: PRs to the default branch + pushes to it.
   - One job, node LTS, dependency cache: install → lint → typecheck → unit tests → build. Fast and boring; fail-fast on.
   - e2e (Playwright) as a separate job only if requested or the suite is quick — otherwise note it stays a local pre-`/ship` step (Vercel preview + local e2e is usually enough at this stage).
   - No deploy steps: Vercel's git integration owns deploys; CI's job is to block bad merges.
3. **Secrets hygiene:** CI must run with no production secrets. If tests need env vars, use dummy values in the workflow env or a `.env.test`; anything real is a design smell to fix, not a secret to add.
4. **Verify honestly:** push a branch, confirm the workflow runs green (or show the founder the exact failure). A committed-but-never-run workflow is PB-4.
5. Record in `docs/00-status.md`. From now on `/ship`'s pre-flight checks the latest run on the branch.

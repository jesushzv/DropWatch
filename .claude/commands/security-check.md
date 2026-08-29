---
description: "Stage 3 — the one pragmatic security gate before shipping. Binary PASS / FAIL"
argument-hint: "[optional: areas of concern, e.g. 'new webhook endpoint']"
---

Run the pre-ship security gate. Founder concerns: **$ARGUMENTS**

This is the single dedicated security pass of the workflow — proportionate for a solo SaaS, focused on what actually gets indie products breached. Run it before first production deploy, and again whenever a release touches auth, payments, data access, or file handling. Routine UI releases can skip it (note the skip in `docs/00-status.md`).

## Steps

1. **Dispatch the `security-reviewer` agent** with the current diff-since-last-check and repo access. Its checklist covers: secrets, server-side auth on every route, Supabase RLS on every table, input validation, Stripe webhook/entitlement integrity, dependency audit, abuse limits, headers.
2. **Fix loop** (max 3 iterations, same semantics as `/review`): fix blocking findings at the root cause, re-dispatch scoped to the fixed findings. Where practical, add the **negative test** — the test proving the attack now fails (e.g. a test that user B gets 403/empty on user A's resource). Negative tests are the only durable proof an authorization fix holds.
3. **Record** verdict + findings + accepted risks + evidence in `docs/engineering/04-security.md` (dated section per run), update `docs/00-status.md`.
4. On PASS → `/ship`. On FAIL after 3 iterations → founder decision, on the record.

Accepted risks are legitimate — a solo founder ships with known trade-offs — but they are *listed*, with the founder's initials on the decision, not silently dropped.

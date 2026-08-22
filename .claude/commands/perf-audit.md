---
description: "Stage 3/4 — performance and unit-cost audit: what's slow for users, what's expensive per user"
argument-hint: "[optional: focus, e.g. 'dashboard page' or 'llm costs']"
---

Run a performance + cost audit. Focus: **$ARGUMENTS** (default: the core loop's pages and the priciest external APIs).

Two lenses, one pass — **latency** (what users feel) and **unit cost** (what each user costs you, which `docs/product/03-positioning.md`'s pricing must clear). Evidence rules apply: numbers come from measurements or billing pages, not intuition.

## Latency

1. **Measure first**: build output (route sizes, largest client bundles), a Lighthouse/`next build` pass on the core pages, and timings on the slowest API routes (measured, captured).
2. **Hunt the usual suspects**: N+1 Supabase queries (loops awaiting per-row queries), missing indexes on filtered/sorted columns (check `supabase db` query plans where possible), server components fetching sequentially instead of in parallel, oversized client bundles from a misplaced `"use client"`, un-optimized images, missing pagination on unbounded lists.
3. **Report user-felt impact, not scores**: "dashboard takes 3.1s because of 40 sequential queries" ranks above a Lighthouse point. Fix list ordered by felt-impact per effort.

## Unit cost

4. **Inventory per-user costs**: every metered external call (LLM APIs above all, email, storage, third-party APIs) — cost per action × actions per active user per month, from real pricing pages [FACT] and real usage numbers where PostHog has them.
5. **Compare to price**: gross margin per tier at current usage and at 10× the heaviest plausible user. Flag any endpoint where a hostile or runaway user can spend your money unbounded (missing caps = also a `/security-check` abuse-limits finding).
6. **Cheap wins**: model right-sizing for LLM calls (smaller model where quality holds), caching repeated generations, batching, shorter prompts — with estimated savings each.

Append the dated audit to `docs/engineering/08-perf-audit.md`, update `docs/00-status.md`. Run before `/launch`, and again when `/measure` shows real usage (real numbers beat launch-day guesses).

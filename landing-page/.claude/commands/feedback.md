---
description: "Stage 4 — capture and theme user feedback so /measure and /roadmap run on user reality, not founder memory"
argument-hint: "[paste feedback, or 'mine' to sweep public mentions, or 'digest' to re-theme the ledger]"
---

Ingest user feedback. Mode: **$ARGUMENTS**

Validation interviewed users before building; this is the post-launch counterpart. The ledger at `docs/launch/04-feedback.md` is the qualitative twin of the metrics file — `/measure` reads it for the "why" behind the numbers, `/roadmap` reads it for themes. Without it, roadmapping degrades to whoever complained loudest last (the exact failure `/roadmap`'s adversary gate warns about).

## Modes

**Capture (default — founder pastes material):** support emails, cancellation reasons, sales-call notes, DMs, app-store reviews. For each item, append a ledger entry: date, verbatim quote (their words, not a paraphrase), source, user context if known (paying? churned? power user?), and a theme tag. Never editorialize the quote; interpretation goes in the theme, labeled [INFERENCE].

**`mine` — sweep the public record for your own product:** the same channels `/validate-idea` mined for competitor complaints, now pointed at yourself — Reddit/communities, review sites, social mentions, GitHub issues if public. Quote and link everything found [FACT]; "no mentions found" is a result worth logging (it means distribution, not product, is the story).

**`digest` — re-theme the ledger:** deduplicate into ranked themes (by frequency × revenue-weight — one churned payer outweighs five free-tier requests), update the `## Themes` section at the top of the ledger, and flag: the top unaddressed theme, any theme contradicting a PRD assumption (→ `docs/knowledge/assumptions.md`), and churn reasons clustering around something fixable. Recommend where each top theme should land: `/grow` experiment, `/roadmap` candidate, or "won't fix, here's why" (recorded — silence is how feature-request debt compounds).

## Cadence

Capture continuously (it takes a minute), digest before each `/roadmap` and monthly otherwise. If the ledger is empty by week 4 post-launch, that's a finding: you have no feedback channel — add one (support email in the footer, a feedback widget, a cancellation survey) via `/roadmap` before the next release.

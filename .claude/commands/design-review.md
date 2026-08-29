---
description: "Stage 3/4 — pre-launch UI polish pass: catch the generic-AI-slop tells before users do"
argument-hint: "[optional: pages/flows to focus on, or 'full' for the whole app]"
---

Run a design polish review. Scope: **$ARGUMENTS** (default: the core loop's screens + landing page).

AI-built UIs fail in recognizable ways — not broken, just *generic*. This pass hunts those tells before launch. **Dispatch the `design-reviewer` agent** — fresh context, so the UI's judge isn't its builder — with the scope, the checklist below, and `docs/product/05-ux-design.md` (if it exists) as the intent to judge against. The agent reviews and reports; fixes are applied afterward with founder approval (small ones can be batched immediately on request).

## The checklist the agent works

1. **See the real thing.** Run the app and walk the scoped flows — with Playwright screenshots at desktop and mobile widths if available, otherwise by reading the components while explicitly noting the review is code-only (weaker — say so in the report).
2. **Hunt the slop checklist:**
   - **Default-theme look:** untouched shadcn/Tailwind defaults everywhere, the same border-radius/shadow/gray palette as every other AI app. Is there *one* deliberate visual decision (type pairing, accent, spacing rhythm) applied consistently?
   - **Placeholder residue:** lorem-ipsum, "Your Company", template icons, unedited meta/OG tags, default favicon, dead footer links.
   - **Copy drone:** headings that describe features instead of benefits, "Empower your workflow"-grade filler, tone shifting between pages. Landing copy must match `docs/product/03-positioning.md` — same promise, same vocabulary.
   - **State poverty:** missing or ugly empty states (the first-run experience *is* the product at launch), no loading states on slow actions, raw error strings shown to users.
   - **Consistency drift:** mixed spacing scales, three button variants doing one job, misaligned form labels, inconsistent date/number formatting.
   - **Mobile reality:** the core loop actually works at 375px — tap targets, overflow, keyboard behavior on forms.
   - **Accessibility basics** (also a compliance item for EU customers — see `.claude/references/compliance.md`): the core loop is completable by keyboard alone (visible focus, no traps), text contrast meets WCAG AA, form inputs have real labels, images that carry meaning have alt text, and nothing conveys state by color alone. Run an automated pass (axe via Playwright, or Lighthouse a11y) and capture the score; hand-check the keyboard path yourself.
3. **Report** in severity order: *launch-blockers* (placeholder residue, broken mobile core loop, copy contradicting positioning) / *cheap wins* (an hour, big perceived-quality lift) / *later*. Each finding: screen, what's wrong, concrete fix. Include the screenshots.
4. Append the dated review to `docs/engineering/06-design-review.md`, update `docs/00-status.md`. Recommended timing: after the final `/build` phase, before `/launch` — and again whenever a release adds significant UI.

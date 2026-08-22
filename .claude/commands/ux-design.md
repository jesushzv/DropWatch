---
description: "Stage 2 — design the core loop's UX before building it: screen flow, layout decisions, and every state, on paper first"
argument-hint: "[optional: constraints, e.g. 'mobile-first' or 'must feel like a spreadsheet']"
---

Design the UX for the v1 core loop. Founder notes: **$ARGUMENTS**

**Input:** `docs/product/02-prd.md` (required — the core loop and user stories are the spec). This sits between `/prd` and `/architecture`: designing screens surfaces data-model needs before they're expensive, and catching a confusing flow on paper costs an hour instead of a rebuilt feature. `/design-review` later checks the built product against *this* artifact, not against generic taste.

## Steps

1. **Screen inventory & flow.** List every screen the core loop needs (arrive → value → return/pay) plus auth and settings. Draw the flow as a mermaid diagram — each arrow labeled with the user's intent, not the button name. If the core loop needs more than ~5 screens, that's scope feedback for the PRD; say so.
2. **The critical screen, in detail.** Every product has one screen where the value lives. Specify it wireframe-level in structured text: layout regions, information hierarchy (what's biggest, what's first), the primary action, what's above the fold at 375px. One deliberate visual decision minimum (type pairing, accent, density) so `/design-review` never finds the default-theme look.
3. **Every state, every screen — the section that earns this command:**
   - **Empty** (first-run): the empty state *is* onboarding — what does a brand-new user see and what single action does it point them to? Prefilled demo data beats instructional text.
   - **Loading**: what shows during slow operations; skeletons over spinners over nothing.
   - **Error**: the message a human sees (what happened + what to do), never the raw string.
   - **Ideal & overloaded**: realistic data, and 10× data (pagination? truncation?).
4. **Friction audit.** Walk the flow as the persona: count clicks/inputs from signup to first value. Everything deferrable (email verification, profile setup, plan choice) moves after the value moment.
5. **customer-voice pass.** Dispatch the `customer-voice` agent through the flow narrative. Where the persona hesitates, gets lost, or quits — fix the flow now, on paper. (Its reactions are a filter, not evidence — the label it appends stands.)
6. Write `docs/product/05-ux-design.md`, update `docs/00-status.md`. Next: `/architecture` (which reads this for data-model implications) or `/positioning` if not yet done.

Right-size: a landing-page MVP or single-screen tool gets a paragraph, not a document — say so and move on. The command exists for products with real flows.

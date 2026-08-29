---
description: "Stage 3 — lightweight architecture brief: data model, boundaries, and the few decisions that are expensive to reverse"
argument-hint: "[optional: constraints, e.g. 'must work offline']"
---

Write the architecture brief. Founder notes: **$ARGUMENTS**

**Inputs:** `docs/product/02-prd.md` (required), `.claude/references/stack.md` plus any project stack override, and `docs/knowledge/decisions.md` for constraints already settled.

## Philosophy

Boring beats clever. The default stack answers most questions already — this brief only records **decisions that are expensive to reverse**: the data model, the module boundaries, the third-party lock-ins, and anything that deviates from the stack defaults. Everything else is decided during `/build` at the point of need. Target: 1–2 pages.

## Steps

1. **Data model.** Tables/entities with key fields, relationships, and ownership (which user owns which row — this drives RLS policies). Sketch as a short list or mermaid `erDiagram`. Flag anything multi-tenant, soft-deleted, or event-sourced — those are the reversible-only-with-pain choices.
2. **System shape.** Only where it deviates from "Next.js app + Supabase + Vercel": background jobs, webhooks, external APIs, real-time needs, file storage, mobile client. For each external dependency: what happens when it's down, and the cost per user at 10× usage.
3. **Decisions (mini-ADRs).** For each expensive-to-reverse choice, three lines: decision / why / what would make us revisit. Append these to `docs/knowledge/decisions.md` too, so future sessions stop re-litigating them.
4. **Risk paragraph.** The one part of this design most likely to be wrong, and how we'd find out early.
5. Write `docs/engineering/01-architecture.md` using `docs/templates/design.md`, update `docs/00-status.md`. Next: `/build-plan`.

Skip the adversary here by default — `/build-plan` gets adversarial review and covers this brief transitively. Invoke `/adversary docs/engineering/01-architecture.md` manually if the data model feels risky.

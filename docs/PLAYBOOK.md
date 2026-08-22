# The Founder's Playbook

How to actually run this workflow — the narrative manual. The README is the reference; this is the "what do I do on Monday" document.

## The one rule

**Every session starts with `/workflow-status` (or `/continue-work` if you know you're mid-flight).** The status file remembers so you don't have to. Everything else follows from whatever it says your next command is.

## Starting a new idea (the full arc)

**Day 0 — capture, don't commit.** You have an idea in the shower. Open your portfolio clone (or any project) and run `/new-idea a tool that does X for Y`. Answer the 3–5 questions honestly. You get an ICE score and a riskiest assumption. **Stop there.** The discipline of not immediately building is the whole point of Stage 0. If you have other ideas waiting, `/compare-ideas` tells you whether this one actually jumps the queue.

**Week 1 — validate before code.** Idea won the queue? Create its repo from this template, then `/validate-idea`. Expect half a day of research and an adversary pass that will sting. The output ends in one of:
- **GO** → proceed to Define.
- **PENDING PROBE** → the workflow designed a cheap real-world test (landing page, 5 interviews, pre-sale) with a pass threshold *fixed in advance*. Run the probe in the real world — this is founder work, not Claude work. Days to two weeks. The threshold decides, not your enthusiasm.
- **PIVOT / KILL** → the research already answered. A KILL costs you a day; the build it prevented would have cost you a quarter. The lesson lands in `docs/knowledge/` and makes the next idea sharper.

**Week 2 — define.** `/prd` (one page, fight for the Out-of-scope section), then `/ux-design` (screen flow, the critical screen, every empty/loading/error state on paper — an hour here saves a rebuilt feature later; skip it for single-screen MVPs), then `/positioning` (statement, press-release paragraph, pricing hypothesis — now gated by both the adversary and the simulated customer). These files are the source of truth everything downstream cites — build scope, launch copy, metric targets.

**Weeks 3–6 — build.** `/architecture` (data model + expensive-to-reverse decisions only) → `/build-plan` (3–6 vertical slices, each demoable) → then the loop: `/build` a phase, look at it, repeat. Run `/ci-pipeline` once early so merges are guarded; any LLM-powered feature goes through `/ai-integrate` (evals before shipping, cost caps, injection safety). When the last phase lands: `/review` → `/security-check` → `/design-review` → `/perf-audit` (fast pass) → `/ship first-deploy` → `/observability` (error tracking and alerts live *before* traffic arrives). Expect the review gates to bounce you once or twice; that's them working. Fix loops cap at 3 — if a gate keeps failing, the decision escalates to you, on the record.

**Launch week.** `/launch` picks the channel from validation evidence and drafts every asset ready-to-publish — including the day-2+ motion from the growth playbook (content/community for PLG, founder-led sales for B2B). The legal gate ran at `/ship first-deploy` (privacy policy, terms, replay consent, Stripe Tax — see `.claude/references/compliance.md`), so launch traffic arrives on a compliant product. Launch day itself is your job: publish on schedule, live in the comments, PostHog live view open. The plan includes the breakage contact-sheet; `/hotfix` is the fire lane if something breaks with traffic on it.

**After.** `/measure setup` before or at launch (verify every PRD metric actually fires), then the growth cadence below.

## The recurring cadence

| When | Command | Why |
|---|---|---|
| Continuously (minutes) | `/feedback` | Capture user quotes as they arrive; `digest` before each roadmap — the qualitative twin of the metrics |
| Weekly (early), then biweekly | `/measure` | Numbers vs. the PRD's own targets; grades every running experiment and release hypothesis; names the one binding constraint; the honest-exit check keeps you from zombie-running a dead product |
| Between releases, one at a time | `/grow` | Day-scale experiments against the binding constraint, pre-registered thresholds — the learning loop that's faster than shipping releases |
| Monthly | `/watch-competitors` | Diffable snapshot; only material changes surface. Schedulable: `claude -p "/watch-competitors"` from cron or a Routine |
| Per release (or monthly) | `/retro` | Harvest lessons/assumptions/decisions — the compounding asset |
| Quarterly-ish | `/roadmap` | Re-sequence the next 1–3 releases from what `/measure` learned |
| Quarterly | `/ops-check` | Tested backup restore, dependency updates, credential hygiene, cost drift, continuity doc — the bus-factor insurance |
| ~2h/week, always | Audience motion | The build-in-public/newsletter cadence from the growth playbook — the one asset that compounds across every product |
| Weekly, once 2+ products live | `/portfolio` (from the hub) | Allocate the week across products, enforce the WIP limit, move lessons between living products |
| When the template repo improves | `/sync-template` | Pull workflow fixes into this project |
| When `/measure` says exit | `/sunset` | Sell-mode first (the docs/ trail is the due-diligence package), else a wind-down that treats users well |

## Protecting the founder

The workflow's scarcest resource isn't tokens — it's you, and every plan above silently assumes you're available. Guardrails:

- **WIP limit: one product in Build at a time.** Ideas can queue in Stage 0 indefinitely; validation is cheap enough to overlap; but two concurrent build stages means both ship late and worse. `/compare-ideas` is allowed to say "finish what's building first" — let it.
- **Budget the cadence in hours before adopting it.** The full growth cadence plus support plus a weekly channel motion is roughly 1–2 days/week before any building happens. If that's not true of your week, cut the cadence deliberately (biweekly `/measure`, monthly digest) rather than silently skipping — a cadence you quietly abandon stops being data.
- **`/measure` sanity-checks its own recommendation against your capacity** — one focus per period is a rule precisely because you are the bottleneck. If three periods in a row end with the focus not attempted, that's not a discipline failure to feel bad about; it's a signal the cadence is oversized — shrink it, on the record.
- **Watch for the burnout tells** the same way `/measure` watches churn: dreading the product you're building (an input `/compare-ideas` explicitly scores), support debt piling unanswered, retros skipped twice running. Any of these outranks the roadmap — the fix (a week off, sunsetting a product, hiring out support) is a legitimate `/roadmap` entry.

## Fast lanes and forks

- **Production is on fire** → `/hotfix`. Ceremony compressed, honesty not: root cause, minimal fix, scoped review, ship, backfill.
- **Small feature in a shipped product** → mini `/prd` update → `/build-plan` → `/build` → `/review` → `/ship`. Skip validate/positioning unless the feature changes who the product is for.
- **Bug fix** → `/build` as a one-phase plan → `/review` → `/ship`.
- **Copy or UI tweak** → just do it. `/review` if it touches the funnel.
- **Touching auth, payments, or data access** → never skip `/security-check`. This is the one non-negotiable.
- **Gut-feel decision looming** (pricing change, pivot, big dependency) → `/adversary` the claim before you act on it. Cheap, and it's the co-founder you don't have.
- **Skipping any gate** → allowed, *on the record*: the waiver goes in `docs/00-status.md`. Future-you gets to know what past-you gambled on.

## Reading the gates

Gates return binary verdicts on purpose — GO/KILL, APPROVED/NEEDS_FIX, PASS/FAIL, HOLDS/DOES NOT HOLD. When you want to argue with a verdict, that's fine — you're the founder — but the workflow makes you overrule it explicitly rather than blur it. The verdicts you'll regret ignoring, in order: a KILL at validation, a FAIL at security, an adversary kill shot on pricing.

## Portfolio hygiene

Keep one clone as the **portfolio hub**: its `docs/ideas/` is the master backlog, `/compare-ideas` there decides what graduates to its own repo, and once two or more products are live, weekly `/portfolio` reads every product's status, allocates your hours, and carries lessons between *living* products — not just at the end. The audience asset (growth playbook) also lives at hub level: the newsletter and build-in-public motion belong to you, not to any one product, and every launch borrows them. When a product exits, `/sunset` tries sell-mode first — the workflow's own docs/ trail is the due-diligence package — and a deliberate wind-down otherwise. Killed ideas and sunset products aren't failures in this system — they're the training data for your next bet.

## Improving the workflow itself

When a command fights you, don't edit it in the project — note it (`/retro` collects these under Workflow friction), then make the change once in the **template repo** and let `/sync-template` carry it everywhere. The workflow is itself a product; version it like one.

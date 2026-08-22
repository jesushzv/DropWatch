# Launch Compliance Basics

The legal minimum for a solo SaaS on the default stack, checked as gated items in `/ship first-deploy`. This is practical guidance, **not legal advice** — jurisdiction-specific questions (entity choice, tax registration thresholds) go to a professional; this file exists so the knowable basics are never silently skipped.

## Before first production traffic

1. **Privacy policy** — a real one describing what you actually collect. The default stack's list: account data (Supabase Auth), payment data (Stripe — you never store cards), product analytics + session replay (PostHog), transactional email (Resend), hosting logs (Vercel). Name the subprocessors, the retention story, and the contact for data requests. Generators are an acceptable start; hand-check the subprocessor list matches reality.
2. **Terms of service** — liability cap, acceptable use, termination, refund policy (state one — "14-day no-questions refund" is simple and defuses disputes), governing law.
3. **Consent for analytics/replay** — PostHog session replay records user behavior and is consent-triggering under GDPR/ePrivacy for EU visitors. Minimum: cookie/consent banner gating replay (and ideally analytics) for EU traffic; configure PostHog masking (`maskAllInputs`, mask text where sensible) so replays never capture passwords or payment fields regardless of consent.
4. **Stripe Tax** — turn it on from day one (registration-threshold tracking included); selling globally creates EU VAT/US sales-tax exposure that is miserable to backfill. Set your tax registration status honestly; revisit when Stripe warns a threshold approaches.
5. **Legal pages wired in** — privacy + terms linked in the footer and at signup ("by signing up you agree…"), refund policy reachable from pricing. `/design-review` treats missing/dead legal links as placeholder residue.
6. **Data-request handling** — you will eventually get a deletion request: know the answer (Supabase user delete + Stripe customer delete + PostHog person deletion + Resend suppression). Write the 5-line runbook into `docs/engineering/09-observability.md`'s ops notes or the ship artifact.

7. **Accessibility** — the European Accessibility Act (in force since June 2025) makes accessibility a legal requirement for consumer-facing e-commerce/SaaS serving EU customers, with a micro-enterprise exemption you may outgrow — and it's the right default anyway. The workflow's enforcement point is `/design-review`'s accessibility checklist (keyboard path, contrast, labels, alt text); run it before launch and treat failures on the core loop as launch-blockers.

## Ongoing

- New subprocessor (a new API, an LLM provider) → privacy policy update in the same release. `/ship`'s checklist asks.
- EU/UK users at real volume, or B2B customers asking for a DPA → time for the professional pass; note it in `docs/00-status.md` as a known deferral until then.
- AI features that process user content → say so in the privacy policy (which providers, retention, whether content trains models — with API providers it generally doesn't, say that too). `/ai-integrate` flags this when it runs.

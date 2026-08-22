# Default Stack

The workflow assumes this stack unless the project's `CLAUDE.md` overrides it. Every command that generates code, architecture, deploy steps, or instrumentation reads this file first.

| Layer | Default | Notes |
|---|---|---|
| Web framework | Next.js (App Router) + TypeScript | React Server Components by default; client components only when interactive |
| Styling | Tailwind CSS | shadcn/ui for components when a design system is needed |
| Database + Auth | Supabase (Postgres) | Auth via Supabase Auth; **Row Level Security on every table, no exceptions** |
| Hosting | Vercel | Preview deploys per PR; production on merge to main |
| Analytics | PostHog | Product analytics + feature flags + session replay |
| Payments | Stripe | Checkout + Billing portal; webhooks verified |
| Email | Resend | Transactional email |
| Mobile (when applicable) | React Native + Expo | Shares Supabase backend |
| Testing | Vitest (unit) + Playwright (e2e) | e2e for the critical paths only |

## Overriding per project

Add a `## Stack` section to the project's `CLAUDE.md` listing only what differs. Commands must respect the override. Example:

```markdown
## Stack
- Mobile-only: React Native + Expo, no Next.js web app
- Payments: RevenueCat instead of Stripe
```

## Stack conventions

- Environment variables: `.env.local` locally, Vercel env vars in prod. Never commit secrets; `.env.example` documents every required var.
- Database changes go through Supabase migrations (`supabase/migrations/`), never ad-hoc SQL against production.
- Server-only secrets (service role key, Stripe secret) are never exposed to client bundles — no `NEXT_PUBLIC_` prefix on secrets.
- Feature flags via PostHog for anything risky enough to want a kill switch.

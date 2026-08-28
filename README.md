# DropWatch

DropWatch is a retailer-agnostic price monitor. The full authenticated application lives at the repository root; the original validation landing page is preserved in [`landing-page/`](./landing-page/).

## Full application

The root project is a React, Express, tRPC, Drizzle, and Manus Auth application. It accepts plain-English alerts, monitors supported retailer sources automatically, and presents conservative trust evidence for price, shipping, tax, condition, availability, and freshness.

Run the root application with `pnpm install`, then `pnpm dev`. Required runtime secrets are configured through the deployment environment and must never be committed.

## Landing page

The original Vite validation landing page remains self-contained in `landing-page/`. Run it independently with `npm install` and `npm run dev` from that directory. Its Supabase, analytics, Meta Pixel, and Vercel settings remain separate from the root application.

## Repository migration

The combined-repository structure and non-destructive migration boundaries are documented in [`repo-sync-plan.md`](./repo-sync-plan.md). The original landing-page history is preserved on the `fullstack-app-migration` branch and can be reviewed before merging.

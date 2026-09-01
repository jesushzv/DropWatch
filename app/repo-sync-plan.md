# DropWatch Repository Synchronization Plan

## Finding

The active full-stack DropWatch application is not currently connected to `https://github.com/jesushzv/DropWatch`. Its `origin` points to the managed project repository used by the deployed Manus application. The originally shared GitHub repository is a separate public repository whose `main` branch currently contains a Vite/React validation landing page, marketing assets, Supabase waitlist migrations, and related landing-page documentation. It is not a checkout of the deployed authenticated DropWatch application.

## What can be synchronized

The full application source can be moved into the original repository as a deliberate replacement or as a clearly separated application directory. This includes `client/`, `server/`, `shared/`, `drizzle/`, `storage/`, project configuration, migration SQL, tests, and operational documentation. The application’s `README.md` should be rewritten so it describes the full-stack product rather than the existing validation landing page.

The combined structure is now prepared in the active project: the full-stack app remains at the repository root because its deployment expects the root-level package and server layout, while the original validation landing page is preserved under `landing-page/` with its own `package.json`, Vite configuration, static assets, legal pages, and README. The two builds are intentionally independent and must not be silently merged into one package or deployment entry point.

## What must not be copied

| Boundary | Treatment |
| --- | --- |
| Environment values and API keys | Never copy `.env`, injected secrets, Postmark tokens, Price API tokens, OAuth secrets, database URLs, JWT secrets, or test-auth secrets. Recreate them in the destination deployment’s secret manager. |
| Database contents | Do not export or copy production rows. Apply reviewed schema migrations to the destination database and preserve the existing production database unless an explicit data migration is approved. |
| Managed deployment metadata | Do not copy Manus project IDs, checkpoint metadata, generated domains, service bindings, or platform-specific deployment state into Git. Recreate the deployment connection from the destination repository. |
| User sessions and cookies | Do not transfer cookies, browser state, OAuth sessions, or signing material. Users authenticate again through the destination application. |
| Provider schedules | Do not duplicate recurring jobs blindly. Disable or verify the old schedule before enabling an equivalent schedule for the destination deployment. |
| Existing landing-page secrets | Keep Supabase, analytics, Meta Pixel, and Vercel values isolated unless the owner intentionally wants the landing page retained and separately configured. |

## Prepared combined layout

```text
/                       full authenticated DropWatch app
/landing-page/          original validation landing page
/repo-sync-plan.md      migration and boundary notes
/readiness-roadmap.md   app launch and pilot roadmap
```

The two workspaces now work together on one host: the root application serves the authenticated experience at `/app` and its existing watch routes, while the built landing page is served at `/landing-page/`. The landing page’s Vite base, static assets, legal links, and app CTA are configured for the subpath. The app provides a reciprocal link back to `/landing-page/`. The root build produces and mounts the landing-page bundle under `dist/public/landing-page`, so the combined deployment does not require separate hardcoded domains.

## Non-destructive migration procedure

1. Create a new branch in the original GitHub repository, for example `fullstack-app-migration`, without changing `main`.
2. Create a local backup/archive of the original repository state and record its current commit before importing application files.
3. Copy the full-stack application source and configuration from the active project while excluding `.env*` files, build output, generated deployment metadata, local logs, browser artifacts, and credentials.
4. Preserve the landing page under `landing-page/` with its independent package and Vite configuration, configure its base as `/landing-page/`, and keep the root app’s `/app` route separate from the landing-page build.
5. Add a new full-stack README describing local setup, required secrets by name, schema migration procedure, scheduled imports, provider callbacks, and production safeguards. Include the original landing-page commit as the archival reference.
6. Recreate destination secrets through the destination deployment manager. Use new provider callback URLs and verify Postmark sender, Price API credentials, OAuth configuration, and database connectivity independently.
7. Apply schema migrations to a staging or newly approved database first. Verify tables and indexes before any production cutover. Do not copy production data automatically.
8. Deploy the migration branch to a preview environment. Verify `/landing-page/`, `/landing-page/privacy.html`, `/landing-page/terms.html`, and `/app`; run the full test suite, type check, production build, authenticated smoke test, provider no-match test, notification unsubscribe test, and schedule-readiness check.
9. Open a pull request into `main` for owner review. Keep the existing production application and original landing page unchanged until the preview passes and the owner explicitly approves the cutover.
10. After approval, merge and deploy. Re-enable exactly one recurring import schedule, verify the callback URL, and monitor the first provider run before inviting users.

## Owner actions required

The owner has selected the combined-repository approach: the original GitHub repository should become the canonical repository containing both the root full-stack application and the preserved `landing-page/` workspace. If the original repository is selected, the owner must authorize access to push a migration branch or perform the push personally. The owner must also provide or recreate destination deployment secrets through the appropriate secret manager; secrets should not be sent in chat or committed to Git.

No repository push or replacement of the original `main` branch should occur without explicit approval after the migration branch and preview have been reviewed. The current deployed Manus project can continue serving users independently while this repository decision is made.

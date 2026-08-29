# Project TODO

- [x] Review the referenced DropWatch repository to establish the exact MVP watched-record workflow and fields.
- [x] Model watched records and immutable status-history entries in the existing database schema.
- [x] Add authenticated tRPC procedures for watched-record creation, listing, updating, deletion, status updates, and history retrieval.
- [x] Build a responsive authenticated monitoring dashboard with watched-record list, filters, and summary states.
- [x] Build accessible create and edit record interactions aligned with the product scope.
- [x] Build a detail view with current status and persistent history timeline.
- [x] Add clear loading, empty, success, and error states across all primary monitoring actions.
- [x] Add automated tests for watched-record authorization, persistence, and status-history behavior.
- [x] Validate type safety, tests, responsive rendering, and primary user workflows.
- [x] Add real-database integration coverage for watched-record persistence, price logging, threshold transitions, and event history.
- [x] Verify authenticated dashboard states without creating persistent sample watches in the owner’s account.
- [x] Document authenticated browser validation evidence and the non-destructive workflow test strategy.
- [x] Document that interactive authenticated browser testing was deferred at the user’s request, with automated coverage retained as the validation baseline.
- [x] Save a final project checkpoint and prepare a concise delivery summary.
- [x] Select and configure an approved email provider for user threshold notifications.
- [x] Select and configure an approved retailer price-data provider for manual or supported imports.
- [x] Implement provider-backed notification and price-import workflows with secure secrets handling.
- [x] Add an acceptance checklist for signed-in create, price-log, trigger, edit, pause/resume, and remove flows.
- [x] Validate the extended MVP and prepare a new project checkpoint.
- [x] Confirm a transactional email provider, sender identity, multi-store retailer-data provider, and import cadence for broad coverage.
- [x] Configure Postmark transactional notifications with a verified sender identity.
- [x] Configure Price API recurring US retailer imports through an authenticated completion callback.
- [x] Schedule the US Price API import every six hours in UTC after the production integration is deployed.
- [x] Verify the existing owner-scoped six-hour UTC Price API schedule through the approved owner service (enabled; next run: 2026-08-27 18:00 UTC).
- [x] Document the deferred published-browser schedule view after the interactive authentication return encountered an SSL protocol error.
- [x] Use `notifications@usedropwatch.com` as the verified Postmark sender for DropWatch threshold emails.
- [x] Confirm in Postmark that `usedropwatch.com` is domain-verified before sending live threshold emails.
- [x] Build the deployment-gated activation path for a per-user six-hour UTC Price API schedule.
- [x] Define the email-preference and one-click unsubscribe workflow for target-price notifications.
- [x] Persist per-user notification preferences and unsubscribe state securely.
- [x] Track and expose last import outcome, provider-job status, and import errors for each watch.
- [x] Extend Price API imports beyond US Google Shopping to additional supported sources without changing user-owned watch scope.
- [x] Build responsive preference, import-health, and retailer-source controls in the authenticated dashboard.
- [x] Add coverage for preferences, health-state aggregation, source selection, and notification suppression.
- [x] Validate the expanded workflow and prepare a new project checkpoint.

- [x] Remove user-required store selection from watch creation and replace it with automatic supported-retailer search.
- [x] Update importer matching and notification copy to select the best qualifying supported-retailer offer automatically.
- [x] Simplify watch edit and acceptance workflows so stores are not required from users.
- [x] Re-run the approved Sony WH-1000XM5 acceptance test and capture a confirmed provider result or documented provider-blocked outcome before cleanup.

- [x] Validate the revised no-store-selection workflow in type checks, regression tests, and desktop/mobile preview and prepare a new project checkpoint.

Please retain these items as implementation history; the prior store-selection items describe the previous workflow and should not be deleted.

- [x] Normalize legacy watches so automatic retailer discovery uses all supported sources consistently.
- [x] Replace hardcoded all-retailer copy with accurate effective-source presentation during the transition.
- [x] Add regression coverage for legacy source behavior and verify notification copy has no selected/trusted-store assumptions.

- [x] Save a new checkpoint after the revised no-store-selection workflow validation is complete.
- [x] Re-run and record final validation after legacy-source normalization and automatic-retailer copy fixes are complete.

- [x] Save a fresh project checkpoint after the no-store-selection, legacy-source normalization, and final validation changes are complete.

- [x] Define the pivot target user, core job, and competitive promise.
- [x] Define landed-cost, condition, fulfillment, availability, freshness, and evidence fields.
- [x] Define conservative trust/confidence rules and alert-basis choices.
- [x] Prioritize the smallest implementation slice and identify provider dependencies.
- [x] Define measurable validation experiments and rollout boundaries.
- [x] Write and deliver the approved pivot scope and recommended build sequence.

- [x] Scope bounded compatibility integrations for existing price-alert platforms without making them required for DropWatch monitoring.
- [x] Define an import/export or deep-link strategy for users migrating existing watches.
- [x] Define platform-specific feasibility, policy, privacy, and maintenance risks before implementation.

- [x] Define a production-safe development-only authentication harness for repeatable acceptance testing.
- [x] Implement the development-only test-auth guard and add regression tests proving production exclusion and secret/flag gating.
- [x] Document the user’s minimal setup step for local or preview acceptance testing.

- [x] Diagnose the published automation-status gate showing “Enable after you publish this app”.
- [x] Verify the published schedule record, deployment gate, and manual-check readiness.
- [x] Fix the automation-status issue and add regression coverage if the cause is in application code.
- [x] Rerun a live provider check after automation readiness is restored and record the outcome.

- [x] Assess launch-blocking risks across alert correctness, provider reliability, onboarding, and operations.
- [x] Prioritize the next release roadmap by trust impact and implementation leverage.
- [x] Define release gates and measurable readiness metrics for a limited user pilot.
- [x] Deliver the urgent user-readiness roadmap and recommend the next implementation slice.

- [x] Add provider-level check states, terminal no-match reasons, last-checked timestamps, and post-request health refresh.
- [x] Add trust-evidence fields and conservative offer normalization for shipping, tax, condition, fulfillment, availability, freshness, seller, and confidence.
- [x] Add observation-mode pilot controls and metrics without changing existing alert behavior by default.
- [x] Add optional ZIP-based delivered-cost estimates with explicit estimated/unknown states and no silent tax or shipping zeroes.
- [x] Update dashboard, detail view, and email surfaces to explain trust evidence and alert basis.
- [x] Add regression and integration coverage for trust normalization, provider states, observation mode, and delivered-cost estimates.
- [x] Validate the combined release with full tests, type checks, build, responsive review, and a live provider run.

- [x] Return and display per-source import-health states for queued, completed, no-match, and failed jobs.
- [x] Persist offer freshness and suppress stale alerts using a conservative age threshold.
- [x] Implement an explicit ZIP-based delivered-cost estimate path or document an honest provider-only fallback.
- [x] Add integration coverage for no-match reasons, observation-mode events, freshness suppression, and delivered-cost alert basis behavior.

- [x] Collapse import health to the latest state per provider source rather than retaining every historical job.
- [x] Add explicit user-facing documentation that ZIP is context-only until provider-supplied shipping/tax data is available.
- [x] Add database-backed integration coverage for persisted no-match health, observation events, freshness suppression, and alert-basis behavior.

- [x] Add a DB-backed observation-mode import/logging test asserting the persisted email_skipped event.
- [x] Add a DB-backed stale-offer pipeline test proving stale observations do not qualify for alerts.
- [x] Add a DB-backed alert-basis behavior test for item price versus estimated and verified totals.

- [x] Add a DB-backed behavioral comparison proving item-price, estimated-total, and verified-total alert bases qualify differently for partial versus complete landed-cost evidence.

- [x] Add the complementary DB-backed complete-landed-cost scenario for all three alert bases and verify persisted qualification events.

- [x] Resolve or escalate the platform deployment quota blocker before inviting external users.
- [x] Define the minimum public-launch reliability gates for alerts, provider checks, email delivery, unsubscribe, and data safety.
- [x] Define a small first-user pilot with an observation cohort, onboarding script, feedback loop, and success metrics.
- [x] Prepare the initial acquisition loop and launch messaging without scaling traffic before reliability is proven.
- [x] Deliver the next go-to-market roadmap and immediate owner action list.

- [x] Document a completed deployment-quota support escalation or verified quota resolution before inviting external users.
- [x] Add a concrete pilot onboarding script covering watch creation, observation mode, alert basis, no-match interpretation, and feedback reporting.

- [x] Simplify the first-run dashboard hierarchy around one primary watch-creation action.
- [x] Add an optional, dismissible in-product tutorial explaining watch creation, checks, no-match states, trust evidence, and alerts.
- [x] Add progressive disclosure for advanced trust settings without removing existing functionality.
- [x] Add regression coverage for tutorial persistence, dismissal, restart, and watch-creation behavior.
- [x] Validate the simplified flow for accessibility, desktop/mobile layout, and first-time comprehension.

- [x] Add UI-level coverage for tutorial dismissal and reopening from the How it works control.
- [x] Add end-to-end regression coverage for simplified plain-English and manual watch creation paths.
- [x] Perform and document keyboard, focus, dismiss-control, and details-disclosure accessibility checks.
- [x] Perform and document a first-time-user smoke/comprehension validation for watch creation, check states, and trust evidence.

- [x] Ensure the tutorial UI test matches the configured Vitest glob and is executed in the normal suite.
- [x] Add true UI/integration coverage for plain-English and manual watch creation from the simplified first-run flow.
- [x] Execute and document keyboard navigation, visible focus, tutorial dismissal, and advanced-settings disclosure checks.
- [ ] Complete and document an authenticated first-time-user smoke test for watch creation, check/no-match states, and trust evidence.

- [x] Add executed keyboard-navigation coverage from the tutorial through the primary watch-creation controls.
- [x] Validate visible focus states and advanced-settings disclosure behavior via keyboard and mouse, then document the results.

- [x] Inspect the current project remote, branch, and relationship to the originally shared GitHub repository.
- [x] Compare source/configuration boundaries and ensure secrets, database state, and deployment metadata are not copied unsafely.
- [x] Define a non-destructive synchronization or export path into the original repository.
- [x] Deliver the repository-location findings and required owner action.

- [x] Document which application files can be copied safely, which secrets/integrations must be recreated, and which database/deployment state must remain managed separately.
- [x] Write and save a non-destructive synchronization plan for moving the full-stack app into the original GitHub repository, including branch strategy, exclusions, and validation.
- [ ] Deliver the repository relationship findings and the owner actions required to connect or push safely.

- [x] Define a combined-repository structure that keeps the existing landing page and full DropWatch app together.
- [x] Prepare a coexistence migration plan with separate build/deployment entry points and preserved landing-page routes.
- [x] Identify the exact GitHub synchronization step and required owner authorization without pushing or overwriting the original repository unexpectedly.
- [x] Deliver the combined-repository architecture and next action.

- [ ] Deliver a user-facing summary of the combined repository architecture and the exact next owner action to sync it into the original GitHub repository safely.

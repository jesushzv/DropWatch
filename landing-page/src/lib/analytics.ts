// PostHog analytics — the probe's denominator (visitors) and the two signals
// that matter: signups by source, and pricing-tier clicks (payment intent).
// The project token is publishable by design. Emails never go to PostHog —
// they live only in Supabase, per the page's privacy note.
//
// Analytics runs on the live site only, mirroring how the Meta Pixel is
// env-gated. Local dev, Vercel preview deploys, and QA runs must never land
// in the probe's denominator: the committed thresholds in docs/00-status.md
// are read as a conversion *rate*, so founder traffic silently deflates it.

import posthog from "posthog-js";

// Hosts whose traffic counts as real. Add the custom domain here when it goes live.
const PRODUCTION_HOSTS = [
  "dropwatch-jesushzvs-projects.vercel.app",
  "usedropwatch.com",
  "www.usedropwatch.com",
];

function isProductionHost(): boolean {
  return (
    typeof window !== "undefined" && PRODUCTION_HOSTS.includes(window.location.hostname)
  );
}

export function initAnalytics(): void {
  if (!isProductionHost()) return;
  posthog.init("phc_za7HW2rRykLPP3pii6ko6ZYd7sKyT6RnNAQcbMgxU54Y", {
    api_host: "https://us.i.posthog.com",
    person_profiles: "identified_only",
  });
}

export function trackTierClick(tier: string): void {
  if (!isProductionHost()) return;
  posthog.capture("tier_click", { tier });
}

export function trackSignup(source: string, tier?: string): void {
  if (!isProductionHost()) return;
  posthog.capture("signup_submitted", { source, tier: tier ?? null });
}

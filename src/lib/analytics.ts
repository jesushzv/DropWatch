// PostHog analytics — the probe's denominator (visitors) and the two signals
// that matter: signups by source, and pricing-tier clicks (payment intent).
// The project token is publishable by design. Emails never go to PostHog —
// they live only in Supabase, per the page's privacy note.

import posthog from "posthog-js";

export function initAnalytics(): void {
  posthog.init("phc_za7HW2rRykLPP3pii6ko6ZYd7sKyT6RnNAQcbMgxU54Y", {
    api_host: "https://us.i.posthog.com",
    person_profiles: "identified_only",
  });
}

export function trackTierClick(tier: string): void {
  posthog.capture("tier_click", { tier });
}

export function trackSignup(source: string, tier?: string): void {
  posthog.capture("signup_submitted", { source, tier: tier ?? null });
}

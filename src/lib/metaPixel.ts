// Meta Pixel — feeds Meta's ad delivery optimization only. PostHog + Supabase
// stay the probe's source of truth (thresholds in docs/00-status.md are never
// read from Meta's numbers). Loads only when VITE_META_PIXEL_ID is set, so
// local dev and previews stay pixel-free. Emails and other PII never go to
// Meta — the Lead event carries at most the tier name, keeping the page's
// "no selling your email" note honest.

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

interface FbqFn {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: FbqFn;
  loaded: boolean;
  version: string;
}

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

// TS port of Meta's standard base snippet (queue until fbevents.js loads).
export function initMetaPixel(): void {
  if (!PIXEL_ID || window.fbq) return;
  const fbq = ((...args: unknown[]) => {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  }) as FbqFn;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  fbq("init", PIXEL_ID);
  fbq("track", "PageView");
}

// Real signups only — callers must keep this off the honeypot path.
export function trackMetaLead(tier?: string): void {
  window.fbq?.("track", "Lead", tier ? { content_name: tier } : {});
}

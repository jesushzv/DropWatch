import { TRPCError } from "@trpc/server";
import * as db from "./db";

/**
 * Per-user abuse and spend caps (security gate 2026-09-01). The app has open
 * self-signup, and three procedures spend paid-API money per call — without
 * these caps one hostile free account is an unbounded Anthropic/PriceAPI
 * bill. Sized for the founding-user pilot; raise deliberately, not silently.
 */
export const USAGE_LIMITS = {
  /** Anthropic calls (alert parses + deal verdicts) per user per UTC day. */
  llmCallsPerDay: 200,
  /** Non-deleted watches a user may hold at once. */
  maxActiveWatches: 20,
  /** Manual provider-import runs per user per UTC hour. */
  importRunsPerHour: 1,
} as const;

export function dayWindow(now: Date = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function hourWindow(now: Date = new Date()) {
  return now.toISOString().slice(0, 13);
}

function tooManyRequests(message: string): TRPCError {
  return new TRPCError({ code: "TOO_MANY_REQUESTS", message });
}

/** Counts the call before it happens, so a failed downstream call still spends budget. */
export async function enforceLlmBudget(userId: number) {
  const used = await db.incrementUsage(userId, "llm", dayWindow());
  if (used > USAGE_LIMITS.llmCallsPerDay) {
    throw tooManyRequests("Daily limit reached — try again tomorrow.");
  }
}

export async function enforceWatchCap(userId: number) {
  const active = await db.countActiveWatchedRecords(userId);
  if (active >= USAGE_LIMITS.maxActiveWatches) {
    throw tooManyRequests(`You can watch up to ${USAGE_LIMITS.maxActiveWatches} products — remove one to add another.`);
  }
}

export async function enforceImportRunCooldown(userId: number) {
  const runs = await db.incrementUsage(userId, "import_run", hourWindow());
  if (runs > USAGE_LIMITS.importRunsPerHour) {
    throw tooManyRequests("A fresh price check already ran this hour — try again later.");
  }
}

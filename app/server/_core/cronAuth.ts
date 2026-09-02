import { timingSafeEqual } from "node:crypto";

/**
 * Authenticates scheduled-job callbacks with a shared secret in the
 * Authorization header — the contract Vercel Cron uses when a CRON_SECRET
 * environment variable is set (ADR-5). When the secret is not configured the
 * endpoint refuses everything, so a deployment cannot accidentally expose an
 * open scheduled route.
 */
export function hasValidCronSecret(authorizationHeader: string | undefined, env: NodeJS.ProcessEnv = process.env) {
  const expected = env.CRON_SECRET;
  if (!expected || !authorizationHeader) return false;
  const candidate = authorizationHeader.startsWith("Bearer ") ? authorizationHeader.slice(7) : authorizationHeader;
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
}

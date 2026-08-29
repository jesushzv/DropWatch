import { timingSafeEqual } from "node:crypto";

export const TEST_AUTH_OPEN_ID = "dropwatch-dev-test-user";
export const TEST_AUTH_NAME = "DropWatch Development Tester";
export const TEST_AUTH_EMAIL = "dropwatch-dev-test@example.invalid";

export function isTestAuthEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV !== "production" && env.DROPWATCH_TEST_AUTH_ENABLED === "true" && Boolean(env.DROPWATCH_TEST_AUTH_SECRET);
}

export function hasValidTestAuthSecret(candidate: string | undefined, env: NodeJS.ProcessEnv = process.env) {
  const expected = env.DROPWATCH_TEST_AUTH_SECRET;
  if (!isTestAuthEnabled(env) || !candidate || !expected) return false;
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
}

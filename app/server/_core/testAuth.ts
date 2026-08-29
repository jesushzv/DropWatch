import { timingSafeEqual } from "node:crypto";

export const TEST_AUTH_OPEN_ID = "dropwatch-dev-test-user";
export const TEST_AUTH_NAME = "DropWatch Development Tester";
export const TEST_AUTH_EMAIL = "dropwatch-dev-test@example.invalid";

/** The only environments where development-only auth may exist at all. */
const TEST_AUTH_ALLOWED_ENVS = new Set(["development", "test"]);

export function isTestAuthEnabled(env: NodeJS.ProcessEnv = process.env) {
  // Allowlist rather than `NODE_ENV !== "production"`: an unset NODE_ENV would
  // pass that negation while ENV.isProduction already treats it as production,
  // so a deployment that simply forgot to set NODE_ENV could enable this route.
  return (
    TEST_AUTH_ALLOWED_ENVS.has(env.NODE_ENV ?? "") &&
    env.DROPWATCH_TEST_AUTH_ENABLED === "true" &&
    Boolean(env.DROPWATCH_TEST_AUTH_SECRET)
  );
}

export function hasValidTestAuthSecret(candidate: string | undefined, env: NodeJS.ProcessEnv = process.env) {
  const expected = env.DROPWATCH_TEST_AUTH_SECRET;
  if (!isTestAuthEnabled(env) || !candidate || !expected) return false;
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
}

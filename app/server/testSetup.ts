/**
 * Deterministic configuration for the unit suite.
 *
 * These are placeholders, never real credentials: the point is that `pnpm test`
 * behaves identically on a laptop, in CI, and on a machine that happens to have
 * production secrets exported. Anything that needs a live dependency belongs in
 * an integration test, which skips itself when DATABASE_URL is absent.
 */
const TEST_ENV: Record<string, string> = {
  NODE_ENV: "test",
  VITE_APP_ID: "test-app-id",
  JWT_SECRET: "test-jwt-secret-not-a-real-key",
  OAUTH_SERVER_URL: "https://oauth.test.invalid",
  POSTMARK_SERVER_TOKEN: "test-postmark-token",
  POSTMARK_FROM_EMAIL: "alerts@dropwatch.test.invalid",
  PRICE_API_TOKEN: "test-price-api-token",
  BUILT_IN_FORGE_API_URL: "https://forge.test.invalid",
  BUILT_IN_FORGE_API_KEY: "test-forge-key",
};

for (const [name, value] of Object.entries(TEST_ENV)) {
  // Do not clobber DATABASE_URL or anything an integration run set deliberately.
  process.env[name] = value;
}

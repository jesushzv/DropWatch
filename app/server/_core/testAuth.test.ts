import { describe, expect, it } from "vitest";
import { hasValidTestAuthSecret, isTestAuthEnabled } from "./testAuth";

describe("development-only test auth", () => {
  it("is disabled in production even when configured", () => {
    const env = { NODE_ENV: "production", DROPWATCH_TEST_AUTH_ENABLED: "true", DROPWATCH_TEST_AUTH_SECRET: "local-secret" };
    expect(isTestAuthEnabled(env)).toBe(false);
    expect(hasValidTestAuthSecret("local-secret", env)).toBe(false);
  });

  it("is disabled when NODE_ENV is unset, which the rest of the app treats as production", () => {
    const env = { DROPWATCH_TEST_AUTH_ENABLED: "true", DROPWATCH_TEST_AUTH_SECRET: "local-secret" };
    expect(isTestAuthEnabled(env)).toBe(false);
    expect(hasValidTestAuthSecret("local-secret", env)).toBe(false);
  });

  it("is disabled in an unrecognised environment name", () => {
    const env = { NODE_ENV: "staging", DROPWATCH_TEST_AUTH_ENABLED: "true", DROPWATCH_TEST_AUTH_SECRET: "local-secret" };
    expect(isTestAuthEnabled(env)).toBe(false);
  });

  it("requires the explicit non-production flag and secret", () => {
    expect(isTestAuthEnabled({ NODE_ENV: "development", DROPWATCH_TEST_AUTH_SECRET: "local-secret" })).toBe(false);
    expect(isTestAuthEnabled({ NODE_ENV: "development", DROPWATCH_TEST_AUTH_ENABLED: "true" })).toBe(false);
    expect(isTestAuthEnabled({ NODE_ENV: "development", DROPWATCH_TEST_AUTH_ENABLED: "true", DROPWATCH_TEST_AUTH_SECRET: "local-secret" })).toBe(true);
  });

  it("accepts only the configured secret", () => {
    const env = { NODE_ENV: "test", DROPWATCH_TEST_AUTH_ENABLED: "true", DROPWATCH_TEST_AUTH_SECRET: "local-secret" };
    expect(hasValidTestAuthSecret("local-secret", env)).toBe(true);
    expect(hasValidTestAuthSecret("wrong-secret", env)).toBe(false);
    expect(hasValidTestAuthSecret(undefined, env)).toBe(false);
  });
});

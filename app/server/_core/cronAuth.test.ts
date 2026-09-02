import { describe, expect, it } from "vitest";
import { hasValidCronSecret } from "./cronAuth";

describe("cron secret authentication", () => {
  it("refuses everything when CRON_SECRET is not configured", () => {
    expect(hasValidCronSecret("Bearer anything", {} as NodeJS.ProcessEnv)).toBe(false);
    expect(hasValidCronSecret(undefined, {} as NodeJS.ProcessEnv)).toBe(false);
  });

  it("accepts the configured secret as a Bearer token", () => {
    const env = { CRON_SECRET: "cron-secret-value" } as NodeJS.ProcessEnv;
    expect(hasValidCronSecret("Bearer cron-secret-value", env)).toBe(true);
  });

  it("rejects a wrong or truncated secret", () => {
    const env = { CRON_SECRET: "cron-secret-value" } as NodeJS.ProcessEnv;
    expect(hasValidCronSecret("Bearer cron-secret-valu", env)).toBe(false);
    expect(hasValidCronSecret("Bearer not-the-secret-at-all", env)).toBe(false);
    expect(hasValidCronSecret(undefined, env)).toBe(false);
  });
});

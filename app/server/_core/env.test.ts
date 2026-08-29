import { describe, expect, it } from "vitest";
import { isProductionRuntime } from "./env";

describe("production runtime detection", () => {
  it("keeps only explicit development mode non-production", () => {
    expect(isProductionRuntime("development")).toBe(false);
    expect(isProductionRuntime("production")).toBe(true);
    expect(isProductionRuntime(undefined)).toBe(true);
    expect(isProductionRuntime("test")).toBe(true);
  });
});

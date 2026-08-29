import { describe, expect, it } from "vitest";
import { parseStoredStores, statusAfterPrice } from "./db";

describe("DropWatch record helpers", () => {
  it("keeps stored retailer values safe to read", () => {
    expect(parseStoredStores('["Amazon", "Best Buy"]')).toEqual(["Amazon", "Best Buy"]);
    expect(parseStoredStores("not-json")).toEqual([]);
    expect(parseStoredStores('{"store":"Amazon"}')).toEqual([]);
  });

  it("triggers an active watch only when the logged price meets its target", () => {
    expect(statusAfterPrice({ currentStatus: "active", currentPriceCents: 25000, thresholdCents: 25000 })).toBe("triggered");
    expect(statusAfterPrice({ currentStatus: "active", currentPriceCents: 25001, thresholdCents: 25000 })).toBe("active");
  });

  it("never turns a paused or already-triggered watch into a new trigger", () => {
    expect(statusAfterPrice({ currentStatus: "paused", currentPriceCents: 20000, thresholdCents: 25000 })).toBe("paused");
    expect(statusAfterPrice({ currentStatus: "triggered", currentPriceCents: 20000, thresholdCents: 25000 })).toBe("triggered");
  });
});

import { describe, expect, it } from "vitest";
import { freshnessState, normalizeOffer, offerMeetsAlertBasis } from "./trustLayer";

describe("trust layer", () => {
  it("keeps unknown shipping and tax unknown instead of treating them as zero", () => {
    const offer = normalizeOffer({
      node: { condition: "New", availability: "In Stock" },
      store: "Example",
      priceCents: 25000,
      productUrl: "https://example.com/item",
    });
    expect(offer.estimatedTotalCents).toBe(25000);
    expect(offer.shippingCents).toBeUndefined();
    expect(offer.taxCents).toBeUndefined();
    expect(offer.costConfidence).toBe("unknown");
    expect(offerMeetsAlertBasis({ offer, thresholdCents: 25000, basis: "verified_total" })).toBe(false);
    expect(offerMeetsAlertBasis({ offer, thresholdCents: 25000, basis: "item_price" })).toBe(true);
  });

  it("calculates a verified total when both shipping and tax are present", () => {
    const offer = normalizeOffer({
      node: { shipping: 10, tax_amount: "2.50", condition: "new", availability: "in stock" },
      store: "Example",
      priceCents: 25000,
      productUrl: "https://example.com/item",
      destinationPostalCode: "10001",
    });
    expect(offer.estimatedTotalCents).toBe(26250);
    expect(offer.costConfidence).toBe("verified");
    expect(offerMeetsAlertBasis({ offer, thresholdCents: 26250, basis: "verified_total" })).toBe(true);
  });

  it("rejects stale observations even when the item price is under target", () => {
    const observedAt = new Date("2026-08-26T00:00:00Z");
    const offer = normalizeOffer({ node: { condition: "new", availability: "in stock" }, store: "Example", priceCents: 10000, productUrl: "https://example.com/item", observedAt });
    expect(freshnessState(observedAt, new Date("2026-08-27T00:00:00Z"))).toBe("stale");
    expect(offerMeetsAlertBasis({ offer, thresholdCents: 10000, basis: "item_price" })).toBe(false);
  });

  it("preserves a destination ZIP as context without inventing tax or shipping", () => {
    const offer = normalizeOffer({ node: { condition: "new", availability: "in stock" }, store: "Example", priceCents: 12000, productUrl: "https://example.com/item", destinationPostalCode: "94105" });
    expect(offer.destinationPostalCode).toBe("94105");
    expect(offer.costConfidence).toBe("unknown");
    expect(offer.estimatedTotalCents).toBe(12000);
  });

  it("rejects non-new and unavailable offers by default", () => {
    const offer = normalizeOffer({
      node: { shipping: 0, tax: 0, condition: "refurbished", availability: "out of stock" },
      store: "Example",
      priceCents: 10000,
      productUrl: "https://example.com/item",
    });
    expect(offerMeetsAlertBasis({ offer, thresholdCents: 10000, basis: "item_price" })).toBe(false);
  });
});

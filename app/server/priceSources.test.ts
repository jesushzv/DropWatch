import { describe, expect, it } from "vitest";
import { effectivePriceSources, parseSelectedSources } from "./priceSources";

describe("Price API source selection", () => {
  it("keeps only supported US sources and removes duplicates", () => {
    expect(parseSelectedSources('["amazon", "ebay", "amazon", "unknown"]')).toEqual(["amazon", "ebay"]);
  });

  it("falls back to Google Shopping for malformed or empty stored selections", () => {
    expect(parseSelectedSources("not-json")).toEqual(["google_shopping"]);
    expect(parseSelectedSources("[]")).toEqual(["google_shopping"]);
  });

  it("normalizes legacy stored selections to every supported source", () => {
    expect(effectivePriceSources('["google_shopping"]')).toEqual(["google_shopping", "amazon", "ebay"]);
    expect(effectivePriceSources('["amazon"]')).toEqual(["google_shopping", "amazon", "ebay"]);
  });
});

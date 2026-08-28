export const PRICE_SOURCE_IDS = ["google_shopping", "amazon", "ebay"] as const;
export type PriceSourceId = (typeof PRICE_SOURCE_IDS)[number];
export const ALL_SUPPORTED_PRICE_SOURCES = [...PRICE_SOURCE_IDS] as PriceSourceId[];

export const PRICE_SOURCE_DETAILS: Record<PriceSourceId, { label: string; description: string }> = {
  google_shopping: { label: "Google Shopping", description: "Compare offers across supported merchants." },
  amazon: { label: "Amazon", description: "Check Amazon product and offer data." },
  ebay: { label: "eBay", description: "Check eBay product and offer data." },
};

export function parseSelectedSources(value: string): PriceSourceId[] {
  try {
    const parsed = JSON.parse(value);
    const sources = Array.isArray(parsed) ? parsed.filter((source): source is PriceSourceId => PRICE_SOURCE_IDS.includes(source as PriceSourceId)) : [];
    return sources.length ? Array.from(new Set(sources)) : ["google_shopping"];
  } catch {
    return ["google_shopping"];
  }
}

export function sourceLabel(source: PriceSourceId) {
  return PRICE_SOURCE_DETAILS[source].label;
}

/** All user watches search every supported source; stored subsets are legacy data. */
export function effectivePriceSources(_storedValue: string): PriceSourceId[] {
  return [...ALL_SUPPORTED_PRICE_SOURCES];
}

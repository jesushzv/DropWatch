export type AlertBasis = "item_price" | "estimated_total" | "verified_total";
export type CostConfidence = "verified" | "partial" | "unknown";
export type FreshnessState = "fresh" | "stale";
export const FRESHNESS_MAX_AGE_HOURS = 12;

export type NormalizedOffer = {
  store: string;
  seller?: string;
  priceCents: number;
  shippingCents?: number;
  taxCents?: number;
  estimatedTotalCents: number;
  currency: string;
  condition?: string;
  fulfillment?: string;
  availability?: string;
  destinationPostalCode?: string;
  costConfidence: CostConfidence;
  productUrl: string;
  observedAt: Date;
  freshnessState: FreshnessState;
  evidence: Record<string, string | number | boolean>;
};

function positiveCents(value: unknown): number | undefined {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(/[^\d.]/g, "")) : Number.NaN;
  return Number.isFinite(numeric) && numeric >= 0 ? Math.round(numeric * 100) : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function dateValue(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return undefined;
}

export function normalizeCondition(value: unknown): string | undefined {
  const normalized = text(value)?.toLowerCase();
  if (!normalized) return undefined;
  if (normalized.includes("refurb")) return "refurbished";
  if (normalized.includes("open box") || normalized.includes("open-box")) return "open_box";
  if (normalized.includes("used")) return "used";
  if (normalized.includes("new")) return "new";
  return "unknown";
}

export function normalizeAvailability(value: unknown): string | undefined {
  const normalized = text(value)?.toLowerCase();
  if (!normalized) return undefined;
  if (normalized.includes("out") || normalized.includes("unavailable")) return "out_of_stock";
  if (normalized.includes("backorder") || normalized.includes("back order")) return "backorder";
  if (normalized.includes("in stock") || normalized.includes("available")) return "in_stock";
  return "unknown";
}

export function freshnessState(observedAt: Date, now = new Date()): FreshnessState {
  return now.getTime() - observedAt.getTime() <= FRESHNESS_MAX_AGE_HOURS * 60 * 60 * 1000 ? "fresh" : "stale";
}

export function normalizeOffer(input: {
  node: Record<string, unknown>;
  store: string;
  priceCents: number;
  productUrl: string;
  destinationPostalCode?: string;
  observedAt?: Date;
}): NormalizedOffer {
  const node = input.node;
  const shippingCents = positiveCents(node.shipping ?? node.shipping_price ?? node.shipping_cost ?? node.delivery_fee);
  const taxCents = positiveCents(node.tax ?? node.tax_amount ?? node.estimated_tax ?? node.sales_tax);
  const condition = normalizeCondition(node.condition ?? node.item_condition ?? node.product_condition);
  const availability = normalizeAvailability(node.availability ?? node.stock ?? node.inventory);
  const seller = text(node.seller ?? node.seller_name ?? node.merchant);
  const fulfillment = text(node.fulfillment ?? node.fulfilled_by ?? node.delivery);
  const currency = (text(node.currency ?? node.currency_code) ?? "USD").slice(0, 3).toUpperCase();
  const knownExtras = Number.isFinite(shippingCents) || Number.isFinite(taxCents);
  const costConfidence: CostConfidence = shippingCents !== undefined && taxCents !== undefined ? "verified" : knownExtras ? "partial" : "unknown";
  const observedAt = input.observedAt ?? dateValue(node.observed_at ?? node.observedAt ?? node.last_updated ?? node.updated_at ?? node.fetched_at) ?? new Date();
  return {
    store: input.store,
    seller,
    priceCents: input.priceCents,
    shippingCents,
    taxCents,
    estimatedTotalCents: input.priceCents + (shippingCents ?? 0) + (taxCents ?? 0),
    currency,
    condition,
    fulfillment,
    availability,
    destinationPostalCode: input.destinationPostalCode,
    costConfidence,
    productUrl: input.productUrl,
    observedAt,
    freshnessState: freshnessState(observedAt),
    evidence: {
      sourcePrice: input.priceCents,
      shippingKnown: shippingCents !== undefined,
      taxKnown: taxCents !== undefined,
      conditionKnown: condition !== undefined,
      availabilityKnown: availability !== undefined,
    },
  };
}

export function offerMeetsAlertBasis(input: { offer: Pick<NormalizedOffer, "priceCents" | "estimatedTotalCents" | "costConfidence" | "condition" | "availability" | "freshnessState">; thresholdCents: number; basis: AlertBasis }) {
  const conditionAllowed = !input.offer.condition || input.offer.condition === "new";
  if (input.offer.freshnessState === "stale") return false;
  const available = !input.offer.availability || input.offer.availability === "in_stock";
  if (!conditionAllowed || !available) return false;
  if (input.basis === "verified_total" && input.offer.costConfidence !== "verified") return false;
  if (input.basis === "estimated_total" && input.offer.costConfidence === "unknown") return false;
  const candidate = input.basis === "item_price" ? input.offer.priceCents : input.offer.estimatedTotalCents;
  return candidate <= input.thresholdCents;
}

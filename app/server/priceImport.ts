import { createHmac, timingSafeEqual } from "node:crypto";
import { ENV } from "./_core/env";
import * as db from "./db";
import { sendThresholdEmail } from "./notifications";
import { PriceSourceId, sourceLabel } from "./priceSources";
import { writeDealVerdict } from "./watchAi";
import { normalizeOffer, offerMeetsAlertBasis, NormalizedOffer } from "./trustLayer";

export const PRICE_IMPORT_CRON = "0 0 */6 * * *";
export const PRICE_API_MARKET = "us";

type UnknownRecord = Record<string, unknown>;

export type PriceApiJob = { job_id: string };
export type TrustedOffer = { store: string; priceCents: number; productUrl: string };

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asPriceCents(value: unknown): number | undefined {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(/[^\d.]/g, "")) : Number.NaN;
  if (!Number.isFinite(numberValue) || numberValue <= 0) return undefined;
  return Math.round(numberValue * 100);
}

function storeIsTrusted(store: string, trustedStores: string[]) {
  if (!trustedStores.length) return true;
  const candidate = store.toLocaleLowerCase();
  return trustedStores.some(trusted => {
    const expected = trusted.toLocaleLowerCase();
    return candidate === expected || candidate.includes(expected) || expected.includes(candidate);
  });
}

function offerFromNode(node: UnknownRecord, trustedStores: string[], fallbackUrl: string): TrustedOffer | undefined {
  const store = asText(node.store) ?? asText(node.merchant) ?? asText(node.seller) ?? asText(node.shop) ?? asText(node.source);
  const price = asPriceCents(node.price) ?? asPriceCents(node.price_amount) ?? asPriceCents(node.price_value) ?? asPriceCents(node.amount);
  if (!store || !price || !storeIsTrusted(store, trustedStores)) return undefined;
  const productUrl = asText(node.url) ?? asText(node.link) ?? asText(node.product_url) ?? asText(node.offer_url) ?? fallbackUrl;
  return { store, priceCents: price, productUrl };
}

/** Extract the lowest price from supported merchants without assuming one provider response shape. */
export function findLowestTrustedOffer(result: unknown, trustedStores: string[], fallbackUrl: string): TrustedOffer | undefined {
  const candidates: TrustedOffer[] = [];
  const visit = (value: unknown, depth: number) => {
    if (depth > 8 || value === null || value === undefined) return;
    if (Array.isArray(value)) { value.forEach(item => visit(item, depth + 1)); return; }
    if (!isRecord(value)) return;
    const offer = offerFromNode(value, trustedStores, fallbackUrl);
    if (offer) candidates.push(offer);
    Object.values(value).forEach(item => visit(item, depth + 1));
  };
  visit(result, 0);
  return candidates.sort((left, right) => left.priceCents - right.priceCents)[0];
}

export function findLowestNormalizedOffer(result: unknown, trustedStores: string[], fallbackUrl: string, destinationPostalCode?: string): NormalizedOffer | undefined {
  const candidates: NormalizedOffer[] = [];
  const visit = (value: unknown, depth: number) => {
    if (depth > 8 || value === null || value === undefined) return;
    if (Array.isArray(value)) { value.forEach(item => visit(item, depth + 1)); return; }
    if (!isRecord(value)) return;
    const store = asText(value.store) ?? asText(value.merchant) ?? asText(value.seller) ?? asText(value.shop) ?? asText(value.source);
    const price = asPriceCents(value.price) ?? asPriceCents(value.price_amount) ?? asPriceCents(value.price_value) ?? asPriceCents(value.amount);
    if (store && price && storeIsTrusted(store, trustedStores)) {
      const productUrl = asText(value.url) ?? asText(value.link) ?? asText(value.product_url) ?? asText(value.offer_url) ?? fallbackUrl;
      candidates.push(normalizeOffer({ node: value, store, priceCents: price, productUrl, destinationPostalCode }));
    }
    Object.values(value).forEach(item => visit(item, depth + 1));
  };
  visit(result, 0);
  return candidates.sort((left, right) => left.estimatedTotalCents - right.estimatedTotalCents)[0];
}

export function priceWebhookSignature() {
  return createHmac("sha256", ENV.cookieSecret).update("dropwatch-priceapi-webhook-v1").digest("hex");
}

export function isValidPriceWebhookSignature(candidate: string | undefined) {
  if (!candidate || !ENV.cookieSecret) return false;
  const expected = priceWebhookSignature();
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
}

export function buildPriceWebhookUrl(publicBaseUrl: string) {
  const url = new URL("/api/webhooks/price-api", publicBaseUrl);
  url.searchParams.set("signature", priceWebhookSignature());
  return url.toString();
}

export async function createPriceApiJob(input: { productName: string; source: PriceSourceId; webhookUrl: string }): Promise<PriceApiJob> {
  if (!ENV.priceApiToken) throw new Error("Price API is not configured.");
  const response = await fetch("https://priceapi.metoda.com/v2/jobs", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      token: ENV.priceApiToken,
      source: input.source,
      country: PRICE_API_MARKET,
      topic: "product_and_offers",
      key: "term",
      values: input.productName,
      max_pages: "1",
      max_age: "360",
      timeout: "10",
      webhook_url: input.webhookUrl,
      webhook_method: "POST",
      webhook_download_format: "json",
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as Partial<PriceApiJob> & { comment?: string; reason?: string };
  if (!response.ok || !payload.job_id) throw new Error(payload.comment || payload.reason || `Price API returned HTTP ${response.status}.`);
  return { job_id: payload.job_id };
}

export async function downloadPriceApiJob(providerJobId: string) {
  if (!ENV.priceApiToken) throw new Error("Price API is not configured.");
  const endpoint = new URL(`https://priceapi.metoda.com/v2/jobs/${encodeURIComponent(providerJobId)}/download`);
  endpoint.searchParams.set("token", ENV.priceApiToken);
  const response = await fetch(endpoint, { headers: { Accept: "application/json" }, redirect: "follow" });
  if (!response.ok) throw new Error(`Price API result download returned HTTP ${response.status}.`);
  return response.json() as Promise<unknown>;
}

function asWebhookRecord(value: unknown): UnknownRecord | undefined {
  return isRecord(value) ? value : undefined;
}

function webhookJob(input: unknown): { providerJobId: string; resultUrl?: string } | undefined {
  const outer = asWebhookRecord(input);
  const payload = asWebhookRecord(outer?.payload) ?? outer;
  const providerJobId = asText(payload?.job_id);
  if (!providerJobId) return undefined;
  return { providerJobId, resultUrl: asText(payload?.job_download_url) ?? asText(payload?.download_url) };
}

export async function requestPriceImports(input: { ownerId: number; publicBaseUrl: string }) {
  const activeRecords = await db.listActiveWatchedRecords(input.ownerId);
  const webhookUrl = buildPriceWebhookUrl(input.publicBaseUrl);
  const failures: string[] = [];
  let queued = 0;
  const requestedChecks = activeRecords.flatMap(record => record.sources.map(source => ({ record, source })));
  for (const { record, source } of requestedChecks.slice(0, 100)) {
    try {
      const job = await createPriceApiJob({ productName: record.productName, source, webhookUrl });
      await db.createPriceImportJob({ watchedRecordId: record.id, providerJobId: job.job_id, source });
      queued += 1;
    } catch (error) {
      failures.push(`${record.productName} (${sourceLabel(source)}): ${error instanceof Error ? error.message : "Price API job could not be requested."}`);
    }
  }
  return { queued, skipped: Math.max(0, requestedChecks.length - 100), failures };
}

function buildUnsubscribeUrl(publicBaseUrl: string, token: string) {
  const url = new URL("/api/unsubscribe", publicBaseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

export async function processPriceApiWebhook(input: unknown, publicBaseUrl?: string) {
  const job = webhookJob(input);
  if (!job) throw new Error("Price API webhook payload is missing a job identifier.");
  const pending = await db.getPriceImportJobWithRecord(job.providerJobId);
  if (!pending || pending.job.status !== "queued") return { status: "ignored" as const, providerJobId: job.providerJobId };

  let result: unknown;
  try {
    result = await downloadPriceApiJob(job.providerJobId);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Price API result could not be downloaded.";
    await db.markPriceImportJobFailed(job.providerJobId, reason);
    return { status: "failed" as const, providerJobId: job.providerJobId, reason };
  }

  const pendingOffer = findLowestNormalizedOffer(result, [], pending.record.originalRequest, pending.record.destinationPostalCode ?? undefined);
  const completed = await db.markPriceImportJobCompleted(job.providerJobId, job.resultUrl, pendingOffer ? undefined : "no_qualifying_offer");
  if (!completed) return { status: "ignored" as const, providerJobId: job.providerJobId };
  const offer = pendingOffer;
  if (!offer) {
    await db.appendWatchEvent({
      watchedRecordId: completed.record.id,
      eventType: "import_completed",
      message: `${sourceLabel(completed.job.source as PriceSourceId)} check completed, but no qualifying offer was found across supported retailers.`,
    });
    return { status: "completed_without_offer" as const, providerJobId: job.providerJobId };
  }

  const history = await db.getWatchedRecordDetail(completed.record.userId, completed.record.id);
  const historicalPrices = history?.prices.map(entry => entry.priceCents) ?? [];
  const dealVerdict = await writeDealVerdict({
    productName: completed.record.productName,
    thresholdCents: completed.record.thresholdCents,
    currentPriceCents: offer.priceCents,
    currentStore: offer.store,
    lowestPriceCents: Math.min(offer.priceCents, ...historicalPrices),
    priceEntryCount: historicalPrices.length + 1,
  });
  const willTrigger = completed.record.status === "active" && !completed.record.observationMode && offerMeetsAlertBasis({ offer, thresholdCents: completed.record.thresholdCents, basis: (completed.record.alertBasis as "item_price" | "estimated_total" | "verified_total") ?? "item_price" });
  const updated = await db.logPrice({
    userId: completed.record.userId,
    recordId: completed.record.id,
    productUrl: offer.productUrl,
    store: offer.store,
    priceCents: offer.priceCents,
    priceImportJobId: job.providerJobId,
    dealVerdict,
    shippingCents: offer.shippingCents,
    taxCents: offer.taxCents,
    estimatedTotalCents: offer.estimatedTotalCents,
    currency: offer.currency,
    condition: offer.condition,
    fulfillment: offer.fulfillment,
    availability: offer.availability,
    seller: offer.seller,
    destinationPostalCode: offer.destinationPostalCode,
    costConfidence: offer.costConfidence,
    freshnessState: offer.freshnessState,
    observedAt: offer.observedAt,
    evidenceJson: JSON.stringify(offer.evidence),
    qualifiesForAlert: willTrigger,
  });
  await db.appendWatchEvent({
    watchedRecordId: completed.record.id,
    eventType: "import_completed",
    message: `${sourceLabel(completed.job.source as PriceSourceId)} found $${(offer.priceCents / 100).toFixed(2)} at ${offer.store} (${offer.costConfidence} cost evidence).`,
  });

  if (completed.record.observationMode && offerMeetsAlertBasis({ offer, thresholdCents: completed.record.thresholdCents, basis: (completed.record.alertBasis as "item_price" | "estimated_total" | "verified_total") ?? "item_price" })) {
    await db.appendWatchEvent({ watchedRecordId: completed.record.id, eventType: "email_skipped", message: "Observation mode recorded a target match without sending an email." });
  }

  if (willTrigger) {
    const preferences = await db.getNotificationPreferences(completed.record.userId);
    const notification = preferences.priceAlertEmails
      ? await sendThresholdEmail({
        recipient: completed.owner?.email,
        productName: completed.record.productName,
        store: offer.store,
        priceCents: offer.priceCents,
        thresholdCents: completed.record.thresholdCents,
        estimatedTotalCents: offer.estimatedTotalCents,
        shippingCents: offer.shippingCents,
        taxCents: offer.taxCents,
        costConfidence: offer.costConfidence,
        condition: offer.condition,
        availability: offer.availability,
        seller: offer.seller,
        productUrl: offer.productUrl,
        alertBasis: completed.record.alertBasis,
        unsubscribeUrl: publicBaseUrl ? buildUnsubscribeUrl(publicBaseUrl, preferences.unsubscribeToken ?? "") : undefined,
      })
      : { status: "skipped" as const, reason: "Price-alert emails are disabled in notification preferences." };
    const message = notification.status === "sent"
      ? `Sent a target-met email for $${(offer.priceCents / 100).toFixed(2)} at ${offer.store}.`
      : notification.status === "skipped"
        ? `Target-met email skipped: ${notification.reason}`
        : `Target-met email could not be sent: ${notification.reason}`;
    await db.appendWatchEvent({ watchedRecordId: completed.record.id, eventType: `email_${notification.status}`, message });
  }
  return { status: "completed" as const, providerJobId: job.providerJobId, recordId: updated?.record.id };
}

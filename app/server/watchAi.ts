import { z } from "zod";
import { generateStructured, generateText } from "./_core/llm";

export type ParsedAlert = {
  productName: string;
  thresholdCents: number;
};

const parsedAlertSchema = z.object({
  productName: z.string(),
  thresholdCents: z.number().int(),
});

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export async function parseAlertRequest(request: string): Promise<ParsedAlert> {
  const parsed = await generateStructured({
    system:
      "Extract an online-shopping price alert. Never invent a target. Return a concise product name and the exact requested threshold in USD cents. Retailer selection is handled automatically by DropWatch.",
    user: request,
    schema: parsedAlertSchema,
  });
  return {
    productName: parsed.productName.trim(),
    thresholdCents: Math.round(parsed.thresholdCents),
  };
}

export async function writeDealVerdict(input: {
  productName: string;
  thresholdCents: number;
  currentPriceCents: number;
  currentStore: string;
  lowestPriceCents: number;
  priceEntryCount: number;
}): Promise<string> {
  const fallback =
    input.currentPriceCents <= input.thresholdCents
      ? `At or below your ${money.format(input.thresholdCents / 100)} target.`
      : `Above your ${money.format(input.thresholdCents / 100)} target — keep watching.`;

  try {
    const verdict = await generateText({
      system:
        "Write one calm, evidence-based sentence of no more than 16 words. Use only the supplied facts. Do not speculate, recommend financial action, or claim a time period not supplied.",
      user: JSON.stringify({
        product: input.productName,
        target: money.format(input.thresholdCents / 100),
        currentPrice: money.format(input.currentPriceCents / 100),
        currentStore: input.currentStore,
        lowestLoggedPrice: money.format(input.lowestPriceCents / 100),
        loggedPriceCount: input.priceEntryCount,
      }),
    });
    return verdict ? verdict.slice(0, 240) : fallback;
  } catch {
    return fallback;
  }
}

import { invokeLLM, listLLMModels } from "./_core/llm";

export type ParsedAlert = {
  productName: string;
  thresholdCents: number;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

async function chooseModel() {
  const { data } = await listLLMModels();
  return data.find(model => model.id === "gpt-5-mini")?.id;
}

export async function parseAlertRequest(request: string): Promise<ParsedAlert> {
  const response = await invokeLLM({
    model: await chooseModel(),
    messages: [
      {
        role: "system",
        content:
          "Extract an online-shopping price alert. Never invent a target. Return a concise product name and the exact requested threshold in USD cents. Retailer selection is handled automatically by DropWatch.",
      },
      { role: "user", content: request },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "dropwatch_alert",
        strict: true,
        schema: {
          type: "object",
          properties: {
            productName: { type: "string" },
            thresholdCents: { type: "integer" },
          },
          required: ["productName", "thresholdCents"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message.content;
  if (!content || typeof content !== "string") {
    throw new Error("The alert parser returned no structured result.");
  }

  const parsed = JSON.parse(content) as ParsedAlert;
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
    const response = await invokeLLM({
      model: await chooseModel(),
      messages: [
        {
          role: "system",
          content:
            "Write one calm, evidence-based sentence of no more than 16 words. Use only the supplied facts. Do not speculate, recommend financial action, or claim a time period not supplied.",
        },
        {
          role: "user",
          content: JSON.stringify({
            product: input.productName,
            target: money.format(input.thresholdCents / 100),
            currentPrice: money.format(input.currentPriceCents / 100),
            currentStore: input.currentStore,
            lowestLoggedPrice: money.format(input.lowestPriceCents / 100),
            loggedPriceCount: input.priceEntryCount,
          }),
        },
      ],
    });
    const content = response.choices[0]?.message.content;
    return typeof content === "string" && content.trim() ? content.trim().slice(0, 240) : fallback;
  } catch {
    return fallback;
  }
}

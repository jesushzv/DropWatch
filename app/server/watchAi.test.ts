import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./_core/llm", () => ({
  generateStructured: vi.fn(),
  generateText: vi.fn(),
}));

import { generateStructured, generateText } from "./_core/llm";
import { parseAlertRequest, writeDealVerdict } from "./watchAi";

const VERDICT_INPUT = {
  productName: "Sony WH-1000XM5",
  thresholdCents: 25_000,
  currentPriceCents: 24_000,
  currentStore: "Best Buy",
  lowestPriceCents: 24_000,
  priceEntryCount: 3,
};

describe("alert parsing via Anthropic", () => {
  afterEach(() => vi.clearAllMocks());

  it("normalizes the model's structured result", async () => {
    vi.mocked(generateStructured).mockResolvedValue({ productName: "  Sony WH-1000XM5 ", thresholdCents: 24999.6 });
    await expect(parseAlertRequest("Sony XM5 under $250")).resolves.toEqual({
      productName: "Sony WH-1000XM5",
      thresholdCents: 25000,
    });
    expect(generateStructured).toHaveBeenCalledWith(expect.objectContaining({ user: "Sony XM5 under $250" }));
  });

  it("propagates a parsing failure so the router can offer the manual form", async () => {
    vi.mocked(generateStructured).mockRejectedValue(new Error("The model returned no structured result."));
    await expect(parseAlertRequest("???")).rejects.toThrow();
  });
});

describe("deal verdicts via Anthropic", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns the model's sentence, capped at 240 characters", async () => {
    vi.mocked(generateText).mockResolvedValue("x".repeat(400));
    const verdict = await writeDealVerdict(VERDICT_INPUT);
    expect(verdict).toHaveLength(240);
  });

  it("falls back to the deterministic verdict when the model call fails", async () => {
    vi.mocked(generateText).mockRejectedValue(new Error("ANTHROPIC_API_KEY is not configured"));
    await expect(writeDealVerdict(VERDICT_INPUT)).resolves.toBe("At or below your $250.00 target.");
    await expect(
      writeDealVerdict({ ...VERDICT_INPUT, currentPriceCents: 26_000 }),
    ).resolves.toBe("Above your $250.00 target — keep watching.");
  });
});

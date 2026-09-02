import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getWatchedRecordDetail: vi.fn(),
  createWatchedRecord: vi.fn(),
  logPrice: vi.fn(),
  incrementUsage: vi.fn(),
  countActiveWatchedRecords: vi.fn(),
}));

vi.mock("./watchAi", () => ({
  parseAlertRequest: vi.fn(),
  writeDealVerdict: vi.fn(),
}));

vi.mock("./priceImport", async () => ({
  ...(await vi.importActual<typeof import("./priceImport")>("./priceImport")),
  requestPriceImports: vi.fn(),
}));

import { appRouter } from "./routers";
import * as db from "./db";
import { parseAlertRequest, writeDealVerdict } from "./watchAi";
import { requestPriceImports } from "./priceImport";
import { USAGE_LIMITS } from "./usageLimits";

const owner = {
  id: 42,
  openId: "dropwatch-owner",
  name: "Owner",
  email: "owner@example.com",
  loginMethod: "email",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const caller = () =>
  appRouter.createCaller({
    user: owner,
    req: { protocol: "https", headers: { host: "app.example", cookie: "" } } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  });

/**
 * Negative tests for the 2026-09-01 security gate's blocking finding: a
 * hostile free account looping the paid-API procedures. Each test proves the
 * attack now fails BEFORE any money is spent — the Anthropic/PriceAPI call
 * must not happen once the cap is hit.
 */
describe("paid-API abuse caps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.incrementUsage).mockResolvedValue(1);
    vi.mocked(db.countActiveWatchedRecords).mockResolvedValue(0);
  });

  it("stops createFromRequest at the daily LLM budget without calling Anthropic", async () => {
    vi.mocked(db.incrementUsage).mockResolvedValue(USAGE_LIMITS.llmCallsPerDay + 1);

    await expect(caller().watchedRecords.createFromRequest({ request: "Headphones under $250" })).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });

    expect(parseAlertRequest).not.toHaveBeenCalled();
    expect(db.createWatchedRecord).not.toHaveBeenCalled();
  });

  it("still spends budget on attempts, so failed parses cannot loop for free", async () => {
    vi.mocked(parseAlertRequest).mockRejectedValue(new Error("unparseable"));

    await expect(caller().watchedRecords.createFromRequest({ request: "????????" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect(db.incrementUsage).toHaveBeenCalledWith(owner.id, "llm", expect.any(String));
  });

  it("stops watch creation at the active-watch cap before parsing", async () => {
    vi.mocked(db.countActiveWatchedRecords).mockResolvedValue(USAGE_LIMITS.maxActiveWatches);

    await expect(caller().watchedRecords.createFromRequest({ request: "Headphones under $250" })).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    await expect(
      caller().watchedRecords.create({ originalRequest: "Headphones under $250", productName: "Headphones", thresholdCents: 25000 }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });

    expect(parseAlertRequest).not.toHaveBeenCalled();
    expect(db.createWatchedRecord).not.toHaveBeenCalled();
  });

  it("stops logPrice at the daily LLM budget without writing a verdict", async () => {
    vi.mocked(db.getWatchedRecordDetail).mockResolvedValue({
      record: { id: 7, productName: "Headphones", thresholdCents: 25000 },
      prices: [],
      events: [],
    } as never);
    vi.mocked(db.incrementUsage).mockResolvedValue(USAGE_LIMITS.llmCallsPerDay + 1);

    await expect(
      caller().watchedRecords.logPrice({ id: 7, productUrl: "https://store.example/p", priceCents: 1999 }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });

    expect(writeDealVerdict).not.toHaveBeenCalled();
    expect(db.logPrice).not.toHaveBeenCalled();
  });

  it("holds requestNow to the hourly cooldown without queueing provider jobs", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.mocked(db.incrementUsage).mockResolvedValue(USAGE_LIMITS.importRunsPerHour + 1);

    await expect(caller().priceImports.requestNow()).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });

    expect(requestPriceImports).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});

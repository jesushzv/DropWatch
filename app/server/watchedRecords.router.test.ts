import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  listWatchedRecords: vi.fn(),
  getWatchedRecordDetail: vi.fn(),
  createWatchedRecord: vi.fn(),
  updateWatchedRecord: vi.fn(),
  setWatchedRecordStatus: vi.fn(),
  softDeleteWatchedRecord: vi.fn(),
  logPrice: vi.fn(),
  getPriceImportSchedule: vi.fn(),
}));

vi.mock("./watchAi", () => ({
  parseAlertRequest: vi.fn(),
  writeDealVerdict: vi.fn(),
}));

import { appRouter } from "./routers";
import * as db from "./db";
import { parseAlertRequest } from "./watchAi";

const user = {
  id: 42,
  openId: "dropwatch-test-user",
  name: "Test User",
  email: "test@example.com",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function caller() {
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

describe("watchedRecords router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a watch without a user-provided store list", async () => {
    vi.mocked(db.createWatchedRecord).mockResolvedValue({ record: { id: 9 }, prices: [], events: [] } as never);

    await caller().watchedRecords.create({
      originalRequest: "Sony WH-1000XM5 under $250",
      productName: "Sony WH-1000XM5",
      thresholdCents: 25000,
    });

    expect(db.createWatchedRecord).toHaveBeenCalledWith({
      userId: user.id,
      originalRequest: "Sony WH-1000XM5 under $250",
      productName: "Sony WH-1000XM5",
      stores: [],
      sources: ["google_shopping", "amazon", "ebay"],
      thresholdCents: 25000,
      alertBasis: "item_price",
      observationMode: false,
    });
  });

  it("lists records for the authenticated user only", async () => {
    vi.mocked(db.listWatchedRecords).mockResolvedValue([]);

    await caller().watchedRecords.list();

    expect(db.listWatchedRecords).toHaveBeenCalledWith(user.id, false);
  });

  it("does not expose a record that the authenticated user cannot access", async () => {
    vi.mocked(db.getWatchedRecordDetail).mockResolvedValue(undefined);

    await expect(caller().watchedRecords.get({ id: 81 })).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(db.getWatchedRecordDetail).toHaveBeenCalledWith(user.id, 81);
  });

  it("uses the authenticated owner when pausing a record", async () => {
    vi.mocked(db.setWatchedRecordStatus).mockResolvedValue({
      record: { id: 7, userId: user.id },
      prices: [],
      events: [],
    } as never);

    await caller().watchedRecords.setStatus({ id: 7, status: "paused" });

    expect(db.setWatchedRecordStatus).toHaveBeenCalledWith({ userId: user.id, recordId: 7, status: "paused" });
  });

  it("returns null rather than undefined before a recurring import schedule exists", async () => {
    vi.mocked(db.getPriceImportSchedule).mockResolvedValue(undefined);

    await expect(caller().priceImports.getSchedule()).resolves.toBeNull();

    expect(db.getPriceImportSchedule).toHaveBeenCalledWith(user.id);
  });

  it("creates a watch from plain English with safe defaults", async () => {
    vi.mocked(parseAlertRequest).mockResolvedValue({
      productName: "Sony WH-1000XM5",
      thresholdCents: 25000,
      currency: "USD",
    });
    vi.mocked(db.createWatchedRecord).mockResolvedValue({ record: { id: 10 }, prices: [], events: [] } as never);

    await caller().watchedRecords.createFromRequest({ request: "Sony WH-1000XM5 under $250" });

    expect(db.createWatchedRecord).toHaveBeenCalledWith({
      userId: user.id,
      originalRequest: "Sony WH-1000XM5 under $250",
      productName: "Sony WH-1000XM5",
      stores: [],
      sources: ["google_shopping", "amazon", "ebay"],
      thresholdCents: 25000,
      alertBasis: "item_price",
      observationMode: false,
    });
  });
});

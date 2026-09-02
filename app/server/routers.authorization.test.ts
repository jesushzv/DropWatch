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
  setPriceImportScheduleEnabled: vi.fn(),
  createPriceImportSchedule: vi.fn(),
  getNotificationPreferences: vi.fn(),
  setPriceAlertEmailPreference: vi.fn(),
  listImportHealth: vi.fn(),
  getPilotMetrics: vi.fn(),
  incrementUsage: vi.fn(async () => 1),
  countActiveWatchedRecords: vi.fn(async () => 0),
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
import { requestPriceImports } from "./priceImport";

/** The caller. Every assertion below checks this id reaches the data layer. */
const OWNER_ID = 42;
/** A different user's row id, supplied as untrusted procedure input. */
const OTHER_USERS_RECORD_ID = 9001;

const owner = {
  id: OWNER_ID,
  openId: "dropwatch-owner",
  name: "Owner",
  email: "owner@example.com",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function context(user: typeof owner | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: { host: "app.example", cookie: "" } } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const caller = () => appRouter.createCaller(context(owner));
const anonymous = () => appRouter.createCaller(context(null));

/**
 * Every protected procedure, with a minimal valid input. Kept as one list so a
 * newly added procedure that is missing from it shows up as a gap rather than
 * silently going unchecked.
 */
const PROTECTED_PROCEDURES: { name: string; call: (c: ReturnType<typeof caller>) => Promise<unknown> }[] = [
  { name: "watchedRecords.list", call: c => c.watchedRecords.list() },
  { name: "watchedRecords.get", call: c => c.watchedRecords.get({ id: OTHER_USERS_RECORD_ID }) },
  { name: "watchedRecords.createFromRequest", call: c => c.watchedRecords.createFromRequest({ request: "Headphones under $250" }) },
  {
    name: "watchedRecords.create",
    call: c => c.watchedRecords.create({ originalRequest: "Headphones under $250", productName: "Headphones", thresholdCents: 25000 }),
  },
  {
    name: "watchedRecords.update",
    call: c =>
      c.watchedRecords.update({
        id: OTHER_USERS_RECORD_ID,
        originalRequest: "Headphones under $250",
        productName: "Headphones",
        thresholdCents: 25000,
      }),
  },
  { name: "watchedRecords.setStatus", call: c => c.watchedRecords.setStatus({ id: OTHER_USERS_RECORD_ID, status: "paused" }) },
  { name: "watchedRecords.remove", call: c => c.watchedRecords.remove({ id: OTHER_USERS_RECORD_ID }) },
  {
    name: "watchedRecords.logPrice",
    call: c => c.watchedRecords.logPrice({ id: OTHER_USERS_RECORD_ID, productUrl: "https://store.example/p", priceCents: 1999 }),
  },
  { name: "priceImports.getSchedule", call: c => c.priceImports.getSchedule() },
  { name: "priceImports.requestNow", call: c => c.priceImports.requestNow() },
  { name: "priceImports.enableRecurring", call: c => c.priceImports.enableRecurring() },
  { name: "priceImports.disableRecurring", call: c => c.priceImports.disableRecurring() },
  { name: "notificationPreferences.get", call: c => c.notificationPreferences.get() },
  { name: "notificationPreferences.update", call: c => c.notificationPreferences.update({ priceAlertEmails: false }) },
  { name: "importHealth.list", call: c => c.importHealth.list() },
  { name: "pilot.metrics", call: c => c.pilot.metrics() },
];

describe("router authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("covers every protected procedure the router exposes", () => {
    // Guards the list above against drifting out of date as procedures are added.
    const routed = Object.entries(appRouter._def.procedures)
      .filter(([name]) => !name.startsWith("auth.") && !name.startsWith("system."))
      .map(([name]) => name)
      .sort();
    expect(PROTECTED_PROCEDURES.map(p => p.name).sort()).toEqual(routed);
  });

  describe.each(PROTECTED_PROCEDURES)("$name", ({ call }) => {
    it("rejects an unauthenticated caller", async () => {
      await expect(call(anonymous() as ReturnType<typeof caller>)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("reaches no data-layer function when unauthenticated", async () => {
      await call(anonymous() as ReturnType<typeof caller>).catch(() => undefined);
      for (const [name, fn] of Object.entries(db)) {
        if (typeof fn === "function" && "mock" in fn) {
          expect(vi.mocked(fn as never), `db.${name} must not run for an anonymous caller`).not.toHaveBeenCalled();
        }
      }
    });
  });
});

describe("row ownership is taken from the session, never from procedure input", () => {
  beforeEach(() => vi.clearAllMocks());

  it("scopes a read of another user's record to the caller", async () => {
    vi.mocked(db.getWatchedRecordDetail).mockResolvedValue(undefined);

    await expect(caller().watchedRecords.get({ id: OTHER_USERS_RECORD_ID })).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(db.getWatchedRecordDetail).toHaveBeenCalledWith(OWNER_ID, OTHER_USERS_RECORD_ID);
  });

  it("scopes an update of another user's record to the caller", async () => {
    vi.mocked(db.updateWatchedRecord).mockResolvedValue(undefined as never);

    await expect(
      caller().watchedRecords.update({
        id: OTHER_USERS_RECORD_ID,
        originalRequest: "Headphones under $250",
        productName: "Headphones",
        thresholdCents: 25000,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(db.updateWatchedRecord).toHaveBeenCalledWith(expect.objectContaining({ userId: OWNER_ID, recordId: OTHER_USERS_RECORD_ID }));
  });

  it("scopes a delete of another user's record to the caller", async () => {
    vi.mocked(db.softDeleteWatchedRecord).mockResolvedValue(false as never);

    await expect(caller().watchedRecords.remove({ id: OTHER_USERS_RECORD_ID })).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(db.softDeleteWatchedRecord).toHaveBeenCalledWith(OWNER_ID, OTHER_USERS_RECORD_ID);
  });

  it("refuses to log a price against a record the caller does not own", async () => {
    vi.mocked(db.getWatchedRecordDetail).mockResolvedValue(undefined);

    await expect(
      caller().watchedRecords.logPrice({ id: OTHER_USERS_RECORD_ID, productUrl: "https://store.example/p", priceCents: 1999 }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    // The ownership check must happen before any write.
    expect(db.getWatchedRecordDetail).toHaveBeenCalledWith(OWNER_ID, OTHER_USERS_RECORD_ID);
    expect(db.logPrice).not.toHaveBeenCalled();
  });

  it("reads pilot metrics and import health for the caller only", async () => {
    vi.mocked(db.getPilotMetrics).mockResolvedValue({} as never);
    vi.mocked(db.listImportHealth).mockResolvedValue([] as never);

    await caller().pilot.metrics();
    await caller().importHealth.list();

    expect(db.getPilotMetrics).toHaveBeenCalledWith(OWNER_ID);
    expect(db.listImportHealth).toHaveBeenCalledWith(OWNER_ID);
  });

  it("disables a recurring schedule for the caller's own schedule only", async () => {
    vi.mocked(db.getPriceImportSchedule).mockResolvedValue({ scheduleCronTaskUid: "task-1" } as never);
    vi.mocked(db.setPriceImportScheduleEnabled).mockResolvedValue({} as never);

    await caller().priceImports.disableRecurring();

    expect(db.getPriceImportSchedule).toHaveBeenCalledWith(OWNER_ID);
    expect(db.setPriceImportScheduleEnabled).toHaveBeenCalledWith(OWNER_ID, false);
  });

  it("creates or re-enables the caller's own schedule when enabling recurring imports", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.mocked(db.getPriceImportSchedule).mockResolvedValue(undefined);
    vi.mocked(db.createPriceImportSchedule).mockResolvedValue({} as never);

    await caller().priceImports.enableRecurring();
    expect(db.createPriceImportSchedule).toHaveBeenCalledWith(expect.objectContaining({ ownerId: OWNER_ID }));

    vi.mocked(db.getPriceImportSchedule).mockResolvedValue({ enabled: false } as never);
    vi.mocked(db.setPriceImportScheduleEnabled).mockResolvedValue({} as never);

    await caller().priceImports.enableRecurring();
    expect(db.setPriceImportScheduleEnabled).toHaveBeenCalledWith(OWNER_ID, true);
    vi.unstubAllEnvs();
  });

  it("refuses to disable a schedule that does not exist rather than touching another one", async () => {
    vi.mocked(db.getPriceImportSchedule).mockResolvedValue(undefined);

    await expect(caller().priceImports.disableRecurring()).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(db.setPriceImportScheduleEnabled).not.toHaveBeenCalled();
  });
});

describe("provider-backed imports are gated outside production", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses requestNow and enableRecurring in a non-production runtime", async () => {
    vi.stubEnv("NODE_ENV", "development");

    await expect(caller().priceImports.requestNow()).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(caller().priceImports.enableRecurring()).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

    // Neither may reach the paid provider or touch the schedule table.
    expect(requestPriceImports).not.toHaveBeenCalled();
    expect(db.createPriceImportSchedule).not.toHaveBeenCalled();
    expect(db.setPriceImportScheduleEnabled).not.toHaveBeenCalled();

    vi.unstubAllEnvs();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getNotificationPreferences: vi.fn(),
  setPriceAlertEmailPreference: vi.fn(),
  listImportHealth: vi.fn(),
}));

import { appRouter } from "./routers";
import * as db from "./db";

const user = {
  id: 88,
  openId: "preference-test-user",
  name: "Preference Test",
  email: "preferences@example.com",
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

describe("notification preferences and import health routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("gets and updates preferences only for the authenticated user", async () => {
    vi.mocked(db.getNotificationPreferences).mockResolvedValue({ priceAlertEmails: true } as never);
    vi.mocked(db.setPriceAlertEmailPreference).mockResolvedValue({ priceAlertEmails: false } as never);

    await caller().notificationPreferences.get();
    await caller().notificationPreferences.update({ priceAlertEmails: false });

    expect(db.getNotificationPreferences).toHaveBeenCalledWith(user.id);
    expect(db.setPriceAlertEmailPreference).toHaveBeenCalledWith(user.id, false);
  });

  it("retrieves import health only for the authenticated user", async () => {
    vi.mocked(db.listImportHealth).mockResolvedValue([]);

    await caller().importHealth.list();

    expect(db.listImportHealth).toHaveBeenCalledWith(user.id);
  });
});

import type { Express, Request, Response } from "express";
import { ENV } from "./env";

type ScheduledImportsDependencies = {
  authenticateRequest: (req: Request) => Promise<{ isCron?: boolean; taskUid?: string }>;
  getPriceImportScheduleByTaskUid: (taskUid: string) => Promise<{ ownerId: number; enabled: boolean } | undefined>;
  requestPriceImports: (input: { ownerId: number; publicBaseUrl: string }) => Promise<Record<string, unknown>>;
};

/**
 * The provider callback that actually spends money.
 *
 * ADR-6 turns automated imports off for the MVP. The tRPC procedures are how a
 * user opts in, but a schedule registered on an earlier deployment keeps
 * calling this endpoint on its own — so disabling only those procedures would
 * leave the billing running. This refuses before it authenticates.
 */
export function registerScheduledImportsRoute(app: Express, dependencies: ScheduledImportsDependencies) {
  app.post("/api/scheduled/price-imports", async (req: Request, res: Response) => {
    if (!ENV.priceImportsEnabled) return res.status(503).json({ error: "automated price imports are disabled" });
    try {
      const user = await dependencies.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const schedule = await dependencies.getPriceImportScheduleByTaskUid(user.taskUid);
      if (!schedule || !schedule.enabled) return res.json({ ok: true, skipped: "orphan-or-paused" });
      const publicBaseUrl = `${req.protocol}://${req.get("host")}`;
      const result = await dependencies.requestPriceImports({ ownerId: schedule.ownerId, publicBaseUrl });
      return res.json({ ok: true, ...result });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Scheduled price imports failed.",
        timestamp: new Date().toISOString(),
      });
    }
  });
}

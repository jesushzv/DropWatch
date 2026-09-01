import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerSupabaseAuthRoutes } from "./supabaseAuthRoute";
import { hasValidCronSecret } from "./cronAuth";
import { registerTestAuthRoute } from "./testAuthRoute";
import { registerUnsubscribeRoute } from "./unsubscribeRoute";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { sdk } from "./sdk";
import * as db from "../db";
import { isValidPriceWebhookSignature, processPriceApiWebhook, requestPriceImports } from "../priceImport";

/**
 * Builds the HTTP app without binding it to anything: locally index.ts wraps
 * it in a long-running server with Vite/static serving, and on Vercel
 * api/index.ts exports it as a serverless function behind /api/* rewrites
 * (ADR-5). Anything that only makes sense in a long-running process — port
 * probing, HMR, static file serving — stays out of this module.
 */
export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerSupabaseAuthRoutes(app);
  registerTestAuthRoute(app, { upsertUser: db.upsertUser, createSessionToken: sdk.createSessionToken.bind(sdk) });
  app.post("/api/webhooks/price-api", async (req, res) => {
    if (
      !isValidPriceWebhookSignature(
        typeof req.query.signature === "string" ? req.query.signature : undefined,
        typeof req.query.expires === "string" ? req.query.expires : undefined,
      )
    ) {
      return res.status(401).json({ error: "invalid webhook signature" });
    }
    try {
      const result = await processPriceApiWebhook(req.body, `${req.protocol}://${req.get("host")}`);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : "Price API webhook processing failed." });
    }
  });
  registerUnsubscribeRoute(app, { unsubscribePriceAlertEmails: db.unsubscribePriceAlertEmails });
  // Scheduled-import callback. Vercel Cron requests it with GET and an
  // Authorization: Bearer CRON_SECRET header; POST is kept for manual runs.
  // Refuses everything when CRON_SECRET is unset.
  const runScheduledPriceImports: express.RequestHandler = async (req, res) => {
    if (!hasValidCronSecret(req.headers.authorization)) {
      return res.status(401).json({ error: "unauthorized" });
    }
    try {
      const schedules = await db.listEnabledPriceImportSchedules();
      const publicBaseUrl = `${req.protocol}://${req.get("host")}`;
      let queued = 0;
      const failures: string[] = [];
      for (const schedule of schedules) {
        const result = await requestPriceImports({ ownerId: schedule.ownerId, publicBaseUrl });
        queued += result.queued;
        failures.push(...result.failures);
      }
      return res.json({ ok: true, schedules: schedules.length, queued, failures });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Scheduled price imports failed.",
        timestamp: new Date().toISOString(),
      });
    }
  };
  app.get("/api/scheduled/price-imports", runScheduledPriceImports);
  app.post("/api/scheduled/price-imports", runScheduledPriceImports);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  return app;
}

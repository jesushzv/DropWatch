import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
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
import { serveStatic, setupVite } from "./vite";
import { assertRequiredEnv } from "./env";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  assertRequiredEnv();
  const app = express();
  const server = createServer(app);
  app.set("trust proxy", 1);
  // Configure body parser with larger size limit for file uploads
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
  // Scheduled-import callback (Vercel Cron under ADR-5). Authenticated by a
  // shared secret rather than a user session; refuses everything when
  // CRON_SECRET is unset.
  app.post("/api/scheduled/price-imports", async (req, res) => {
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
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

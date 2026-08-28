import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerTestAuthRoute } from "./testAuthRoute";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { sdk } from "./sdk";
import * as db from "../db";
import { isValidPriceWebhookSignature, processPriceApiWebhook, requestPriceImports } from "../priceImport";
import { serveStatic, setupVite } from "./vite";

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
  const app = express();
  const server = createServer(app);
  app.set("trust proxy", 1);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerTestAuthRoute(app, { upsertUser: db.upsertUser, createSessionToken: sdk.createSessionToken.bind(sdk) });
  app.post("/api/webhooks/price-api", async (req, res) => {
    if (!isValidPriceWebhookSignature(typeof req.query.signature === "string" ? req.query.signature : undefined)) {
      return res.status(401).json({ error: "invalid webhook signature" });
    }
    try {
      const result = await processPriceApiWebhook(req.body, `${req.protocol}://${req.get("host")}`);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : "Price API webhook processing failed." });
    }
  });
  app.get("/api/unsubscribe", async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token || token.length > 64) return res.status(400).type("html").send("<h1>Invalid unsubscribe link</h1><p>This link is incomplete or expired.</p>");
    try {
      const changed = await db.unsubscribePriceAlertEmails(token);
      return res.status(changed ? 200 : 404).type("html").send(changed
        ? "<h1>Price-alert emails are off</h1><p>DropWatch will still keep your watch history and in-app target events.</p>"
        : "<h1>Unsubscribe link not found</h1><p>This link may have expired or already been replaced.</p>");
    } catch {
      return res.status(500).type("html").send("<h1>We could not update your preference</h1><p>Please try again later.</p>");
    }
  });
  app.post("/api/scheduled/price-imports", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const schedule = await db.getPriceImportScheduleByTaskUid(user.taskUid);
      if (!schedule || !schedule.enabled) return res.json({ ok: true, skipped: "orphan-or-paused" });
      const publicBaseUrl = `${req.protocol}://${req.get("host")}`;
      const result = await requestPriceImports({ ownerId: schedule.ownerId, publicBaseUrl });
      return res.json({ ok: true, ...result });
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

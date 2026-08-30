import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { parse as parseCookie } from "cookie";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { createHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { ENV } from "./_core/env";
import { PRICE_IMPORT_CRON, requestPriceImports } from "./priceImport";
import { parseAlertRequest, writeDealVerdict } from "./watchAi";
import { PRICE_SOURCE_IDS } from "./priceSources";

const recordFields = z.object({
  originalRequest: z.string().trim().min(4).max(1000),
  productName: z.string().trim().min(2).max(255),
  stores: z.array(z.string().trim().min(2).max(120)).max(12).default([]),
  sources: z.array(z.enum(["google_shopping", "amazon", "ebay"])).min(1).max(3).default([...PRICE_SOURCE_IDS]),
  thresholdCents: z.number().int().positive().max(10_000_000),
  alertBasis: z.enum(["item_price", "estimated_total", "verified_total"]).default("item_price"),
  destinationPostalCode: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
  observationMode: z.boolean().default(false),
});

/** ADR-6: automated provider imports are off unless PRICE_IMPORTS_ENABLED=true. */
const IMPORTS_DISABLED_MSG = "Automated price imports are turned off for this release. Log prices manually instead.";

function notFound() {
  return new TRPCError({ code: "NOT_FOUND", message: "That watch could not be found." });
}

function publicBaseUrl(req: { protocol: string; headers: { host?: string } }) {
  const host = req.headers.host;
  if (!host) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not determine the application URL." });
  return `${req.protocol}://${host}`;
}

function retailerFromUrl(productUrl: string) {
  const hostname = new URL(productUrl).hostname.replace(/^www\./, "");
  return hostname || "Online retailer";
}

function decodedSession(req: { headers: { cookie?: string } }) {
  return parseCookie(req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  watchedRecords: router({
    list: protectedProcedure
      .input(z.object({ includeDeleted: z.boolean().optional() }).optional())
      .query(({ ctx, input }) => db.listWatchedRecords(ctx.user.id, input?.includeDeleted ?? false)),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const detail = await db.getWatchedRecordDetail(ctx.user.id, input.id);
      if (!detail) throw notFound();
      return detail;
    }),
    createFromRequest: protectedProcedure
      .input(z.object({ request: z.string().trim().min(4).max(1000) }))
      .mutation(async ({ ctx, input }) => {
        try {
          const parsed = await parseAlertRequest(input.request);
          const fields = recordFields.parse({ originalRequest: input.request, ...parsed });
          const detail = await db.createWatchedRecord({ userId: ctx.user.id, ...fields });
          if (!detail) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The watch was created but could not be loaded." });
          return detail;
        } catch {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "We could not read that alert. Try ‘Product under $250’, or add it manually.",
          });
        }
      }),
    create: protectedProcedure.input(recordFields).mutation(async ({ ctx, input }) => {
      const detail = await db.createWatchedRecord({ userId: ctx.user.id, ...input });
      if (!detail) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The watch was created but could not be loaded." });
      return detail;
    }),
    update: protectedProcedure
      .input(recordFields.extend({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const detail = await db.updateWatchedRecord({ userId: ctx.user.id, recordId: input.id, ...input });
        if (!detail) throw notFound();
        return detail;
      }),
    setStatus: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["active", "paused"]) }))
      .mutation(async ({ ctx, input }) => {
        const detail = await db.setWatchedRecordStatus({ userId: ctx.user.id, recordId: input.id, status: input.status });
        if (!detail) throw notFound();
        return detail;
      }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      if (!(await db.softDeleteWatchedRecord(ctx.user.id, input.id))) throw notFound();
      return { success: true } as const;
    }),
    logPrice: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          productUrl: z.string().url().max(2048),
          store: z.string().trim().min(2).max(120).optional(),
          priceCents: z.number().int().positive().max(10_000_000),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const detail = await db.getWatchedRecordDetail(ctx.user.id, input.id);
        if (!detail) throw notFound();
        const historicalPrices = detail.prices.map(price => price.priceCents);
        const lowestPriceCents = Math.min(input.priceCents, ...historicalPrices);
        const dealVerdict = await writeDealVerdict({
          productName: detail.record.productName,
          thresholdCents: detail.record.thresholdCents,
          currentPriceCents: input.priceCents,
          currentStore: input.store?.trim() || retailerFromUrl(input.productUrl),
          lowestPriceCents,
          priceEntryCount: historicalPrices.length + 1,
        });
        const updated = await db.logPrice({ userId: ctx.user.id, recordId: input.id, ...input, store: input.store?.trim() || retailerFromUrl(input.productUrl), dealVerdict });
        if (!updated) throw notFound();
        return updated;
      }),
  }),
  priceImports: router({
    getSchedule: protectedProcedure.query(async ({ ctx }) => (await db.getPriceImportSchedule(ctx.user.id)) ?? null),
    requestNow: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ENV.priceImportsEnabled) throw new TRPCError({ code: "PRECONDITION_FAILED", message: IMPORTS_DISABLED_MSG });
      if (!ENV.isProduction) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Publish DropWatch before requesting provider-backed imports." });
      return requestPriceImports({ ownerId: ctx.user.id, publicBaseUrl: publicBaseUrl(ctx.req) });
    }),
    enableRecurring: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ENV.priceImportsEnabled) throw new TRPCError({ code: "PRECONDITION_FAILED", message: IMPORTS_DISABLED_MSG });
      if (!ENV.isProduction) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Publish DropWatch before enabling recurring imports." });
      const session = decodedSession(ctx.req);
      const existing = await db.getPriceImportSchedule(ctx.user.id);
      if (existing?.scheduleCronTaskUid) {
        await updateHeartbeatJob(existing.scheduleCronTaskUid, { enable: true }, session);
        return db.setPriceImportScheduleEnabled(ctx.user.id, true);
      }
      const job = await createHeartbeatJob({
        name: `dropwatch-imports-${ctx.user.id}`,
        cron: PRICE_IMPORT_CRON,
        path: "/api/scheduled/price-imports",
        description: "Automatic US retailer price imports every six hours for DropWatch.",
      }, session);
      return db.createPriceImportSchedule({ ownerId: ctx.user.id, taskUid: job.taskUid, cronExpression: PRICE_IMPORT_CRON });
    }),
    disableRecurring: protectedProcedure.mutation(async ({ ctx }) => {
      const existing = await db.getPriceImportSchedule(ctx.user.id);
      if (!existing?.scheduleCronTaskUid) throw new TRPCError({ code: "NOT_FOUND", message: "No recurring import schedule was found." });
      await updateHeartbeatJob(existing.scheduleCronTaskUid, { enable: false }, decodedSession(ctx.req));
      return db.setPriceImportScheduleEnabled(ctx.user.id, false);
    }),
  }),
  notificationPreferences: router({
    get: protectedProcedure.query(({ ctx }) => db.getNotificationPreferences(ctx.user.id)),
    update: protectedProcedure
      .input(z.object({ priceAlertEmails: z.boolean() }))
      .mutation(({ ctx, input }) => db.setPriceAlertEmailPreference(ctx.user.id, input.priceAlertEmails)),
  }),
  importHealth: router({
    list: protectedProcedure.query(({ ctx }) => db.listImportHealth(ctx.user.id)),
  }),
  pilot: router({
    metrics: protectedProcedure.query(({ ctx }) => db.getPilotMetrics(ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;

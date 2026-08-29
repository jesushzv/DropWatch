import type { Express, Request, Response } from "express";

type UnsubscribeDependencies = {
  unsubscribePriceAlertEmails: (token: string) => Promise<boolean>;
};

const MAX_TOKEN_LENGTH = 64;

function unsubscribeToken(req: Request) {
  const raw =
    typeof req.query.token === "string"
      ? req.query.token
      : typeof (req.body as { token?: unknown } | undefined)?.token === "string"
        ? ((req.body as { token: string }).token)
        : "";
  return raw.length > 0 && raw.length <= MAX_TOKEN_LENGTH ? raw : "";
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] as string,
  );
}

const INVALID_LINK = "<h1>Invalid unsubscribe link</h1><p>This link is incomplete or expired.</p>";

/**
 * GET only confirms; the change happens on POST. A GET that mutates would be
 * fired by mail-client link scanners and prefetchers, silently switching off
 * users' alerts without them ever clicking. Mail clients that support RFC 8058
 * one-click POST here directly, so the single-click path is preserved.
 */
export function registerUnsubscribeRoute(app: Express, dependencies: UnsubscribeDependencies) {
  app.get("/api/unsubscribe", (req: Request, res: Response) => {
    const token = unsubscribeToken(req);
    if (!token) return res.status(400).type("html").send(INVALID_LINK);
    return res
      .status(200)
      .type("html")
      .send(
        `<h1>Turn off price-alert emails?</h1>
       <p>DropWatch will still keep your watch history and in-app target events.</p>
       <form method="POST" action="/api/unsubscribe">
         <input type="hidden" name="token" value="${escapeHtml(token)}" />
         <button type="submit">Turn off price-alert emails</button>
       </form>`,
      );
  });

  app.post("/api/unsubscribe", async (req: Request, res: Response) => {
    const token = unsubscribeToken(req);
    if (!token) return res.status(400).type("html").send(INVALID_LINK);
    try {
      const changed = await dependencies.unsubscribePriceAlertEmails(token);
      return res
        .status(changed ? 200 : 404)
        .type("html")
        .send(
          changed
            ? "<h1>Price-alert emails are off</h1><p>DropWatch will still keep your watch history and in-app target events.</p>"
            : "<h1>Unsubscribe link not found</h1><p>This link may have expired or already been replaced.</p>",
        );
    } catch {
      return res.status(500).type("html").send("<h1>We could not update your preference</h1><p>Please try again later.</p>");
    }
  });
}

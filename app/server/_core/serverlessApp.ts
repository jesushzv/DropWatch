import { createApp } from "./app";

// The ready-to-serve Express app, the default export bundled into the single
// Vercel serverless function (ADR-5). An Express app is a valid Node request
// handler, so Vercel invokes it directly as (req, res). Kept separate from
// index.ts (the long-running local entry) so the bundle pulls in only the app,
// never the http.Server / Vite / port-probing code.
export default createApp();

import { createApp } from "../server/_core/app";

// Single serverless entry for every dynamic route (ADR-5). vercel.json
// rewrites /api/* and /manus-storage/* here; the SPA and its assets are
// served statically from dist/public by the CDN. Express apps are valid
// Vercel Node handlers — the function receives (req, res) directly.
const app = createApp();

export default app;

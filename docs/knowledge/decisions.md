# Decision Log

> Durable decisions (architecture, pricing model, channel bets) in three lines each: decision / why / revisit-when. Commands check this before re-litigating anything recorded here.

| Date | Decision | Why | Revisit when |
|---|---|---|---|
| 2026-08-24 | `usedropwatch.com` is served by the Vercel project **`dropwatch`**; the duplicate `drop-watch` project is deleted — **executed and verified 2026-08-24** | Two projects were building this repo. The custom domain landed on `drop-watch`, which lacks `VITE_META_PIXEL_ID`, so the bundle it served had no Meta Pixel — ads would have optimised blind. `dropwatch` is the project named in CLAUDE.md and holds the pixel env var and deploy history | A second project is ever needed (staging, a separate marketing site) — then name it explicitly in CLAUDE.md rather than letting a stray link create it |

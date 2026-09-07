// Vercel build for dropwatch-app (ADR-5), using the Build Output API so the
// output is fully deterministic instead of relying on Vercel's per-file
// transpile — which deployed the server's extensionless ESM imports un-bundled
// and crashed the function at load (ERR_MODULE_NOT_FOUND).
//
// It produces .vercel/output/ with:
//   static/                     ← the Vite SPA (dist/public)
//   functions/api/index.func/   ← the whole Express app bundled into ONE
//                                 self-contained CommonJS file, so there are no
//                                 bare relative imports for Node to resolve
//   config.json                 ← routing (static, /api → function, SPA
//                                 fallback) + the daily cron
import { execSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, ".vercel", "output");
const funcDir = path.join(outDir, "functions", "api", "index.func");

const run = cmd => execSync(cmd, { cwd: root, stdio: "inherit" });

// 1. SPA
run("pnpm exec vite build");

// 2. Single self-contained CommonJS bundle of the Express app. CommonJS (not
//    ESM) so Express's own require() calls resolve natively; fully inlined so
//    the function needs no node_modules at runtime.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(funcDir, { recursive: true });
run(
  `pnpm exec esbuild server/_core/serverlessApp.ts --bundle --platform=node ` +
    `--target=node22 --format=cjs --outfile="${path.join(funcDir, "index.js")}"`,
);

// 3. Function metadata. Its own package.json pins CommonJS so the bundled
//    index.js is loaded as CJS even though the app package is type:module.
//    shouldAddHelpers:false — the Express app owns request/body parsing; the
//    Vercel helpers would consume the body stream first and break POST routes.
writeFileSync(path.join(funcDir, "package.json"), JSON.stringify({ type: "commonjs" }) + "\n");
writeFileSync(
  path.join(funcDir, ".vc-config.json"),
  JSON.stringify({ runtime: "nodejs22.x", handler: "index.js", launcherType: "Nodejs", shouldAddHelpers: false }, null, 2) + "\n",
);

// 4. Static output (the SPA and its assets).
cpSync(path.join(root, "dist", "public"), path.join(outDir, "static"), { recursive: true });

// 5. Routing + cron. filesystem first (serves index.html and /assets/*), then
//    the API/storage function, then the SPA fallback for client-side routes.
writeFileSync(
  path.join(outDir, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { handle: "filesystem" },
        { src: "/api/(.*)", dest: "/api/index" },
        { src: "/manus-storage/(.*)", dest: "/api/index" },
        { src: "/(.*)", dest: "/index.html" },
      ],
      crons: [{ path: "/api/scheduled/price-imports", schedule: "0 8 * * *" }],
    },
    null,
    2,
  ) + "\n",
);

console.log("Build Output API bundle ready at .vercel/output");

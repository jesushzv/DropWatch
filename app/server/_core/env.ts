/**
 * Treat anything that is not an explicit non-production environment as
 * production, so an unset NODE_ENV fails safe. `testAuth` must agree with this
 * or an unset NODE_ENV would count as production here while still permitting
 * development-only auth there.
 */
export function isProductionRuntime(nodeEnv: string | undefined) {
  return nodeEnv !== "development";
}

/**
 * Secrets the server cannot function without. JWT_SECRET in particular fails
 * late and confusingly if unset: signing throws "Zero-length key is not
 * supported" on the first login rather than at boot.
 */
const REQUIRED_IN_PRODUCTION = ["JWT_SECRET", "DATABASE_URL", "OAUTH_SERVER_URL", "VITE_APP_ID"] as const;

export function missingRequiredEnv(env: NodeJS.ProcessEnv = process.env) {
  return REQUIRED_IN_PRODUCTION.filter(name => !env[name]);
}

export function assertRequiredEnv(env: NodeJS.ProcessEnv = process.env) {
  const missing = missingRequiredEnv(env);
  if (missing.length === 0) return;
  const message = `Missing required environment variables: ${missing.join(", ")}. See .env.example.`;
  if (isProductionRuntime(env.NODE_ENV)) throw new Error(message);
  console.warn(`[env] ${message}`);
}

/**
 * Read through to `process.env` on every access rather than snapshotting it at
 * import time. A snapshot makes every module that touches ENV order-dependent:
 * tests could only configure it by exporting real secrets into the shell before
 * the process started, which is why the suite previously passed on one machine
 * and failed everywhere else.
 */
export const ENV = {
  get appId() { return process.env.VITE_APP_ID ?? ""; },
  get cookieSecret() { return process.env.JWT_SECRET ?? ""; },
  get databaseUrl() { return process.env.DATABASE_URL ?? ""; },
  get oAuthServerUrl() { return process.env.OAUTH_SERVER_URL ?? ""; },
  get ownerOpenId() { return process.env.OWNER_OPEN_ID ?? ""; },
  get isProduction() { return isProductionRuntime(process.env.NODE_ENV); },
  get forgeApiUrl() { return process.env.BUILT_IN_FORGE_API_URL ?? ""; },
  get forgeApiKey() { return process.env.BUILT_IN_FORGE_API_KEY ?? ""; },
  get postmarkServerToken() { return process.env.POSTMARK_SERVER_TOKEN ?? ""; },
  get postmarkFromEmail() { return process.env.POSTMARK_FROM_EMAIL ?? ""; },
  get priceApiToken() { return process.env.PRICE_API_TOKEN ?? ""; },
  /**
   * ADR-6: the MVP ships with manual price logging only. Automated PriceAPI
   * imports stay built but off, because `00-brief.md` excludes automated
   * polling from the MVP and PriceAPI bills per job with cost scaling as
   * watches x sources with no ceiling. Opt in explicitly, never by default.
   */
  get priceImportsEnabled() { return process.env.PRICE_IMPORTS_ENABLED === "true"; },
  get testAuthEnabled() { return process.env.DROPWATCH_TEST_AUTH_ENABLED === "true"; },
  get testAuthSecret() { return process.env.DROPWATCH_TEST_AUTH_SECRET ?? ""; },
};

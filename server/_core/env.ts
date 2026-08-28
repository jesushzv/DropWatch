export function isProductionRuntime(nodeEnv: string | undefined) {
  return nodeEnv !== "development";
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: isProductionRuntime(process.env.NODE_ENV),
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  postmarkServerToken: process.env.POSTMARK_SERVER_TOKEN ?? "",
  postmarkFromEmail: process.env.POSTMARK_FROM_EMAIL ?? "",
  priceApiToken: process.env.PRICE_API_TOKEN ?? "",
  testAuthEnabled: process.env.DROPWATCH_TEST_AUTH_ENABLED === "true",
  testAuthSecret: process.env.DROPWATCH_TEST_AUTH_SECRET ?? "",
};

import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sdk } from "./sdk";

const OUR_APP_ID = "dropwatch-app";
const SECRET = "test-jwt-secret-not-a-real-key";
const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.VITE_APP_ID = OUR_APP_ID;
  process.env.JWT_SECRET = SECRET;
});

afterEach(() => {
  process.env = { ...originalEnv };
});

/** Mints a session the way a sibling app sharing the signing secret would. */
async function signSession(payload: Record<string, unknown>, secret = SECRET) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
    .sign(new TextEncoder().encode(secret));
}

describe("session verification", () => {
  it("accepts a session minted for this app", async () => {
    const token = await signSession({ openId: "user-1", appId: OUR_APP_ID, name: "User" });

    await expect(sdk.verifySession(token)).resolves.toMatchObject({ openId: "user-1", appId: OUR_APP_ID });
  });

  it("rejects a validly signed session minted for a different app", async () => {
    // Same secret, same algorithm, correct shape — only the audience differs.
    // Without an appId check this token would authenticate here.
    const token = await signSession({ openId: "user-1", appId: "some-other-app", name: "User" });

    await expect(sdk.verifySession(token)).resolves.toBeNull();
  });

  it("rejects a session signed with a different secret", async () => {
    const token = await signSession({ openId: "user-1", appId: OUR_APP_ID, name: "User" }, "a-different-secret");

    await expect(sdk.verifySession(token)).resolves.toBeNull();
  });

  it("rejects a session missing required claims", async () => {
    const token = await signSession({ openId: "user-1", appId: OUR_APP_ID });

    await expect(sdk.verifySession(token)).resolves.toBeNull();
  });

  it("rejects an expired session", async () => {
    const token = await new SignJWT({ openId: "user-1", appId: OUR_APP_ID, name: "User" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(SECRET));

    await expect(sdk.verifySession(token)).resolves.toBeNull();
  });

  it("rejects a missing session", async () => {
    await expect(sdk.verifySession(undefined)).resolves.toBeNull();
    await expect(sdk.verifySession("")).resolves.toBeNull();
  });
});

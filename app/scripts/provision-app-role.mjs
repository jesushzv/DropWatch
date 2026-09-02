// Grants LOGIN and sets the password for the `dropwatch_app` role that the
// application connects as. The role itself (NOLOGIN) and its grants are created
// by drizzle/0001_rls_policies.sql; only the credential lives outside the
// migrations, so no secret is ever committed.
//
// Usage:
//   ADMIN_DATABASE_URL=postgres://postgres:...@host:5432/db \
//   APP_DB_PASSWORD=... \
//   node scripts/provision-app-role.mjs
import postgres from "postgres";

const adminUrl = process.env.ADMIN_DATABASE_URL;
const password = process.env.APP_DB_PASSWORD;

if (!adminUrl || !password) {
  console.error("ADMIN_DATABASE_URL and APP_DB_PASSWORD are required.");
  process.exit(1);
}

const sql = postgres(adminUrl, { max: 1, prepare: false });
try {
  // ALTER ROLE cannot take a bind parameter for the password; quote it as a
  // SQL string literal instead.
  const quoted = password.replace(/'/g, "''");
  await sql.unsafe(`ALTER ROLE "dropwatch_app" WITH LOGIN PASSWORD '${quoted}'`);
  console.log("dropwatch_app can now log in.");
} finally {
  await sql.end({ timeout: 5 });
}

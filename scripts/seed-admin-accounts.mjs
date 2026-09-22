/**
 * Seeds the two new admin accounts so they can pass the isolation gate.
 *
 *   DATABASE_URL="postgres://..." node scripts/seed-admin-accounts.mjs
 *
 * Creates (or repairs) a Better Auth user + credential account for each email,
 * marks the address verified — sign-in requires verification and nobody is
 * waiting on an inbox during a launch — and grants the admin role.
 *
 * The password hash is produced by Better Auth's own hasher, so the account is
 * indistinguishable from one created through the sign-up form and the normal
 * "forgot password" flow works on it unchanged.
 *
 * Idempotent: re-running repairs whatever is missing and never overwrites a
 * password that has already been changed.
 *
 * SECURITY: this sets a known, shared starter password. It is a stopgap for
 * getting two people through the gate today, not a way to run admin accounts.
 * Both holders should change it on first sign-in — see the note printed at the
 * end of the run.
 */
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { Pool } from "@neondatabase/serverless";

const STARTER_PASSWORD = "P@ssword!";

const ADMINS = [
  { email: "islam83.safiqul@gmail.com", name: "Safiqul Islam" },
  { email: "dasgupta.bitop@gmail.com", name: "Bitop Dasgupta" },
];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });

async function seed({ email, name }) {
  const lower = email.toLowerCase();

  const existing = await pool.query('SELECT "id", "emailVerified" FROM "user" WHERE lower("email") = $1', [lower]);
  let userId = existing.rows[0]?.id;

  if (!userId) {
    userId = randomUUID();
    await pool.query(
      'INSERT INTO "user" ("id", "name", "email", "emailVerified") VALUES ($1, $2, $3, TRUE)',
      [userId, name, lower],
    );
    console.log(`  created user        ${lower}`);
  } else {
    if (!existing.rows[0].emailVerified) {
      await pool.query('UPDATE "user" SET "emailVerified" = TRUE, "updatedAt" = now() WHERE "id" = $1', [userId]);
      console.log(`  marked verified     ${lower}`);
    } else {
      console.log(`  user exists         ${lower}`);
    }
  }

  // Credential account. If one already exists its password is left ALONE —
  // re-running must never reset a password the holder has since changed.
  const account = await pool.query(
    `SELECT "id", "password" FROM "account" WHERE "userId" = $1 AND "providerId" = 'credential'`,
    [userId],
  );

  if (account.rows.length === 0) {
    await pool.query(
      `INSERT INTO "account" ("id", "accountId", "providerId", "userId", "password")
       VALUES ($1, $2, 'credential', $3, $4)`,
      [randomUUID(), userId, userId, await hashPassword(STARTER_PASSWORD)],
    );
    console.log(`  set starter password`);
  } else if (!account.rows[0].password) {
    await pool.query('UPDATE "account" SET "password" = $1, "updatedAt" = now() WHERE "id" = $2', [
      await hashPassword(STARTER_PASSWORD),
      account.rows[0].id,
    ]);
    console.log(`  repaired empty password`);
  } else {
    console.log(`  password already set — left untouched`);
  }

  // Admin role. DO NOTHING so an existing role (including root) is not demoted.
  await pool.query(
    `INSERT INTO admin_roles ("email", "role", "invited_by")
     VALUES ($1, 'admin', 'seed-admin-accounts')
     ON CONFLICT ("email") DO NOTHING`,
    [lower],
  );
  console.log(`  admin role ensured`);
}

try {
  for (const admin of ADMINS) {
    console.log(`\n${admin.email}`);
    await seed(admin);
  }
  console.log(
    `\nDone. Both accounts can sign in with the starter password.\n` +
      `Tell them to change it immediately: Account → password, or "Forgot password" on the sign-in page.\n`,
  );
} catch (err) {
  console.error("\nSeeding failed:", err);
  process.exitCode = 1;
} finally {
  await pool.end();
}

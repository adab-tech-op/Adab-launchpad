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
import { Resend } from "resend";

const STARTER_PASSWORD = "P@ssword!";

const ADMINS = [
  { email: "islam83.safiqul@gmail.com", name: "Safiqul Islam" },
  { email: "dasgupta.bitop@gmail.com", name: "Bitop Dasgupta" },
];

// Sent from the site's own domain via the Resend account the app already uses,
// so the mail arrives as ADAB rather than from someone's personal inbox and
// lands with the domain's existing SPF/DKIM reputation.
const FROM = process.env.ADAB_FROM_EMAIL ?? "ADAB <info@adab.world>";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.adab.world").replace(/\/$/, "");
const SEND_EMAIL = process.env.SEND_INVITE_EMAIL !== "0";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const INK = "#1c1c1c";
const PAPER = "#faf6ef";
const BORDER = "#d9d2c4";
const MUTED = "#8a8a8a";

function accessEmailHtml(name) {
  return `
  <div style="background:${PAPER};padding:32px 0;font-family:Georgia,'Times New Roman',serif;color:${INK};">
    <div style="max-width:560px;margin:0 auto;padding:0 24px;">
      <div style="background:#fff;border:1px solid ${BORDER};border-radius:14px;padding:28px;font-size:15px;line-height:1.65;">
        <h1 style="margin:0 0 14px;font-size:24px;">Your ADAB access.</h1>
        <p style="margin:0 0 14px;">Hi ${name},</p>
        <p style="margin:0 0 14px;">
          The ADAB site is up, but closed to the public while we finish it. You'll need to sign in to see anything
          at all — including the storefront.
        </p>
        <p style="margin:0 0 6px;"><strong>Sign in:</strong> <a href="${SITE_URL}/signin" style="color:#003153;">${SITE_URL}/signin</a></p>
        <p style="margin:0 0 6px;"><strong>Email:</strong> this address</p>
        <p style="margin:0 0 18px;"><strong>Temporary password:</strong>
          <code style="background:${PAPER};border:1px solid ${BORDER};border-radius:4px;padding:2px 6px;">P@ssword!</code>
        </p>
        <p style="margin:0 0 18px;padding:12px 14px;background:${PAPER};border:1px solid ${BORDER};border-radius:8px;">
          <strong>Please change this as soon as you're in.</strong> It's a shared starter password, so treat it as
          already public. Go to <em>Account → password</em>, or use <em>Forgot password</em> on the sign-in page to
          set your own.
        </p>
        <p style="margin:0 0 14px;">
          Once signed in you'll land on the homepage with a short welcome note. The dashboard is at
          <a href="${SITE_URL}/studio" style="color:#003153;">${SITE_URL}/studio</a>.
        </p>
        <p style="margin:0;color:${MUTED};font-size:13px;">
          If the temporary password is rejected, you already have an account on this address — use
          <em>Forgot password</em> instead.
        </p>
      </div>
    </div>
  </div>`;
}

async function sendAccessEmail({ email, name }) {
  if (!SEND_EMAIL) return console.log("  email skipped (SEND_INVITE_EMAIL=0)");
  if (!resend) return console.log("  email SKIPPED — RESEND_API_KEY not set");
  try {
    const res = await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Your ADAB access",
      html: accessEmailHtml(name.split(" ")[0]),
    });
    if (res.error) console.log(`  email FAILED: ${res.error.message ?? "send error"}`);
    else console.log(`  access email sent from ${FROM}`);
  } catch (err) {
    console.log(`  email FAILED: ${String(err?.message ?? err)}`);
  }
}

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

  await sendAccessEmail({ email: lower, name });
}

try {
  for (const admin of ADMINS) {
    console.log(`\n${admin.email}`);
    await seed(admin);
  }
  console.log(
    `\nDone. Both accounts can sign in with the starter password, and the access\n` +
      `email has been sent from ${FROM} (unless skipped above).\n\n` +
      `The starter password is shared and now sits in an inbox — treat it as public\n` +
      `and chase both holders to change it on first sign-in.\n`,
  );
} catch (err) {
  console.error("\nSeeding failed:", err);
  process.exitCode = 1;
} finally {
  await pool.end();
}

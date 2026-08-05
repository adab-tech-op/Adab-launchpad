import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "@neondatabase/serverless";
import { sql } from "@/lib/db";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";

// Self-hosted Better Auth. Its tables (user/session/account/verification) live in
// the same Neon database as the app data — no separate managed auth service.
export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ to: user.email, url, name: user.name });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({ to: user.email, url, name: user.name });
    },
  },

  // Deferred account creation: the moment ANY account is created for an email
  // (post-payment "secure your reservation" CTA, or an organic signup), claim
  // every past guest reservation carrying that email. This is the single point
  // that turns email-matched guest orders into truly account-owned ones — no
  // ghost/passwordless users, no checkout-time auth friction. Best-effort:
  // a failure here must never break signup, so it's swallowed and logged.
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await sql`
              UPDATE reservations
              SET user_id = ${user.id}
              WHERE user_id IS NULL AND lower(email) = lower(${user.email})
            `;
          } catch (err) {
            console.error("[auth] order-claim hook failed for", user.email, err);
          }
        },
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  plugins: [nextCookies()],
});

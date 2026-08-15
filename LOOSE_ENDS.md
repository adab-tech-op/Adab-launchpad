# ADAB — Loose Ends

Known-temporary or deferred items, tracked so nothing gets lost.

## Payments
- **Manual bKash flow is a bridge.** Customers pay via bKash and submit their
  paying number + TrxID; admin verifies manually in `/studio`. Replace with an
  automated gateway once the **bKash merchant account is approved** — either
  bKash PGW or an aggregator (SSLCOMMERZ / aamarPay / ShurjoPay). The payment
  step is intentionally abstracted so this swap is contained.
- Manual flow can't cryptographically prove payment — verification stays manual
  ("verify before fulfill"). TrxID uniqueness + amount matching reduce misuse.

## Cart
- **Active.** Products have Add-to-Cart alongside Reserve; both route through the
  unified `/checkout` → `/pay/[ref]` manual bKash flow.

## Email
- Sending domain must be **verified in Resend** and `ADAB_FROM_EMAIL` set to an
  address on it, or transactional email won't deliver. (Rehearsed on adab.world;
  redo on the real domain.)
- **Drop email flow (order-lifecycle):** reserve is now SILENT — no email on
  reserve (avoids promising a held piece in a limited drop). First & only auto
  email fires at payment submission ("payment details received", carries the
  set-a-password CTA). Then admin-triggered: guarded once-only "payment
  confirmed", and repeatable follow-ups (shipped / thank-you / custom).
- **Marketing:** broadcast sends to the `/studio/notify` list MUST carry an
  unsubscribe link (writes to `marketing_unsubscribes`). Not yet wired into an
  actual broadcast sender — the list + CSV export exist; the send mechanism
  (Resend broadcast/audience) is still to build. Transactional emails never use
  this list.

## Catalog
- Cloudinary uploads are **unsigned** (anyone with cloud name + preset could upload). Fine for an admin tool at this stage; tighten to **signed** uploads (server-generated signature) when needed.
- Products are **DB-backed** (`products` table via `src/lib/products.ts`) with a
  static fallback to `src/data/products.ts` if the table is empty/unreachable.
  `/studio` products are create/edit/delete.

## Storefront polish
- Shop filters + search are currently decorative — wire them up.
- Coming-soon products: wire the "notify me" capture.
- Optional micro-animations still open: reserve/add → checkmark, wishlist-tile
  fade-out, size-chip select scale.

## Assets
- Clean logo + favicon pending. Hero image carries a Gemini watermark to replace.

## Admin roles / RBAC (next branch — Plan 2)
Deferred to its own branch (`admin-rbac`), to be cut from `main` after this
order-lifecycle work merges. Scope: three roles (root / admin / moderator)
enforced in every server action (replaces the `ADMIN_EMAILS` env allowlist,
seeded with one bootstrap root); an append-only **audit log** (admins/mods can't
read it, root can) — the `order_state.confirmed_by` written here is its first
row; **presence** (who's online, derived from Better Auth session activity);
email **invitations** (root invites, single-use expiring token → accept →
onboarded with role baked in) + revocation + a "can't remove the last root"
guard. Open decisions: which email is the seeded first root; whether moderators
see full customer PII + TrxIDs or a redacted view.

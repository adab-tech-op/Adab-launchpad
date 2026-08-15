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

## Admin roles / RBAC (branch `admin-rbac` — built, stacked on order-lifecycle)
Built and pushed to `admin-rbac`, which is **stacked on `order-lifecycle`** (cut
from it, not from main, because the audit log builds on order-lifecycle's
`confirmed_by`). Merge order-lifecycle first, then this.

Scope delivered: three roles (root / admin / moderator) in `src/lib/roles.ts`,
enforced in every mutating server action (order actions + product actions now
require root/admin; moderators are view-only). Role resolution is table-first
(`admin_roles`) with an env FALLBACK — `ROOT_ADMIN_EMAIL` → root, `ADMIN_EMAILS`
→ admin — so existing admins keep access and the first root can't be locked out.
Append-only `audit_log` (root-only `/studio/activity`); presence + roster on the
root-only `/studio/team` (online = active session in last 5 min, from Better Auth
sessions); email invitations (root invites → single-use, 72h token → `/invite/accept`
→ role written on acceptance) with revoke, role-change, remove, and a
"can't remove/demote the last root" guard. Moderators get a REDACTED orders view
(no customer email/phone/address, no TrxID/bKash number) and don't see the notify
list. `/pay` signin/signup now honour a sanitized `?next=` so the invite round-trip
returns the invitee to accept.

GO-LIVE for this branch: (1) set `ROOT_ADMIN_EMAIL` in Vercel (which email is the
seeded root); (2) run `db/admin-rbac.sql` in Neon; (3) merge — after order-lifecycle.
DECIDED-BY-DEFAULT (flip if wanted): moderators see a redacted view (change the
`canSeePII` threshold in roles.ts); root seed comes from `ROOT_ADMIN_EMAIL` env.

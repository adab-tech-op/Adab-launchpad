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
- **Kept, not removed.** In drop mode products use *Reserve*, not *Add to Cart*,
  so the cart is currently dormant (behind the `dropModeActive` flag in
  `product-client.tsx`). Re-enable add-to-cart + multi-item checkout when moving
  to a standing store.

## Email
- Using Resend's shared `onboarding@resend.dev` sender → only delivers to the
  Resend account owner. **Verify a sending domain** before launch so customer
  emails (verification, payment received) reach everyone.

## Catalog
- Products live in code (`src/data/products.ts`); `/studio` products view is
  read-only. Move to DB-backed products when the catalog grows.

## Storefront polish
- Shop filters + search are currently decorative — wire them up.
- Coming-soon products: wire the "notify me" capture.
- Optional micro-animations still open: reserve/add → checkmark, wishlist-tile
  fade-out, size-chip select scale.

## Assets
- Clean logo + favicon pending. Hero image carries a Gemini watermark to replace.

import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { getOrdersByEmail, getWishlistSlugs, getProfile } from "@/lib/queries";
import { StatusBadge } from "@/components/site/StatusBadge";

export const metadata = { title: "Your Account — ADAB" };

export default async function AccountOverview() {
  const user = await requireUser();
  const [orders, wishlist, profile] = await Promise.all([
    getOrdersByEmail(user.email),
    getWishlistSlugs(user.id),
    getProfile(user.id),
  ]);
  const latest = orders[0];
  const hasAddress = Boolean(profile.address_line && profile.city);

  return (
    <div>
      <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">Overview</p>
      <h1 className="mt-3 font-editorial text-4xl">Hello, {user.name}.</h1>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border p-6 paper-grain">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Latest order</p>
          {latest ? (
            <>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="font-display tracking-[0.12em] text-primary">{latest.orderRef}</span>
                <StatusBadge status={latest.status} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {latest.items.length} item{latest.items.length > 1 ? "s" : ""} · ৳ {latest.total.toLocaleString()}
              </p>
              <Link href="/account/orders" className="mt-4 inline-block text-xs uppercase tracking-[0.16em] underline underline-offset-4">
                View orders →
              </Link>
            </>
          ) : (
            <p className="mt-3 font-editorial text-xl italic text-muted-foreground">Nothing here yet. It just waits.</p>
          )}
        </div>

        <div className="rounded-2xl border border-border p-6 paper-grain">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Wishlist</p>
          <p className="mt-3 font-editorial text-3xl">{wishlist.length}</p>
          <p className="text-sm text-muted-foreground">saved piece{wishlist.length === 1 ? "" : "s"}</p>
          <Link href="/account/wishlist" className="mt-4 inline-block text-xs uppercase tracking-[0.16em] underline underline-offset-4">
            View wishlist →
          </Link>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Profile</p>
            <p className="mt-2 text-sm text-foreground">
              {hasAddress ? "Delivery details saved." : "Add your size and delivery address for faster checkout."}
            </p>
          </div>
          <Link href="/account/profile" className="shrink-0 text-xs uppercase tracking-[0.16em] underline underline-offset-4">
            {hasAddress ? "Edit" : "Complete"} →
          </Link>
        </div>
      </div>
    </div>
  );
}

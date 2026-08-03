import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { getOrdersByEmail } from "@/lib/queries";
import { StatusBadge } from "@/components/site/StatusBadge";

export const metadata = { title: "Your Orders — ADAB" };

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await getOrdersByEmail(user.email);

  return (
    <div>
      <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">Orders</p>
      <h1 className="mt-3 font-editorial text-4xl">Your orders.</h1>

      {orders.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-border p-12 text-center paper-grain">
          <p className="font-editorial text-2xl italic text-muted-foreground">Nothing here yet. It just waits.</p>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] text-background"
          >
            Browse the Drop
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {orders.map((o) => (
            <Link
              key={o.orderRef}
              href={`/account/orders/${o.orderRef}`}
              className="group block cursor-pointer rounded-2xl border border-border p-6 transition-colors hover:border-primary hover:bg-primary"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 group-hover:border-white/20">
                <div>
                  <span className="font-display tracking-[0.12em] text-primary group-hover:text-white">{o.orderRef}</span>
                  <p className="mt-1 text-xs text-muted-foreground group-hover:text-white/70">
                    {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <ul className="mt-4 space-y-3">
                {o.items.map((it, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 text-sm group-hover:text-white">
                    <span>
                      {it.name}
                      <span className="text-muted-foreground group-hover:text-white/70"> · {it.size} · ×{it.quantity}</span>
                    </span>
                    <span className="tabular-nums text-muted-foreground group-hover:text-white/70">{it.price}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm group-hover:border-white/20">
                <span className="text-muted-foreground group-hover:text-white/70">Total</span>
                <span className="tabular-nums group-hover:text-white">৳ {o.total.toLocaleString()}</span>
              </div>
            </Link>
          ))}
          <p className="pt-2 text-xs text-muted-foreground">
            Reservations are confirmed over a call or WhatsApp. Status updates as we process each order.
          </p>
        </div>
      )}
    </div>
  );
}

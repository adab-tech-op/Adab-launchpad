import Link from "next/link";
import { getStudioStats, getAllOrders } from "@/lib/studio";
import { formatPrice } from "@/lib/pricing";

export const metadata = { title: "Overview — ADAB Studio" };

export default async function StudioOverview() {
  const [stats, orders] = await Promise.all([getStudioStats(), getAllOrders()]);
  const recent = orders.slice(0, 6);

  const cards = [
    { label: "Awaiting verification", value: stats.toVerify, href: "/studio/orders", accent: stats.toVerify > 0 },
    { label: "Orders", value: stats.orders, href: "/studio/orders" },
    { label: "Unread messages", value: stats.messages, href: "/studio/inbox", accent: stats.messages > 0 },
    { label: "Notify list", value: stats.waitlist, href: "/studio/notify" },
  ];

  const actions = [
    { label: "New product", href: "/studio/products/new" },
    { label: "Orders", href: "/studio/orders" },
    { label: "Edit content", href: "/studio/content" },
    { label: "Send broadcast", href: "/studio/broadcast" },
  ];

  const needsAttention = stats.toVerify > 0 || stats.messages > 0;

  return (
    <div>
      <h1 className="font-editorial text-4xl">Overview.</h1>

      {needsAttention && (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <p className="text-xs uppercase tracking-[0.06em] text-primary">Needs attention</p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {stats.toVerify > 0 && (
              <Link href="/studio/orders" className="text-foreground hover:text-primary">
                {stats.toVerify} payment{stats.toVerify > 1 ? "s" : ""} to verify →
              </Link>
            )}
            {stats.messages > 0 && (
              <Link href="/studio/inbox" className="text-foreground hover:text-primary">
                {stats.messages} unread message{stats.messages > 1 ? "s" : ""} →
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`rounded-2xl border p-6 transition-colors hover:border-foreground ${c.accent ? "border-primary/40 bg-primary/5" : "border-border paper-grain"}`}
          >
            <p className="text-xs uppercase tracking-[0.06em] text-muted-foreground">{c.label}</p>
            <p className="mt-3 font-editorial text-4xl tabular-nums">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="rounded-full border border-border px-4 py-2 text-xs uppercase tracking-[0.05em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            {a.label}
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.06em] text-muted-foreground">Recent orders</p>
          <Link href="/studio/orders" className="text-xs text-muted-foreground hover:text-foreground">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-border rounded-2xl border border-border">
            {recent.map((o) => (
              <Link key={o.orderRef} href={`/studio/orders`} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[color:var(--paper)]">
                <div className="min-w-0">
                  <p className="truncate font-medium">{o.name || "—"}</p>
                  <p className="truncate text-xs text-muted-foreground">{o.orderRef} · {o.items.map((i) => i.name).join(", ")}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm tabular-nums">{formatPrice(o.total)}</p>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{o.status}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

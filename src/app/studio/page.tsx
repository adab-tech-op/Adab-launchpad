import Link from "next/link";
import { getStudioStats } from "@/lib/studio";

export default async function StudioOverview() {
  const stats = await getStudioStats();
  const cards = [
    { label: "Orders", value: stats.orders, href: "/studio/orders" },
    { label: "Pending", value: stats.pending, href: "/studio/orders" },
    { label: "Waitlist", value: stats.waitlist, href: "/studio/inbox" },
    { label: "Messages", value: stats.messages, href: "/studio/inbox" },
  ];
  return (
    <div>
      <h1 className="font-editorial text-4xl">Overview.</h1>
      <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-2xl border border-border p-6 paper-grain hover:border-foreground transition-colors">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{c.label}</p>
            <p className="mt-3 font-editorial text-4xl tabular-nums">{c.value}</p>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        {stats.pending > 0
          ? `${stats.pending} order${stats.pending > 1 ? "s" : ""} awaiting confirmation.`
          : "No pending orders. All caught up."}
      </p>
    </div>
  );
}

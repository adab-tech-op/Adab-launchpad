import type { OrderEvent } from "@/lib/studio";

const STATUS_WORDS: Record<string, string> = {
  pending: "awaiting payment",
  submitted: "payment submitted",
  paid: "paid",
  not_received: "payment not received",
  not_delivered: "not delivered",
  shipped: "shipped",
  delivered: "delivered",
};

const word = (v: unknown) => STATUS_WORDS[String(v)] ?? String(v).replace(/_/g, " ");

/** One line per event, in the words someone would use out loud. */
function describe(e: OrderEvent): string {
  const to = e.detail?.to;
  switch (e.action) {
    case "order.payment_status":
      return `Payment set to ${word(to)}`;
    case "order.delivery_status":
      return `Delivery set to ${word(to)}`;
    case "order.payment_confirmed":
      return "Confirmation emailed to the customer";
    case "order.follow_up":
      return `Follow-up sent${e.detail?.kind ? ` (${String(e.detail.kind)})` : ""}`;
    default:
      return e.action.replace("order.", "").replace(/[._]/g, " ");
  }
}

function when(ts: string): string {
  return new Date(ts).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * The order's own history, built from audit rows that already existed and were
 * only readable on another page.
 *
 * The payment submission is included from the order itself rather than the log,
 * because the customer submits it and no admin action records it — leaving it
 * out would make the history start mid-story.
 */
export function OrderHistory({
  events,
  submittedAt,
}: {
  events: OrderEvent[];
  submittedAt: string | null;
}) {
  const lines = [
    ...(submittedAt ? [{ at: submittedAt, text: "Customer submitted their payment", actor: null as string | null }] : []),
    ...events.map((e) => ({ at: e.at, text: describe(e), actor: e.actor })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  if (lines.length === 0) return null;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground">What has happened</p>
      <ul className="mt-2 space-y-1.5">
        {lines.map((l, i) => (
          <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-xs">
            <span className="tabular-nums text-muted-foreground">{when(l.at)}</span>
            <span>{l.text}</span>
            {l.actor && <span className="text-muted-foreground">by {l.actor.split("@")[0]}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

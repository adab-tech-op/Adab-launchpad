import { requireRootPage, getAuditLog } from "@/lib/roles";

export const metadata = { title: "Activity — ADAB Studio" };

// Human labels for the action keys written by recordAudit across the app.
const ACTION_LABEL: Record<string, string> = {
  "order.payment_status": "set payment status",
  "order.delivery_status": "set delivery status",
  "order.cancel": "cancelled order",
  "order.restore": "restored order",
  "order.payment_confirmed": "sent payment confirmation",
  "order.follow_up": "sent follow-up",
  "product.create": "created product",
  "product.update": "updated product",
  "product.delete": "deleted product",
  "team.invite": "invited",
  "team.invite_revoke": "revoked invitation for",
  "team.invite_accept": "accepted invitation",
  "team.role_change": "changed role of",
  "team.remove": "removed member",
  "data.purge_orders": "cleared all orders",
  "data.purge_messages_signups": "cleared inbox & signups",
  "data.delete_customers": "deleted customer accounts",
  "announcement.update": "updated the announcement",
  "content.update": "edited page content",
};

function detailText(detail: Record<string, unknown> | null): string {
  if (!detail) return "";
  const parts: string[] = [];
  if ("from" in detail && "to" in detail) parts.push(`${detail.from} → ${detail.to}`);
  else {
    for (const [k, v] of Object.entries(detail)) parts.push(`${k}: ${v}`);
  }
  return parts.join(" · ");
}

export default async function ActivityPage() {
  await requireRootPage();
  const entries = await getAuditLog(300);

  return (
    <div>
      <h1 className="font-editorial text-4xl">Activity.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Every change made in the studio — who did what, and when. Append-only; visible to root admins.
      </p>

      {entries.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border p-12 text-center paper-grain">
          <p className="font-editorial text-2xl italic text-muted-foreground">No activity recorded yet.</p>
        </div>
      ) : (
        <ol className="mt-8 space-y-1">
          {entries.map((e, i) => (
            <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg px-3 py-2.5 text-sm odd:bg-muted/20">
              <span className="text-muted-foreground tabular-nums text-xs">
                {new Date(e.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="font-medium break-all">{e.actorEmail}</span>
              <span className="text-muted-foreground">{ACTION_LABEL[e.action] ?? e.action}</span>
              {e.target && <span className="font-display tracking-[0.08em] text-primary break-all">{e.target}</span>}
              {detailText(e.detail) && <span className="text-xs text-muted-foreground">({detailText(e.detail)})</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

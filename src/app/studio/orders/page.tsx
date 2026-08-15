import Link from "next/link";
import { User, Package, Wallet, Smartphone, Hash, Clock, ShieldCheck } from "lucide-react";
import { getAllOrders } from "@/lib/studio";
import { requireStudioAccess, canSeePII, atLeast } from "@/lib/roles";
import { PAYMENT_LABELS, DELIVERY_LABELS, PAYMENT_PILL, DELIVERY_PILL } from "@/lib/order-status";
import { StatusControl } from "./status-control";
import { ConfirmPaymentButton } from "./confirm-dialog";
import { FollowUpButton } from "./follow-up-dialog";

/** Mask an email/phone for the moderator (view-only, redacted) view. */
function mask(value: string): string {
  if (value.includes("@")) {
    const [u, d] = value.split("@");
    return `${u.slice(0, 2)}${"•".repeat(Math.max(1, u.length - 2))}@${d}`;
  }
  return value.length <= 4 ? "••••" : `${"•".repeat(value.length - 3)}${value.slice(-3)}`;
}

export const metadata = { title: "Orders — ADAB Studio" };

const PILLS = [
  { key: "payment_submitted", label: "To verify" },
  { key: "pending", label: "Awaiting payment" },
  { key: "paid", label: "Paid" },
  { key: "delivered", label: "Delivered" },
  { key: "payment_not_received", label: "Not received" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
];

export default async function StudioOrders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = status ?? "payment_submitted"; // default to the actionable queue

  const actor = await requireStudioAccess();
  const canMutate = atLeast(actor.role, "admin"); // moderators are view-only
  const pii = canSeePII(actor.role);

  const orders = await getAllOrders();

  const countFor = (key: string) =>
    key === "all" ? orders.length : orders.filter((o) => o.status === key).length;

  const filtered = active === "all" ? orders : orders.filter((o) => o.status === active);

  return (
    <div>
      <h1 className="font-editorial text-4xl">Orders.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Verify a payment against your bKash statement, then set the status — customers see it on their account.
      </p>

      {/* Filter pills */}
      <div className="mt-6 flex flex-wrap gap-2">
        {PILLS.filter((p) => p.key === "all" || p.key === "payment_submitted" || countFor(p.key) > 0).map((p) => {
          const isActive = p.key === active;
          const n = countFor(p.key);
          return (
            <Link
              key={p.key}
              href={`/studio/orders?status=${p.key}`}
              className={`rounded-full border px-3.5 py-1.5 text-xs uppercase tracking-[0.12em] transition-colors ${
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {p.label} <span className="tabular-nums opacity-70">{n}</span>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border p-12 text-center paper-grain">
          <p className="font-editorial text-2xl italic text-muted-foreground">
            {active === "payment_submitted" ? "No payments awaiting verification." : "Nothing here."}
          </p>
          {active !== "all" && (
            <Link href="/studio/orders?status=all" className="mt-5 inline-block text-xs uppercase tracking-[0.16em] underline underline-offset-4">
              View all orders →
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {filtered.map((o) => (
            <div key={o.orderRef} className="rounded-2xl border border-border p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
                <div className="min-w-0">
                  <span className="font-display tracking-[0.12em] text-primary">{o.orderRef}</span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {canMutate ? (
                  <StatusControl orderRef={o.orderRef} axes={o.axes} />
                ) : (
                  <div className="flex flex-col items-end gap-1.5">
                    {o.axes.cancelled && (
                      <span className="rounded-full bg-destructive/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-destructive">Cancelled</span>
                    )}
                    <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${PAYMENT_PILL[o.axes.payment]}`}>
                      {PAYMENT_LABELS[o.axes.payment]}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${DELIVERY_PILL[o.axes.delivery]}`}>
                      {DELIVERY_LABELS[o.axes.delivery]}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-muted-foreground"><User className="h-3.5 w-3.5" strokeWidth={1.75} /> Customer</p>
                  <p className="mt-1">{o.name}</p>
                  <p className="text-muted-foreground break-all">{pii ? o.email : mask(o.email)}</p>
                  <p className="text-muted-foreground">{pii ? o.phone : mask(o.phone)}</p>
                  {o.deliveryAddress && <p className="mt-1 text-muted-foreground">{pii ? o.deliveryAddress : "•••• (hidden)"}</p>}
                  {o.notes && <p className="mt-1 text-xs text-muted-foreground italic">Note: {o.notes}</p>}
                </div>
                <div>
                  <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-muted-foreground"><Package className="h-3.5 w-3.5" strokeWidth={1.75} /> Items</p>
                  <ul className="mt-1 space-y-1">
                    {o.items.map((it, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span>{it.name} <span className="text-muted-foreground">· {it.size} · ×{it.quantity}</span></span>
                        <span className="tabular-nums text-muted-foreground">{it.price}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 flex justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground">Total</span>
                    <span className="tabular-nums">৳ {o.total.toLocaleString()}</span>
                  </p>
                </div>
              </div>

              {o.payment ? (
                <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
                  <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-primary"><ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} /> Payment to verify</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
                    <div>
                      <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground"><Wallet className="h-3 w-3" /> Expected</p>
                      <p className="tabular-nums">৳ {(o.payment.amount ?? o.total).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground"><Smartphone className="h-3 w-3" /> Paid from</p>
                      <p className="tabular-nums">{pii ? o.payment.bkashNumber : mask(o.payment.bkashNumber)}</p>
                    </div>
                    <div>
                      <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground"><Hash className="h-3 w-3" /> TrxID</p>
                      <p className="font-medium">{pii ? o.payment.trxId : mask(o.payment.trxId)}</p>
                    </div>
                    <div>
                      <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground"><Clock className="h-3 w-3" /> Submitted</p>
                      <p className="text-muted-foreground">
                        {new Date(o.payment.submittedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground italic">No payment submitted yet.</p>
              )}

              {/* Actions — mutators only, once payment is verified as paid (and not cancelled) */}
              {canMutate && o.axes.payment === "paid" && !o.axes.cancelled && (
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                  <ConfirmPaymentButton
                    orderRef={o.orderRef}
                    amount={o.payment?.amount ?? o.total}
                    trxId={o.payment?.trxId ?? null}
                    bkashNumber={o.payment?.bkashNumber ?? null}
                    sentAt={o.confirmationSentAt}
                    confirmedBy={o.confirmedBy}
                  />
                  <FollowUpButton orderRef={o.orderRef} followUps={o.followUps} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

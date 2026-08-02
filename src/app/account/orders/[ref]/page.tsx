import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getOrderByRef } from "@/lib/queries";
import { StatusBadge } from "@/components/site/StatusBadge";

export const metadata = { title: "Order — ADAB" };

const STATUS_MESSAGE: Record<string, string> = {
  pending: "Awaiting payment. Complete your bKash payment to secure your pieces.",
  payment_submitted: "Payment submitted. We're verifying it against bKash and will confirm within 24 hours.",
  paid: "Payment verified. We'll be in touch about delivery.",
  payment_not_received: "We couldn't match your payment yet. Please resubmit your bKash details.",
  delivered: "Delivered. Thank you for choosing ADAB.",
  cancelled: "This order was cancelled.",
};

export default async function OrderDetailPage({ params }: { params: Promise<{ ref: string }> }) {
  const user = await requireUser();
  const { ref } = await params;
  const order = await getOrderByRef(ref);

  // Only the owner (matched by email) may view an order.
  if (!order || order.email.toLowerCase() !== user.email.toLowerCase()) notFound();

  const canPay = order.status === "pending" || order.status === "payment_not_received";

  return (
    <div>
      <Link href="/account/orders" className="text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
        ← All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">Order</p>
          <h1 className="mt-2 font-editorial text-4xl tracking-[0.04em]">{order.orderRef}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Placed {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Status message */}
      <div className="mt-6 rounded-2xl border border-border p-5 paper-grain">
        <p className="text-sm leading-relaxed">{STATUS_MESSAGE[order.status] ?? ""}</p>
        {canPay && (
          <Link
            href={`/pay/${order.orderRef}`}
            className="mt-4 inline-block rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] text-background"
          >
            {order.status === "payment_not_received" ? "Resubmit payment" : "Complete payment"}
          </Link>
        )}
      </div>

      {/* Items */}
      <div className="mt-6 rounded-2xl border border-border p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Items</p>
        <ul className="mt-3 space-y-3">
          {order.items.map((it, i) => (
            <li key={i} className="flex items-center justify-between gap-3 text-sm">
              <span>
                {it.name}
                <span className="text-muted-foreground"> · {it.size} · ×{it.quantity}</span>
              </span>
              <span className="tabular-nums text-muted-foreground">{it.price}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="tabular-nums">৳ {order.total.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment */}
      {order.payment && (
        <div className="mt-6 rounded-2xl border border-border p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Payment</p>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">TrxID</p>
              <p className="font-medium">{order.payment.trxId}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Paid from</p>
              <p className="tabular-nums">{order.payment.bkashNumber}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Submitted</p>
              <p className="text-muted-foreground">
                {new Date(order.payment.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

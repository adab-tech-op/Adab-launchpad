import { getAllOrders } from "@/lib/studio";
import { StatusControl } from "./status-control";

export default async function StudioOrders() {
  const orders = await getAllOrders();
  return (
    <div>
      <h1 className="font-editorial text-4xl">Orders.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {orders.length} order{orders.length === 1 ? "" : "s"}. Change status to move an order through fulfillment — customers see this on their account.
      </p>

      {orders.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-border p-12 text-center font-editorial text-2xl italic text-muted-foreground">
          No orders yet.
        </p>
      ) : (
        <div className="mt-10 space-y-4">
          {orders.map((o) => (
            <div key={o.orderRef} className="rounded-2xl border border-border p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
                <div className="min-w-0">
                  <span className="font-display tracking-[0.12em] text-primary">{o.orderRef}</span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <StatusControl orderRef={o.orderRef} status={o.status} />
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Customer</p>
                  <p className="mt-1">{o.name}</p>
                  <p className="text-muted-foreground break-all">{o.email}</p>
                  <p className="text-muted-foreground">{o.phone}</p>
                  {o.deliveryAddress && <p className="mt-1 text-muted-foreground">{o.deliveryAddress}</p>}
                  {o.notes && <p className="mt-1 text-xs text-muted-foreground italic">Note: {o.notes}</p>}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Items</p>
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
                  <p className="text-xs uppercase tracking-[0.16em] text-primary">Payment to verify</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Expected</p>
                      <p className="tabular-nums">৳ {(o.payment.amount ?? o.total).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Paid from</p>
                      <p className="tabular-nums">{o.payment.bkashNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">TrxID</p>
                      <p className="font-medium">{o.payment.trxId}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Submitted</p>
                      <p className="text-muted-foreground">
                        {new Date(o.payment.submittedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground italic">No payment submitted yet.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

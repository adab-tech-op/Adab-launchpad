const STYLES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  payment_submitted: "bg-[color:var(--steel)]/15 text-[color:var(--steel)]",
  paid: "bg-primary/10 text-primary",
  payment_not_received: "bg-destructive/10 text-destructive",
  delivered: "bg-emerald-600/12 text-emerald-700",
  cancelled: "bg-destructive/10 text-destructive",
};

const LABELS: Record<string, string> = {
  pending: "awaiting payment",
  payment_submitted: "payment submitted",
  paid: "paid",
  payment_not_received: "payment not received",
  delivered: "delivered",
  cancelled: "cancelled",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STYLES[status] ?? STYLES.pending;
  const label = LABELS[status] ?? status.replace(/_/g, " ");
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${cls}`}>
      {label}
    </span>
  );
}

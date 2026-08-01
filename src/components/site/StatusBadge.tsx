const STYLES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-[color:var(--steel)]/15 text-[color:var(--steel)]",
  paid: "bg-primary/10 text-primary",
  shipped: "bg-primary/15 text-primary",
  delivered: "bg-emerald-600/12 text-emerald-700",
  cancelled: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STYLES[status] ?? STYLES.pending;
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${cls}`}>
      {status}
    </span>
  );
}

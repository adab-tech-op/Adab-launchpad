"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { purgeOrders, purgeMessagesAndSignups, deleteCustomerAccounts } from "@/lib/actions/danger";
import type { PurgeCounts } from "@/lib/studio";

type Action = (confirm: string) => Promise<{ ok: boolean; message?: string; error?: string }>;

function DangerCard({
  title,
  description,
  buttonLabel,
  action,
  count,
  countNoun,
  warning,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  action: Action;
  /** How much this would delete. Null when the count could not be read. */
  count?: number | null;
  countNoun?: string;
  /** The consequence people do not expect, said plainly. */
  warning?: string;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      const res = await action(confirm);
      if (!res.ok) {
        toast.error(res.error ?? "Failed.");
        return;
      }
      toast.success(res.message ?? "Done.");
      setConfirm("");
      router.refresh();
    });

  const armed = confirm.trim() === "DELETE";

  return (
    <div className="rounded-2xl border border-destructive/30 p-5">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {count !== undefined && (
          <div className="shrink-0 text-right">
            {/* The description said what would go, never how much. The only way
                to learn the blast radius was to run it. */}
            <p className="text-2xl leading-none tabular-nums">{count ?? "—"}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{countNoun}</p>
          </div>
        )}
      </div>
      {warning && (
        <p className="mt-3 rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
          {warning}
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Type DELETE to confirm"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-destructive"
        />
        <button
          type="button"
          onClick={run}
          disabled={!armed || pending}
          className="rounded-full bg-destructive px-5 py-2 text-xs uppercase tracking-[0.06em] text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Working…" : buttonLabel}
        </button>
      </div>
    </div>
  );
}

export function DangerZone({ counts }: { counts: PurgeCounts }) {
  return (
    <div className="space-y-4">
      <DangerCard
        title="Clear all orders"
        description="Permanently deletes every reservation, payment record, order status, and follow-up log. Use this to wipe test orders before launch. Cannot be undone."
        buttonLabel="Clear orders"
        action={purgeOrders}
        count={counts.orders}
        countNoun="reservations"
      />
      <DangerCard
        title="Clear inbox & marketing signups"
        description="Permanently deletes all contact messages, newsletter/waitlist signups, and unsubscribe records. Cannot be undone."
        buttonLabel="Clear messages"
        action={purgeMessagesAndSignups}
        count={counts.messages}
        countNoun="records"
        warning="This also removes unsubscribe records, so anyone who opted out could be emailed again. That is the part of this action people do not expect."
      />
      <DangerCard
        title="Delete all customer accounts"
        description="Permanently deletes every customer account and its wishlist and profile. Studio members (root / admin / moderator) are kept. Any orders those customers placed are turned back into guest orders, not deleted — clear orders separately if you want them gone. Cannot be undone."
        buttonLabel="Delete customers"
        action={deleteCustomerAccounts}
        count={counts.customers}
        countNoun="accounts"
      />
    </div>
  );
}

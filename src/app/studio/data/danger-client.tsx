"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { purgeOrders, purgeMessagesAndSignups, deleteCustomerAccounts } from "@/lib/actions/danger";

type Action = (confirm: string) => Promise<{ ok: boolean; message?: string; error?: string }>;

function DangerCard({ title, description, buttonLabel, action }: { title: string; description: string; buttonLabel: string; action: Action }) {
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
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
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
          className="rounded-full bg-destructive px-5 py-2 text-xs uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Working…" : buttonLabel}
        </button>
      </div>
    </div>
  );
}

export function DangerZone() {
  return (
    <div className="space-y-4">
      <DangerCard
        title="Clear all orders"
        description="Permanently deletes every reservation, payment record, order status, and follow-up log. Use this to wipe test orders before launch. Cannot be undone."
        buttonLabel="Clear orders"
        action={purgeOrders}
      />
      <DangerCard
        title="Clear inbox & marketing signups"
        description="Permanently deletes all contact messages, newsletter/waitlist signups, and unsubscribe records. Cannot be undone."
        buttonLabel="Clear messages"
        action={purgeMessagesAndSignups}
      />
      <DangerCard
        title="Delete all customer accounts"
        description="Permanently deletes every customer account and its wishlist and profile. Studio members (root / admin / moderator) are kept. Any orders those customers placed are turned back into guest orders, not deleted — clear orders separately if you want them gone. Cannot be undone."
        buttonLabel="Delete customers"
        action={deleteCustomerAccounts}
      />
    </div>
  );
}

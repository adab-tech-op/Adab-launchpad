"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { acceptInvitation } from "@/lib/actions/team";

export function AcceptClient({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const accept = () =>
    startTransition(async () => {
      const res = await acceptInvitation(token);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setDone(true);
      toast.success("Access activated");
      setTimeout(() => router.push("/studio"), 900);
    });

  if (done) {
    return <p className="mt-6 text-sm text-emerald-700">You&rsquo;re in. Taking you to the studio…</p>;
  }

  return (
    <button
      type="button"
      onClick={accept}
      disabled={pending}
      className="mt-6 rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] text-background disabled:opacity-50"
    >
      {pending ? "Activating…" : "Accept invitation"}
    </button>
  );
}

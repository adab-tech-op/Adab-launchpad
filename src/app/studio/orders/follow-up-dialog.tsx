"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { ModalShell } from "@/components/site/ModalShell";
import { sendOrderFollowUp } from "@/lib/actions/admin";
import type { OrderFollowUp } from "@/lib/studio";

type Template = "shipped" | "thank_you" | "custom";

const TEMPLATE_LABELS: Record<Template, string> = {
  shipped: "Shipped",
  thank_you: "Thank you",
  custom: "Custom",
};

const PRESET_PREVIEW: Record<Exclude<Template, "custom">, string> = {
  shipped: "Lets the customer know their order has shipped and tracking will follow on WhatsApp.",
  thank_you: "A warm thank-you note to a founding customer.",
};

export function FollowUpButton({ orderRef, followUps }: { orderRef: string; followUps: OrderFollowUp[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState<Template>("shipped");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  const close = () => {
    if (pending) return;
    setOpen(false);
  };

  const send = () => {
    startTransition(async () => {
      const res = await sendOrderFollowUp(
        orderRef,
        template,
        template === "custom" ? { subject, body } : undefined,
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Follow-up sent · ${orderRef}`);
      setOpen(false);
      setBody("");
      setSubject("");
      router.refresh();
    });
  };

  const canSend = template !== "custom" || body.trim().length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
      >
        <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
        Follow up
        {followUps.length > 0 && <span className="tabular-nums opacity-70">· {followUps.length} sent</span>}
      </button>

      <ModalShell open={open} onClose={close} labelledBy="followup-title" className="max-w-lg">
        <div className="p-6 sm:p-7">
          <h2 id="followup-title" className="font-editorial text-2xl">Send a follow-up</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Order {orderRef}. Sent manually, whenever you choose — send as many as you need.</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {(Object.keys(TEMPLATE_LABELS) as Template[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTemplate(t)}
                className={`rounded-full px-3.5 py-1.5 text-xs uppercase tracking-[0.12em] transition-colors ${
                  template === t ? "border border-foreground bg-foreground text-background" : "border border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {TEMPLATE_LABELS[t]}
              </button>
            ))}
          </div>

          {template === "custom" ? (
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject (optional)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message… (use {name} to insert the customer's name)"
                rows={5}
                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              {PRESET_PREVIEW[template]}
            </p>
          )}

          {followUps.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Already sent</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {followUps.map((f, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>{TEMPLATE_LABELS[(f.template as Template)] ?? f.template}{f.subject ? ` — ${f.subject}` : ""}</span>
                    <span className="tabular-nums">{new Date(f.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button type="button" onClick={close} disabled={pending} className="rounded-full px-4 py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={send} disabled={!canSend || pending} className="rounded-full bg-foreground px-5 py-2 text-xs uppercase tracking-[0.16em] text-background disabled:cursor-not-allowed disabled:opacity-40">
              {pending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </ModalShell>
    </>
  );
}

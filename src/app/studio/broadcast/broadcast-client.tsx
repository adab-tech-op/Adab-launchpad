"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { testBroadcast, sendBroadcastToList } from "@/lib/actions/broadcast";

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const labelCls = "text-xs uppercase tracking-[0.16em] text-muted-foreground";

export function BroadcastClient({ recipientCount, selfEmail }: { recipientCount: number; selfEmail: string }) {
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [pending, start] = useTransition();

  const ready = subject.trim().length >= 3 && html.trim().length >= 10;

  const test = () =>
    start(async () => {
      const res = await testBroadcast({ subject, html }, selfEmail);
      if (res.ok) toast.success(`Test sent to ${selfEmail}`);
      else toast.error(res.error);
    });

  const send = () =>
    start(async () => {
      if (!confirm(`Send “${subject}” to ${recipientCount} recipient${recipientCount === 1 ? "" : "s"}? This can’t be unsent.`)) return;
      const res = await sendBroadcastToList({ subject, html });
      if (res.ok) toast.success(`Sent to ${res.sentCount} of ${res.recipientCount}.`);
      else toast.error(res.error);
    });

  return (
    <div className="max-w-2xl space-y-5">
      <div className="rounded-xl border border-border bg-primary/5 px-4 py-3 text-sm">
        <span className="font-medium">{recipientCount}</span> {recipientCount === 1 ? "person" : "people"} on the list
        {" "}(after unsubscribes).
      </div>

      <label className="block">
        <span className={labelCls}>Subject</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="A quiet drop, for the list" className={inputCls + " mt-2"} />
      </label>

      <label className="block">
        <span className={labelCls}>Message (HTML allowed)</span>
        <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={10} placeholder="<p>Dear friend,</p><p>…</p>" className={inputCls + " mt-2 font-mono text-xs"} />
        <span className="mt-1 block text-[11px] text-muted-foreground">
          The ADAB header and unsubscribe footer are added automatically. Basic HTML (&lt;p&gt;, &lt;a&gt;, &lt;strong&gt;) is fine.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setShowPreview((s) => !s)} disabled={!ready} className="rounded-full border border-border px-4 py-2 text-sm hover:border-foreground disabled:opacity-40">
          {showPreview ? "Hide preview" : "Preview"}
        </button>
        <button type="button" onClick={test} disabled={!ready || pending} className="rounded-full border border-border px-4 py-2 text-sm hover:border-foreground disabled:opacity-40">
          Send test to me
        </button>
        <button type="button" onClick={send} disabled={!ready || pending || recipientCount === 0} className="rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-40">
          {pending ? "Working…" : `Send to ${recipientCount}`}
        </button>
      </div>

      {showPreview && ready && (
        <div className="rounded-xl border border-border p-4">
          <p className={labelCls}>Preview</p>
          <p className="mt-2 text-sm font-medium">{subject}</p>
          <div className="prose prose-sm mt-2 max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      )}
    </div>
  );
}

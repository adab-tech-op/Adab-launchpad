"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { testBroadcast, sendBroadcastToList } from "@/lib/actions/broadcast";
import type { SentBroadcast } from "@/lib/broadcast-server";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function when(ts: string): string {
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function BroadcastClient({
  recipientCount,
  selfEmail,
  sent,
}: {
  recipientCount: number;
  selfEmail: string;
  sent: SentBroadcast[];
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [tested, setTested] = useState(false);
  const [pending, start] = useTransition();

  const ready = subject.trim().length >= 3 && html.trim().length >= 10;

  const test = () =>
    start(async () => {
      const res = await testBroadcast({ subject, html }, selfEmail);
      if (res.ok) {
        setTested(true);
        toast.success(`Test sent to ${selfEmail}`);
      } else toast.error(res.error);
    });

  const send = () =>
    start(async () => {
      if (
        !confirm(
          `Send “${subject}” to ${recipientCount} ${recipientCount === 1 ? "person" : "people"}? This cannot be unsent.`,
        )
      )
        return;
      const res = await sendBroadcastToList({ subject, html });
      if (res.ok) {
        toast.success(`Sent to ${res.sentCount} of ${res.recipientCount}.`);
        setSubject("");
        setHtml("");
        setTested(false);
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1fr_380px]">
      <div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm">
              Going to {recipientCount} {recipientCount === 1 ? "person" : "people"}
            </p>
            <span className="text-xs text-muted-foreground">Unsubscribes already excluded</span>
          </div>

          <label className="mt-4 block">
            <span className="mb-1 block text-[11px] text-muted-foreground">Subject</span>
            <input
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setTested(false);
              }}
              placeholder="A quiet drop, for the list"
              className={inputCls}
            />
          </label>

          <label className="mt-3 block">
            <span className="mb-1 block text-[11px] text-muted-foreground">Message</span>
            <textarea
              value={html}
              onChange={(e) => {
                setHtml(e.target.value);
                setTested(false);
              }}
              rows={10}
              placeholder="<p>Dear friend,</p>"
              className={`${inputCls} font-mono text-xs`}
            />
            <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
              The ADAB header and unsubscribe footer are added automatically. Basic HTML is fine.
            </span>
          </label>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={test}
              disabled={!ready || pending}
              className="rounded-full border border-border px-4 py-2 text-sm hover:border-foreground disabled:opacity-40"
            >
              {tested ? "Send another test" : "Send a test to me"}
            </button>
            <button
              type="button"
              onClick={send}
              disabled={!ready || pending || recipientCount === 0}
              className="ml-auto rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground disabled:opacity-40"
            >
              {pending ? "Working…" : `Send to ${recipientCount} ${recipientCount === 1 ? "person" : "people"}`}
            </button>
          </div>
          {/* Sending cannot be undone, so the count lives in the button itself
              rather than only in a line above it. */}
          <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
            {tested
              ? "Test sent. Check how it looks in your inbox before sending to the list."
              : "Sending cannot be undone. Send yourself a test first."}
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm">Sent before</p>
          {sent.length === 0 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">Nothing sent yet.</p>
          ) : (
            <div className="mt-2">
              {sent.map((b) => (
                <div key={b.id} className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border py-2.5">
                  <span className="text-sm">{b.subject}</span>
                  <span className="text-xs text-muted-foreground">
                    {when(b.sentAt)}, to {b.sentCount}
                    {b.sentCount !== b.recipientCount && ` of ${b.recipientCount}`}
                    {b.sentBy ? ` by ${b.sentBy.split("@")[0]}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
          {/* The broadcasts table recorded every send and nothing read it, so
              avoiding a repeat meant remembering. */}
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            A send where the two counts differ means some addresses bounced or were rejected.
          </p>
        </div>
      </div>

      <div>
        <p className="mb-1 text-[11px] text-muted-foreground">Preview</p>
        {/* A live preview rather than a button that reveals one: the header and
            unsubscribe footer are most of the email, and neither was visible
            before sending. */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="bg-primary py-4 text-center">
            <span className="text-xs tracking-[0.14em] text-primary-foreground">ADAB</span>
          </div>
          <div className="p-5">
            <p className="text-sm font-medium text-neutral-900">{subject || "Your subject will appear here"}</p>
            {html.trim() ? (
              <div
                className="prose prose-sm mt-3 max-w-none text-neutral-800"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <p className="mt-3 text-sm text-neutral-400">Your message will appear here.</p>
            )}
          </div>
          <div className="border-t border-neutral-200 px-5 py-3">
            <p className="text-[11px] leading-relaxed text-neutral-500">
              You are receiving this because you joined the ADAB list. Unsubscribe.
            </p>
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Rendered on white, as a mail client shows it, not on the Studio background.
        </p>
      </div>
    </div>
  );
}

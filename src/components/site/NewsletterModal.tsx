"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { createWaitlistSignup } from "@/lib/actions/waitlist";
import { toast } from "sonner";
import { z } from "zod";
import { ModalShell } from "./ModalShell";
import type { AnnouncementSettings, Frequency } from "@/lib/announcement";

const STORAGE_KEY = "adab-announcement-seen";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(320),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

// Frequency → which storage gates re-showing. "always" never records, so it
// shows every visit; "session" uses sessionStorage; "once" uses localStorage.
function alreadySeen(freq: Frequency): boolean {
  if (typeof window === "undefined" || freq === "always") return false;
  const store = freq === "session" ? window.sessionStorage : window.localStorage;
  return store.getItem(STORAGE_KEY) === "1";
}

function markSeen(freq: Frequency) {
  if (typeof window === "undefined" || freq === "always") return;
  const store = freq === "session" ? window.sessionStorage : window.localStorage;
  store.setItem(STORAGE_KEY, "1");
}

export function NewsletterModal() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<AnnouncementSettings | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch admin settings once on mount (tiny cached endpoint).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/announcement")
      .then((r) => (r.ok ? r.json() : null))
      .then((s: AnnouncementSettings | null) => {
        if (!cancelled) setSettings(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Decide whether to show: enabled, on a targeted page, and not already seen
  // per the configured frequency.
  useEffect(() => {
    if (!settings) return;
    if (!settings.enabled) return;
    if (!settings.pages.includes(pathname)) return;
    if (alreadySeen(settings.frequency)) return;
    const t = setTimeout(() => setOpen(true), 2000);
    return () => clearTimeout(t);
  }, [settings, pathname]);

  const close = () => {
    if (settings) markSeen(settings.frequency);
    setOpen(false);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    const res = await createWaitlistSignup({
      email: parsed.data.email,
      phone: parsed.data.phone ? parsed.data.phone : undefined,
      source: "newsletter_modal",
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("You're on the list.");
    close();
  };

  if (!settings) return null;

  return (
    <ModalShell open={open} onClose={close} labelledBy="newsletter-modal-title" className="max-w-md">
      <button
        onClick={close}
        className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground"
        aria-label="Close"
      >
        <X className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <div className="p-8 sm:p-10">
        {settings.eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.24em] text-primary font-display">{settings.eyebrow}</p>
        )}
        <h3 id="newsletter-modal-title" className="mt-3 font-sans text-3xl leading-tight">
          {settings.title}
        </h3>
        {settings.body && <p className="mt-3 text-sm text-muted-foreground">{settings.body}</p>}
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            name="email"
            required
            placeholder="Email address"
            className="w-full rounded-md border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone (optional)"
            className="w-full rounded-md border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-foreground py-3 text-sm uppercase tracking-[0.18em] text-background hover:bg-foreground/90 transition-colors disabled:opacity-60"
          >
            {submitting ? "Adding…" : "Notify Me"}
          </button>
        </form>
        <button
          onClick={close}
          className="mt-4 w-full text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
        >
          Continue browsing →
        </button>
      </div>
    </ModalShell>
  );
}

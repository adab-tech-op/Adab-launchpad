"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ModalShell } from "@/components/site/ModalShell";

const SEEN_KEY = "adab.welcome.seen";

/**
 * Shown once, on the homepage, immediately after someone passes the isolation
 * gate. `/?welcome=1` is the trigger rather than "first visit of a session" —
 * that keeps it tied to the moment it belongs to instead of reappearing every
 * time a signed-in colleague opens a tab.
 *
 * Dismissal is remembered in localStorage, so re-signing-in later does not
 * show it again. Storage failures (private mode, disabled) are non-fatal: the
 * worst case is seeing a welcome twice, which is better than a modal that
 * throws on mount.
 */
export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") !== "1") return;

    let seen = false;
    try {
      seen = window.localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // private mode / storage disabled — show it, don't crash
    }
    if (!seen) setOpen(true);

    // Drop the query param so a refresh or a shared link doesn't re-trigger it.
    params.delete("welcome");
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, []);

  const close = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // see above — dismissal just won't persist
    }
  };

  return (
    <ModalShell open={open} onClose={close} labelledBy="welcome-modal-title" className="max-w-md">
      <button
        onClick={close}
        className="absolute right-4 top-4 z-10 p-2 text-muted-foreground hover:text-foreground"
        aria-label="Close"
      >
        <X className="h-4 w-4" strokeWidth={1.5} />
      </button>

      <div className="paper-grain px-8 py-10 text-center sm:px-10">
        <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-display text-[10px] uppercase tracking-[0.14em] text-primary">
          Beta
        </span>

        <h2 id="welcome-modal-title" className="mt-5 font-editorial text-4xl leading-tight">
          Welcome to ADAB.
        </h2>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          You&rsquo;re seeing the site before it opens to everyone. Things will move, copy will change, and some
          corners are still being finished.
        </p>

        <button
          onClick={close}
          className="mt-8 w-full rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.08em] text-background transition-opacity hover:opacity-90"
        >
          Have a look around
        </button>
      </div>
    </ModalShell>
  );
}

"use client";

import { useEffect, useRef } from "react";

const MAILTO =
  "mailto:info@adab.world" +
  "?subject=" + encodeURIComponent("My ADAB moment") +
  "&body=" + encodeURIComponent(
    "Hi ADAB team,\n\nHere's my ADAB moment (photo attached).\n\nName / handle:\nWhere it was taken:\n\nThank you!"
  );

/**
 * The "Share your ADAB moment" CTA, styled as a masonry cell so it can sit
 * inside the scrapbook grid rather than below it. It fades/slides in the first
 * time it scrolls into view (its own IntersectionObserver — the site-wide
 * ScrollReveal doesn't target grid cells nested this deep). The hidden start
 * state is gated to (scripting: enabled) in globals.css so no-JS visitors still
 * see the card; reduced-motion reveals it immediately.
 */
export function ScrapbookCtaTile({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-revealed");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("is-revealed");
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={
        "cta-reveal break-inside-avoid overflow-hidden rounded-lg border border-border p-8 text-center paper-grain md:p-10 " +
        className
      }
    >
      <h2 className="font-editorial text-2xl md:text-3xl">Share your ADAB moment.</h2>
      <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Wearing Adab? Caught a moment that fits? Email it to us — a favourite few make the Scrapbook.
      </p>
      <a
        href={MAILTO}
        className="mt-6 inline-block rounded-full bg-foreground px-6 py-2.5 text-sm uppercase tracking-[0.12em] text-background transition-opacity hover:opacity-90"
      >
        Email your moment
      </a>
    </div>
  );
}

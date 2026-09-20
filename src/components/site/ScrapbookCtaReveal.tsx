"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { tiltOf, type ScrapbookImage } from "@/lib/scrapbook";

/** Where each covering card travels as it clears out. Hand-placed rather than
 *  generated: the pile should look stacked, and the exits should fan outward
 *  in different directions so it reads as cards being lifted off, not a menu
 *  animating. Offsets are in percent of the stage so it scales with width. */
const COVERS = [
  { x: -26, y: -6, rot: -7, exitX: -78, exitY: -34, exitRot: -20, w: 46 },
  { x: 24, y: -10, rot: 6, exitX: 82, exitY: -30, exitRot: 18, w: 44 },
  { x: -14, y: 14, rot: 4, exitX: -66, exitY: 46, exitRot: 14, w: 42 },
  { x: 20, y: 17, rot: -5, exitX: 72, exitY: 50, exitRot: -16, w: 40 },
  { x: 2, y: 2, rot: -2, exitX: 4, exitY: -66, exitRot: -9, w: 48 },
];

/**
 * The "Share your ADAB moment" moment.
 *
 * The CTA sits centred at the foot of the board, buried under a pile of
 * scrapbook cards. As you scroll it through the viewport the cards lift away
 * in proportion to scroll position — the reveal is *linked* to the scroll, not
 * a one-shot that fires on entry, so the visitor is doing the uncovering.
 *
 * The reveal is permanent: progress is latched at its high-water mark, so
 * scrolling back up leaves the cards gone rather than re-burying the
 * invitation. Re-covering it would feel like the page taking something back.
 *
 * Accessibility: the CTA is always in the DOM and always reachable — the cards
 * on top are aria-hidden and pointer-events-none, so keyboard and screen
 * reader users get the invitation immediately regardless of scroll. With
 * prefers-reduced-motion, or without JS, the cards never cover it at all.
 */
export function ScrapbookCtaReveal({ covers, children }: { covers: ScrapbookImage[]; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // Start fully covered only once we know motion is wanted; otherwise the
  // no-JS and reduced-motion paths would flash a covered state.
  const [progress, setProgress] = useState(1);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setArmed(true);
    setProgress(0);

    let raf = 0;
    let latched = 0;

    const measure = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 while the stage is still low in the viewport, 1 once it has risen
      // to roughly the upper third — the uncovering happens across that travel.
      const start = vh * 0.92;
      const end = vh * 0.34;
      const raw = (start - rect.top) / (start - end);
      const clamped = Math.min(1, Math.max(0, raw));
      if (clamped > latched) {
        latched = clamped; // high-water mark — never re-cover
        setProgress(latched);
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const pile = covers.slice(0, COVERS.length);
  // Ease-out so the cards break away decisively and drift to a stop.
  const eased = 1 - Math.pow(1 - progress, 2);

  return (
    <div ref={ref} className="relative mt-16 flex min-h-[34rem] items-center justify-center md:mt-24 md:min-h-[40rem]">
      {/* The invitation, centred and underneath */}
      <div className="relative z-10 w-full max-w-md px-2">{children}</div>

      {/* The pile on top of it */}
      {armed &&
        pile.map((img, i) => {
          const c = COVERS[i];
          const x = c.x + (c.exitX - c.x) * eased;
          const y = c.y + (c.exitY - c.y) * eased;
          const rot = c.rot + (c.exitRot - c.rot) * eased;
          // Cards fade only in the last stretch, so most of the travel is
          // visible movement rather than a dissolve.
          const opacity = 1 - Math.min(1, Math.max(0, (eased - 0.55) / 0.45));
          if (opacity <= 0) return null;
          return (
            <div
              key={img.id}
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 will-change-transform"
              style={{
                width: `${c.w}%`,
                zIndex: 20 + i,
                opacity,
                transform: `translate(-50%, -50%) translate(${x}%, ${y}%) rotate(${rot + tiltOf(img) * 0.3}deg)`,
              }}
            >
              <div className="overflow-hidden rounded-lg shadow-[0_18px_44px_rgba(28,28,28,0.22)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image_url} alt="" className="aspect-[4/5] w-full object-cover" loading="lazy" />
              </div>
            </div>
          );
        })}
    </div>
  );
}

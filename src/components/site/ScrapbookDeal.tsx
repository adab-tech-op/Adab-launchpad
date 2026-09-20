"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The un-piling.
 *
 * Every card starts stacked in the centre of the board — a loose pile, as if
 * someone just set a handful of prints down — and slides out to its placed
 * position as you scroll the board through the viewport. Linked to scroll, so
 * the visitor is dealing the cards out rather than watching a canned sequence;
 * latched at its high-water mark, so scrolling back up leaves the board laid
 * out instead of re-collecting it.
 *
 * Each card's journey is measured at runtime: the distance from where it
 * actually sits to the pile's centre. That means the animation follows the
 * authored layout instead of a second set of hardcoded positions that would
 * drift out of sync the moment someone moves a card in Studio.
 *
 * Cards are staggered by their distance from centre — the outermost ones take
 * longest to settle, which is what gives it momentum rather than everything
 * arriving at once.
 *
 * Server-renders fully laid out. The pile is only applied after mount, so
 * no-JS visitors and crawlers see the finished board, and a failure here can
 * never leave the scrapbook stacked in a heap.
 */
export function ScrapbookDeal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-deal-card]"));
    if (cards.length === 0) return;

    type Plan = { el: HTMLElement; dx: number; dy: number; rot: number; from: number; to: number };
    let plans: Plan[] = [];
    let latched = 0;
    let raf = 0;

    const plan = () => {
      const box = root.getBoundingClientRect();
      const cx = box.width / 2;
      const cy = box.height / 2;

      const raw = cards.map((el) => {
        // Measure against the untransformed position.
        el.style.transform = "";
        const r = el.getBoundingClientRect();
        const ex = r.left - box.left + r.width / 2;
        const ey = r.top - box.top + r.height / 2;
        return { el, dx: cx - ex, dy: cy - ey, dist: Math.hypot(cx - ex, cy - ey) };
      });

      const max = Math.max(...raw.map((r) => r.dist), 1);
      plans = raw.map((r, i) => {
        // Nearer cards settle first; the far corners trail.
        const share = r.dist / max;
        const from = 0.05 + share * 0.3;
        return {
          el: r.el,
          dx: r.dx,
          dy: r.dy,
          // A loose pile, not a neat deck.
          rot: ((i % 5) - 2) * 3.5,
          from,
          to: Math.min(1, from + 0.5),
        };
      });
    };

    const apply = (p: number) => {
      for (const c of plans) {
        const t = Math.min(1, Math.max(0, (p - c.from) / (c.to - c.from)));
        const eased = 1 - Math.pow(1 - t, 3); // decisive break, gentle settle
        const k = 1 - eased; // 1 = piled, 0 = placed
        if (k <= 0.001) {
          c.el.style.transform = "";
          c.el.style.willChange = "";
          continue;
        }
        c.el.style.willChange = "transform";
        c.el.style.transform = `translate3d(${c.dx * k}px, ${c.dy * k}px, 0) rotate(${c.rot * k}deg) scale(${1 - 0.06 * k})`;
      }
    };

    const measure = () => {
      raf = 0;
      const box = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // Deal out across the board's travel through the lower two-thirds.
      const start = vh * 0.95;
      const end = Math.max(vh * 0.15, vh * 0.95 - box.height * 0.9);
      const p = Math.min(1, Math.max(0, (start - box.top) / (start - end)));
      if (p > latched) {
        latched = p;
        apply(latched);
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    const onResize = () => {
      plan();
      apply(latched);
      onScroll();
    };

    plan();
    apply(0);
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
      for (const c of plans) {
        c.el.style.transform = "";
        c.el.style.willChange = "";
      }
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      {children}
    </div>
  );
}

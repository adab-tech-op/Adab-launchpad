"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Fly-in reveal on scroll.
 *
 * Elements start hidden via pure CSS (see globals.css) so the server and client
 * markup always match, and the animation itself runs through the Web Animations
 * API — no class/attribute mutation, so hydration is never disturbed.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = new WeakSet<Element>();

    const STAGGER = 120;
    const MAX_QUEUE = 600;
    let lastRevealAt = 0;

    const show = (el: HTMLElement, delay: number) => {
      el.style.opacity = "1";
      if (reduced) return;
      el.animate(
        [
          { opacity: 0, transform: "translateY(28px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 500,
          delay,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "backwards",
        },
      );
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const now = performance.now();
        if (lastRevealAt < now) lastRevealAt = now;

        entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          .forEach((entry) => {
            const delay = Math.min(Math.max(0, lastRevealAt - now), MAX_QUEUE);
            lastRevealAt = now + delay + STAGGER;
            show(entry.target as HTMLElement, delay);
            observer.unobserve(entry.target);
          });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );

    const scan = () => {
      document
        .querySelectorAll<HTMLElement>(
          [
            "main section:not([data-reveal-skip]) > *",
            "footer > div > *",
            "main section:not([data-reveal-images-skip]) img",
            "main section:not([data-reveal-images-skip]) div > div > *",
          ].join(", "),
        )
        .forEach((el) => {
          if (seen.has(el)) return;
          seen.add(el);
          observer.observe(el);
        });
    };

    let mo: MutationObserver | undefined;
    const timer = window.setTimeout(() => {
      scan();
      mo = new MutationObserver(() => scan());
      mo.observe(document.body, { childList: true, subtree: true });
    }, 60);

    return () => {
      window.clearTimeout(timer);
      mo?.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}

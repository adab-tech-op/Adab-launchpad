"use client";

import { useEffect, useRef, useState } from "react";
import { ROMAN } from "@/lib/page-content";
import { cn } from "@/lib/utils";

export type EditorialSection = { title: string; bodyHtml: string; image?: string };

/**
 * Scroll-driven manifesto body. On desktop the paired image panel sticks on the
 * left while the text sections scroll on the right; as each section crosses the
 * viewport's centre its paired image slides up into place. On mobile it falls
 * back to a simple stack (image above each section) — no sticky, no JS needed
 * for layout. Text is rendered as-is, so mixed Bengali + English works.
 */
export function ManifestoEditorial({ sections }: { sections: EditorialSection[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (sections.length === 0) return;
    // A thin band across the viewport's vertical centre: whichever section is
    // crossing it is "active" and drives the sticky image.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [sections.length]);

  if (sections.length === 0) return null;

  return (
    <section
      data-reveal-skip
      data-reveal-images-skip
      className="mx-auto max-w-6xl px-5 py-20 md:py-28"
    >
      <div className="md:grid md:grid-cols-2 md:gap-16">
        {/* Left: sticky image panel (desktop only) */}
        <div className="hidden md:block">
          <div className="sticky top-16 flex h-[calc(100dvh-4rem)] items-center">
            <div className="relative h-[78vh] max-h-[760px] w-full overflow-hidden rounded-2xl bg-paper">
              {sections.map((s, i) => {
                const state = i === active ? "active" : i < active ? "past" : "future";
                return (
                  <div
                    key={i}
                    aria-hidden={state !== "active"}
                    className={cn(
                      "absolute inset-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
                      state === "active" && "translate-y-0 opacity-100",
                      state === "past" && "-translate-y-8 opacity-0",
                      state === "future" && "translate-y-8 opacity-0",
                    )}
                  >
                    {s.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <PlaceholderPanel index={i} title={s.title} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: text sections */}
        <div>
          {sections.map((s, i) => (
            <article
              key={i}
              data-idx={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className="py-12 md:flex md:min-h-[72vh] md:flex-col md:justify-center md:py-0"
            >
              {/* Mobile paired image (stacked above the text) */}
              {s.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.image}
                  alt=""
                  className="mb-6 aspect-[4/5] w-full rounded-2xl object-cover md:hidden"
                  loading="lazy"
                />
              )}
              <div className="grid grid-cols-[auto_1fr] gap-5 md:gap-6">
                <p className="font-display text-xl text-primary tabular-nums md:text-2xl">{ROMAN[i] ?? i + 1}.</p>
                <div>
                  <h2 className="font-display text-lg uppercase tracking-[0.18em] md:text-xl">{s.title}</h2>
                  <div
                    className="prose-editorial mt-4 text-base leading-relaxed text-foreground/85 md:text-lg"
                    dangerouslySetInnerHTML={{ __html: s.bodyHtml }}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlaceholderPanel({ index, title }: { index: number; title: string }) {
  return (
    <div className="paper-grain flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="font-display text-5xl text-primary/50 tabular-nums">{ROMAN[index] ?? index + 1}</span>
      {title && (
        <span className="font-display text-xs uppercase tracking-[0.18em] text-muted-foreground">{title}</span>
      )}
    </div>
  );
}

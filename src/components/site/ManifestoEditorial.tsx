"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ROMAN } from "@/lib/page-content";
import { cn } from "@/lib/utils";
import { BlurImage } from "@/components/site/BlurImage";

export type EditorialSection = {
  title: string;
  bodyHtml: string;
  image?: string;
  video?: string;
};

/** Bengali has no letter case, and these headlines are full sentences rather
 *  than short labels — so uppercasing is meaningless and the tight Latin
 *  leading crowds the vowel signs that sit above and below the baseline. */
const BENGALI = /[\u0980-\u09FF]/;

/** Media for one chapter: video (with the image as its poster) if present,
 *  else the image, else a titled placeholder. Videos are decorative here —
 *  muted, looping, inline — so they never hijack the reading. */
function ChapterMedia({ section, index, eager }: { section: EditorialSection; index: number; eager: boolean }) {
  if (section.video) {
    return (
      <video
        src={section.video}
        poster={section.image || undefined}
        className="h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload={eager ? "auto" : "none"}
        aria-hidden="true"
        tabIndex={-1}
      />
    );
  }
  if (section.image) {
    return (
      <BlurImage src={section.image} alt="" className="h-full w-full object-cover" wrapperClassName="h-full w-full" eager={eager} />
    );
  }
  return <PlaceholderPanel index={index} title={section.title} />;
}

/** Body copy with progressive disclosure. The first few lines always show, so
 *  the toggle is never a blind one; it only appears when there's genuinely
 *  more to reveal (measured, not guessed), which means short chapters stay
 *  fully open and long ones invite a deliberate step deeper. */
function ChapterBody({ html, bengali }: { html: string; bengali: boolean }) {
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollHeight - el.clientHeight > 4);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [html]);

  return (
    <div>
      <div
        ref={ref}
        className={cn(
          "prose-editorial relative overflow-hidden text-base text-foreground/85 md:text-lg",
          bengali ? "leading-[1.9]" : "leading-relaxed",
          !open && "[mask-image:linear-gradient(to_bottom,black_60%,transparent)]",
        )}
        style={open ? undefined : { maxHeight: bengali ? "6.6em" : "5.4em" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {(overflows || open) && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-3 text-xs uppercase tracking-[0.08em] text-primary underline underline-offset-4 hover:opacity-80"
          aria-expanded={open}
        >
          {open ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}

/**
 * Scroll-driven Adab Story body. On desktop the paired media panel sticks on
 * the left while the chapters scroll on the right; as each chapter crosses the
 * viewport's centre its media slides up into place. On mobile it falls back to
 * a simple stack — no sticky, no JS needed for layout. Text renders as-is, so
 * mixed Bengali + English works.
 */
export function ManifestoEditorial({ sections }: { sections: EditorialSection[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (sections.length === 0) return;
    // A thin band across the viewport's vertical centre: whichever section is
    // crossing it is "active" and drives the sticky media.
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
        {/* Left: sticky media panel (desktop only) */}
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
                    <ChapterMedia section={s} index={i} eager={i === 0} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: chapters */}
        <div>
          {sections.map((s, i) => {
            const bengali = BENGALI.test(s.title) || BENGALI.test(s.bodyHtml);
            return (
              <article
                key={i}
                data-idx={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                className="py-12 md:flex md:min-h-[72vh] md:flex-col md:justify-center md:py-0"
              >
                {/* Mobile paired media (stacked above the text) */}
                {(s.video || s.image) && (
                  <div className="mb-6 aspect-[4/5] w-full overflow-hidden rounded-2xl md:hidden">
                    <ChapterMedia section={s} index={i} eager={false} />
                  </div>
                )}
                <div className="grid grid-cols-[auto_1fr] gap-5 md:gap-6">
                  <p className="font-display text-xl text-primary tabular-nums md:text-2xl">{ROMAN[i] ?? i + 1}.</p>
                  <div>
                    <h2
                      className={cn(
                        "font-display",
                        // Bengali: sentence-length headlines, so give them display
                        // scale and room to breathe instead of small-caps labels.
                        bengali
                          ? "text-2xl leading-[1.5] md:text-[1.75rem]"
                          : "text-lg uppercase md:text-xl",
                      )}
                    >
                      {s.title}
                    </h2>
                    <div className="mt-4">
                      <ChapterBody html={s.bodyHtml} bengali={bengali} />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
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
        <span className="font-display text-xs uppercase text-muted-foreground">{title}</span>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { ROMAN } from "@/lib/page-content";
import { cn } from "@/lib/utils";

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

/** One section's media: video (with the image as its poster) if present, else
 *  the image, else a titled placeholder. Video is decorative here — muted,
 *  looping, inline — so it never hijacks the reading. */
function SectionMedia({ section, index }: { section: EditorialSection; index: number }) {
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
        aria-hidden="true"
        tabIndex={-1}
      />
    );
  }
  if (section.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={section.image} alt="" className="h-full w-full object-cover" loading={index === 0 ? "eager" : "lazy"} />
    );
  }
  return (
    <div className="paper-grain flex h-full w-full items-center justify-center" aria-hidden="true">
      <span className="font-display text-5xl text-primary/40 tabular-nums">{ROMAN[index] ?? index + 1}</span>
    </div>
  );
}

/** Body copy, clamped with a soft fade and a See more / See less toggle. The
 *  toggle shows on every section rather than only when the text overflows:
 *  a consistent affordance in a consistent place reads as part of the design,
 *  where one that appears on some sections and not others reads as a glitch. */
function SectionBody({ html, bengali }: { html: string; bengali: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div
        className={cn(
          "prose-editorial max-w-[42rem] text-base text-foreground/85 md:text-[1.0625rem]",
          bengali ? "leading-[1.95]" : "leading-relaxed",
          !open && "overflow-hidden [mask-image:linear-gradient(to_bottom,black_58%,transparent)]",
        )}
        style={open ? undefined : { maxHeight: bengali ? "7.8em" : "6.4em" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-3.5 border-b border-primary pb-[3px] text-[11px] uppercase tracking-[0.1em] text-primary transition-opacity hover:opacity-70"
      >
        {open ? "See less" : "See more"}
      </button>
    </div>
  );
}

/**
 * The Adab Story body: five sections, each with a title, one media holder and
 * a long passage behind a See more toggle, running one after another down a
 * single column.
 *
 * Deliberately not the two-column sticky layout this page used to have. That
 * paired one image per chapter in a side rail, which fixed the reader's eye in
 * place and turned five separate moments into one scrolling panel. A section
 * at a time gives each its own beat — which is what the copy is written for.
 */
export function ManifestoEditorial({ sections }: { sections: EditorialSection[] }) {
  if (sections.length === 0) return null;

  return (
    <section data-reveal-skip data-reveal-images-skip className="px-5 py-20 md:py-28">
      <div className="mx-auto max-w-[55rem]">
        {sections.map((s, i) => {
          const bengali = BENGALI.test(s.title) || BENGALI.test(s.bodyHtml);
          return (
            <article key={i} className={i > 0 ? "mt-16 md:mt-20" : ""}>
              <p className="font-display text-[12px] tracking-[0.18em] text-muted-foreground tabular-nums">
                {ROMAN[i] ?? i + 1}
              </p>

              <h2
                className={cn(
                  "mt-3.5 font-display",
                  bengali
                    ? "text-[1.6rem] leading-[1.55] md:text-[2.0625rem]"
                    : "text-2xl leading-tight md:text-3xl",
                )}
              >
                {s.title}
              </h2>

              <div className="mt-7 overflow-hidden rounded-xl bg-paper">
                <div className="aspect-[16/9] w-full md:aspect-[2/1]">
                  <SectionMedia section={s} index={i} />
                </div>
              </div>

              <div className="mt-6">
                <SectionBody html={s.bodyHtml} bengali={bengali} />
              </div>

              {i < sections.length - 1 && <div className="mt-16 h-px bg-border md:mt-20" />}
            </article>
          );
        })}
      </div>
    </section>
  );
}

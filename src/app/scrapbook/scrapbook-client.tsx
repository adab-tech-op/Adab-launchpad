"use client";

import { useState } from "react";

const fitting = "/assets/scrapbook-fitting.jpg";
const fabric = "/assets/scrapbook-fabric.jpg";
const embroidery = "/assets/scrapbook-embroidery.jpg";
const community = "/assets/scrapbook-community.jpg";
const placket = "/assets/product-detail-placket.jpg";
const scrap1 = "/assets/scrapbook-1.jpg";
const scrap2 = "/assets/scrapbook-2.jpg";
const archival = "/assets/story-archival.jpg";

const TILES = [
  { src: fitting, alt: "The first sample fitting", caption: "The first sample fitting", span: "md:col-span-2 md:row-span-2" },
  { src: fabric, alt: "Texture from home", caption: "Texture from home", span: "md:row-span-2" },
  { src: embroidery, alt: "Thread, close up", caption: "Thread, close up", span: "" },
  { src: scrap1, alt: "In the studio", caption: "In the studio", span: "" },
  { src: placket, alt: "Placket detail", caption: "Placket detail", span: "md:col-span-2" },
  { src: scrap2, alt: "At the worktable", caption: "At the worktable", span: "" },
  { src: community, alt: "Your Adab moment", caption: "Your Adab moment", span: "md:row-span-2" },
  { src: archival, alt: "Archival tone", caption: "Archival tone", span: "" },
];

export function ScrapbookClient() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 md:px-8 pt-20 md:pt-28 pb-12">
        <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">
          Scrapbook
        </p>
        <h1 className="mt-3 font-editorial text-5xl md:text-6xl">Scrapbook.</h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
          People, places, textures, and moments around Adab.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 md:px-8 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] md:auto-rows-[240px] gap-3 md:gap-4">
          {TILES.map((t, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-2xl bg-[color:var(--paper)] ${t.span}`}
            >
              <img
                src={t.src}
                alt={t.alt}
                loading="lazy"
                width={1024}
                height={1024}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-foreground/70 to-transparent p-4 pt-12 transition-transform duration-500 group-hover:translate-y-0">
                <p className="font-display text-[10px] uppercase tracking-[0.18em] text-background/90">
                  {t.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Submission */}
      <section className="mx-auto max-w-2xl px-5 md:px-8 pb-32">
        <div className="rounded-2xl border border-border p-8 md:p-12 paper-grain">
          {submitted ? (
            <div className="text-center">
              <p className="font-display text-[11px] uppercase tracking-[0.2em] text-primary">
                Thank you
              </p>
              <h2 className="mt-3 font-editorial text-3xl md:text-4xl">
                Your moment is in the queue.
              </h2>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                We review every submission by hand. If it fits the Adab scrapbook, we’ll be in touch.
              </p>
            </div>
          ) : (
            <>
              <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">
                Submit
              </p>
              <h2 className="mt-3 font-editorial text-3xl md:text-4xl">
                Share your Adab moment.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Wearing Adab? Caught a moment that fits? Send it to us for the Scrapbook.
              </p>
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <Field label="Name">
                  <input required maxLength={80} className={inputCls} />
                </Field>
                <Field label="Email">
                  <input required type="email" maxLength={120} className={inputCls} />
                </Field>
                <Field label="Instagram handle (optional)">
                  <input placeholder="@yourhandle" maxLength={40} className={inputCls} />
                </Field>
                <Field label="Photo">
                  <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-10 text-center text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    <span>Drop image here or click to upload</span>
                    <span className="mt-2 text-[10px] normal-case tracking-normal text-muted-foreground/70">
                      Upload placeholder — no file is stored yet
                    </span>
                  </div>
                </Field>
                <label className="flex items-start gap-3 text-xs text-muted-foreground">
                  <input type="checkbox" required className="mt-1" />
                  <span>
                    I consent to Adab using this image on the site and social channels with credit.
                  </span>
                </label>
                <button
                  type="submit"
                  className="w-full rounded-full bg-primary py-3 text-xs uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Submit to Scrapbook
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-display text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

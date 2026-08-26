"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { AuthErrorCatcher } from "@/components/site/AuthErrorCatcher";
import type { Product } from "@/data/products";

const heroImg = "/assets/hero-main.jpg";
const storyArchival = "/assets/story-archival.jpg";
const scrap1 = "/assets/scrapbook-1.jpg";
const scrap2 = "/assets/scrapbook-2.jpg";
const scrap3 = "/assets/scrapbook-3.jpg";
const scrap4 = "/assets/scrapbook-4.jpg";

export function HomeClient({ products }: { products: Product[] }) {
  const pictureRef = useRef<HTMLPictureElement>(null);
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const onScroll = () => {
      setParallaxY(window.scrollY * 0.2);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <AuthErrorCatcher />
      </Suspense>
      {/* Hero */}
      <section data-reveal-images-skip className="relative h-[calc(100dvh-4rem)] min-h-[600px] w-full overflow-hidden">
        <picture
          ref={pictureRef}
          className="absolute -top-[10%] left-0 h-[120%] w-full will-change-transform"
          style={{ transform: `translateY(${parallaxY}px)` }}
        >
          <source media="(min-width: 768px)" srcSet="/assets/hero-desktop.jpg" />
          <img
            src={heroImg}
            alt="Adab piran — heritage-fusion menswear from Bangladesh"
            width={1600}
            height={1920}
            className="h-full w-full object-cover object-top-left md:object-[70%_center]"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-background/85 to-transparent" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col px-5 md:px-8 pb-16 md:pb-16">
          <div className="min-h-20 flex-1 md:min-h-24" aria-hidden="true" />
          <h1 className="mt-6 font-display text-6xl md:text-8xl lg:text-9xl leading-[0.9] text-foreground">
            OLD SOUL. NEW CUT.
          </h1>
          <p className="mt-6 max-w-xl font-editorial text-3xl md:text-4xl leading-snug text-foreground">
            Same DNA. New Language.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#waitlist"
              className="rounded-full bg-primary px-6 py-3 text-xs uppercase font-bold text-white hover:bg-primary/90 transition-colors"
            >
              Join the Waitlist
            </a>
            <Link
              href="/product/adab-piran-warm-charcoal"
              className="rounded-full border border-primary bg-background px-6 py-3 text-xs uppercase font-bold text-primary hover:bg-background/90 transition-colors"
            >
              Explore the Piran
            </Link>
          </div>
        </div>
      </section>

      {/* Brand story strip */}
      <section data-reveal-images-skip className="mx-auto max-w-7xl px-5 md:px-8 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">
              The ADAB idea
            </p>
            <p className="mt-6 font-editorial text-4xl md:text-5xl leading-[1.15] text-foreground">
              “We don't believe history gets lost. It just waits.”
            </p>
            <Link
              href="/manifesto"
              className="mt-10 inline-block text-sm uppercase tracking-[0.2em] text-foreground border-b border-foreground pb-1 hover:text-primary hover:border-primary transition-colors"
            >
              Read the Manifesto →
            </Link>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl paper-grain">
            <img
              src={storyArchival}
              alt=""
              aria-hidden
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-multiply"
            />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section data-reveal-images-skip className="border-y border-border paper-grain">
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {[
            "Founding Drop — limited pieces, no restock",
            "Verified 1950s–60s history, not costume",
            "Made in Bangladesh",
          ].map((t) => (
            <div key={t} className="px-6 md:px-10 py-12 md:py-16">
              <p className="font-editorial text-2xl md:text-3xl leading-snug">
                {t}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section id="waitlist" className="mx-auto max-w-7xl px-5 md:px-8 py-24 md:py-32">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="text-[11px] font-display uppercase tracking-[0.24em] text-primary">
              Founding Drop
            </p>
            <h2 className="mt-3 font-sans text-4xl md:text-5xl">
              Two pieces. One DNA.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-md">
              Limited quantities. No restock.
            </p>
          </div>
          <Link
            href="/shop"
            className="text-sm uppercase tracking-[0.18em] text-foreground hover:text-primary"
          >
            View all →
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* Mini collection menu */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { l: "Piran", to: "/shop" },
            { l: "Hoodie", to: "/shop" },
            { l: "Coming Next", to: "/shop" },
          ].map((c) => (
            <Link
              key={c.l}
              href={c.to}
              className="group flex items-center justify-between rounded-2xl border border-border px-5 py-6 hover:border-foreground transition-colors"
            >
              <span className="font-editorial text-2xl">{c.l}</span>
              <span className="text-foreground/50 group-hover:text-foreground transition-colors">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Scrapbook preview */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-24 md:py-32">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="text-[11px] font-display uppercase tracking-[0.24em] text-primary">
              Scrapbook
            </p>
            <h2 className="mt-3 font-sans text-4xl md:text-5xl">
              From the Adab Scrapbook.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-md">
              People, places, textures, and moments around Adab.
            </p>
          </div>
          <Link
            href="/scrapbook"
            className="text-sm uppercase tracking-[0.18em] hover:text-primary"
          >
            View Scrapbook →
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[scrap1, scrap2, scrap3, scrap4].map((src, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-2xl bg-[color:var(--paper)]"
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

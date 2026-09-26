"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { AuthErrorCatcher } from "@/components/site/AuthErrorCatcher";
import { HeroCarousel } from "@/components/site/HeroCarousel";
import type { HomeContent, HeroSlide } from "@/lib/page-content";
import { HOME_BODY_DEFAULT } from "@/lib/page-content";
import type { Product } from "@/data/products";

const storyArchival = "/assets/story-archival.jpg";
const scrap1 = "/assets/scrapbook-1.jpg";
const scrap2 = "/assets/scrapbook-2.jpg";
const scrap3 = "/assets/scrapbook-3.jpg";
const scrap4 = "/assets/scrapbook-4.jpg";

// Pre-carousel fallback: a single slide built from home's legacy hero fields.
// getHomeContent() already guarantees a non-empty heroSlides array, so this
// only matters if that ever changes.
function legacySlide(home: HomeContent): HeroSlide {
  return {
    hero: home.hero,
    overlay: home.overlay,
    heading: home.heading,
    headingColor: home.headingColor,
    subcopy: home.subcopy,
    subcopyColor: home.subcopyColor,
  };
}

export function HomeClient({
  products,
  home,
  scrapbookTeasers = [],
}: {
  products: Product[];
  home: HomeContent;
  /** First few real scrapbook entries, newest curation first. Empty falls back
   *  to the bundled assets so the strip is never blank. */
  scrapbookTeasers?: string[];
}) {
  const [parallaxY, setParallaxY] = useState(0);
  const body = home.body ?? HOME_BODY_DEFAULT;

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
        <HeroCarousel
          slides={home.heroSlides?.length ? home.heroSlides : [legacySlide(home)]}
          label="Adab piran — heritage-fusion menswear from Bangladesh"
          parallaxY={parallaxY}
          autoplaySeconds={home.heroAutoplaySeconds}
        >
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
        </HeroCarousel>
      </section>

      {/* Brand story strip */}
      <section data-reveal-images-skip className="mx-auto max-w-7xl px-5 md:px-8 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <p className="mt-6 font-editorial text-4xl md:text-5xl leading-[1.15] text-foreground">
              {`“${body.storyQuote}”`}
            </p>
            <Link
              href="/adab-story"
              className="mt-10 inline-block text-sm uppercase tracking-[0.08em] text-foreground border-b border-foreground pb-1 hover:text-primary hover:border-primary transition-colors"
            >
              Read the Adab Story →
            </Link>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl paper-grain">
            <img
              src={body.storyImage || storyArchival}
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
          {body.trust.map((t) => (
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
            <h2 className="mt-3 font-sans text-4xl md:text-5xl">{body.featuredHeading}</h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-md">{body.featuredSubcopy}</p>
          </div>
          <Link
            href="/shop"
            className="text-sm uppercase tracking-[0.06em] text-foreground hover:text-primary"
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
          {body.menu.map((l) => (
            <Link
              key={l}
              href="/shop"
              className="group flex items-center justify-between rounded-2xl border border-border px-5 py-6 hover:border-foreground transition-colors"
            >
              <span className="font-editorial text-2xl">{l}</span>
              <span className="text-foreground/50 group-hover:text-foreground transition-colors">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Scrapbook preview */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-24 md:py-32">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h2 className="mt-3 font-sans text-4xl md:text-5xl">{body.scrapbookHeading}</h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-md">{body.scrapbookSubcopy}</p>
          </div>
          <Link
            href="/scrapbook"
            className="text-sm uppercase tracking-[0.06em] hover:text-primary"
          >
            View Scrapbook →
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {(scrapbookTeasers.length > 0 ? scrapbookTeasers : [scrap1, scrap2, scrap3, scrap4]).map((src, i) => (
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

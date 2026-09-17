"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HeroBackground } from "./HeroBackground";
import { overlayStyle } from "@/lib/hero";
import { HERO_AUTOPLAY_SECONDS_DEFAULT, clampHeroAutoplaySeconds, type HeroSlide } from "@/lib/page-content";

/**
 * The home hero: N slides, each with its own background image, overlay, and
 * heading/subcopy, cycling with autoplay plus manual arrow/dot controls.
 * `parallaxY` (if given) is applied only to the image layer, matching the old
 * single-image hero's parallax — text and controls stay put. `children` is
 * static content (CTA buttons) rendered once below the per-slide text, the
 * same on every slide. `autoplaySeconds` is how long each slide is held.
 */
export function HeroCarousel({
  slides,
  label,
  parallaxY = 0,
  autoplaySeconds = HERO_AUTOPLAY_SECONDS_DEFAULT,
  children,
}: {
  slides: HeroSlide[];
  label?: string;
  parallaxY?: number;
  autoplaySeconds?: number;
  children?: ReactNode;
}) {
  const intervalMs = clampHeroAutoplaySeconds(autoplaySeconds) * 1000;
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hoveredRef = useRef(false);
  const count = slides.length;
  const safeIndex = index % count;
  const slide = slides[safeIndex] ?? slides[0];

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const start = () => {
    stop();
    if (count <= 1 || hoveredRef.current) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
  };

  useEffect(() => {
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, intervalMs]);

  const go = (i: number) => {
    setIndex(((i % count) + count) % count);
    start(); // manual interaction resets the autoplay clock instead of jumping right after
  };

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => { hoveredRef.current = true; stop(); }}
      onMouseLeave={() => { hoveredRef.current = false; start(); }}
    >
      <div
        className="absolute -top-[10%] left-0 h-[120%] w-full will-change-transform"
        style={{ transform: `translateY(${parallaxY}px)` }}
      >
        {slides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${i === safeIndex ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <HeroBackground images={s.hero} label={i === safeIndex ? label : undefined} />
          </div>
        ))}
      </div>
      {slides.map((s, i) => {
        const o = overlayStyle(s.overlay);
        if (!o) return null;
        return (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${i === safeIndex ? "opacity-100" : "opacity-0"}`}
            style={o}
          />
        );
      })}

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col px-5 md:px-8 pb-16 md:pb-16">
        <div className="min-h-20 flex-1 md:min-h-24" aria-hidden="true" />
        <div key={safeIndex} className="animate-page-in">
          <h1 className="mt-6 font-display text-6xl md:text-8xl lg:text-9xl leading-[0.9]" style={{ color: slide.headingColor }}>
            {slide.heading.split("\n").map((line, i) => (
              <span key={i} className="block">{line || "\u00A0"}</span>
            ))}
          </h1>
          {slide.subcopy && (
            <p className="mt-6 max-w-xl font-editorial text-3xl md:text-4xl leading-snug" style={{ color: slide.subcopyColor }}>
              {slide.subcopy}
            </p>
          )}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">{children}</div>

        {count > 1 && (
          <div className="mt-8 flex items-center gap-4">
            <button
              type="button"
              onClick={() => go(safeIndex - 1)}
              aria-label="Previous slide"
              className="rounded-full border p-2 transition-colors"
              style={{ borderColor: slide.headingColor, color: slide.headingColor }}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === safeIndex}
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: i === safeIndex ? "1.5rem" : "0.5rem",
                    backgroundColor: slide.headingColor,
                    opacity: i === safeIndex ? 1 : 0.4,
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(safeIndex + 1)}
              aria-label="Next slide"
              className="rounded-full border p-2 transition-colors"
              style={{ borderColor: slide.headingColor, color: slide.headingColor }}
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

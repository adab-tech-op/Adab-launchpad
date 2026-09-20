"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Search, ArrowRight } from "lucide-react";
import { type FabricType } from "@/lib/fabrics";
import { overlayStyle } from "@/lib/hero";
import { FabricCareModal } from "@/components/site/FabricCareModal";
import { BlurImage } from "@/components/site/BlurImage";

/** The card's photo runs full-bleed down one side, so each fabric tints its
 *  own image with the same overlay model the heroes use. */
function panelOverlay(f: FabricType) {
  return overlayStyle({
    enabled: f.overlay_enabled,
    color: f.overlay_color,
    opacity: f.overlay_opacity,
    from: f.overlay_from as never,
  });
}

/** With no photo uploaded the panel would otherwise be a large blank box —
 *  the loudest, emptiest thing on the page. Fall back to a tonal ground
 *  carrying the fabric's initial instead. */
function MediaPanel({ fabric, stacked }: { fabric: FabricType; stacked?: boolean }) {
  const base = stacked ? "relative h-40 w-full shrink-0 overflow-hidden" : "relative w-28 shrink-0 self-stretch overflow-hidden sm:w-44 md:w-52";
  if (!fabric.thumbnail_url) {
    return (
      <div className={`${base} flex items-center justify-center bg-muted`} aria-hidden="true">
        <span className="font-sans text-4xl text-foreground/25">{fabric.name.trim().charAt(0) || "—"}</span>
      </div>
    );
  }
  const ov = panelOverlay(fabric);
  return (
    <div className={base}>
      <BlurImage src={fabric.thumbnail_url} alt="" className="h-full w-full object-cover" wrapperClassName="h-full w-full" />
      {ov && <div className="absolute inset-0" style={ov} />}
    </div>
  );
}

/**
 * One fabric. The whole card is the control — a single affordance rather than
 * a card that's clickable *and* contains a competing "read more" button (which
 * would also be a button nested in a button: invalid, and unreachable by
 * keyboard). The arrow row reads as the call to action; the card is the target.
 */
function FabricCard({ fabric, onOpen }: { fabric: FabricType; onOpen: () => void }) {
  const blurb = fabric.details || fabric.care_detail;
  return (
    <button
      onClick={onOpen}
      className="group flex overflow-hidden rounded-2xl border border-border bg-paper text-left transition-all hover:border-foreground/35 hover:shadow-[0_10px_28px_rgba(28,28,28,0.09)]"
    >
      <MediaPanel fabric={fabric} />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5 sm:p-7">
        <h3 className="font-sans text-xl sm:text-2xl">{fabric.name}</h3>
        {blurb && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{blurb}</p>
        )}
        <div className="mt-auto flex flex-col gap-3.5 pt-1">
          {fabric.at_a_glance && (
            <p className="text-[11px] leading-relaxed tracking-[0.03em] text-muted-foreground">{fabric.at_a_glance}</p>
          )}
          <span className="flex items-center gap-2 border-t border-border pt-3.5 text-[11px] uppercase tracking-[0.09em] text-primary">
            Full care guide
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.6} />
          </span>
        </div>
      </div>
    </button>
  );
}

export function FabricCareGrid({ fabrics }: { fabrics: FabricType[] }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<FabricType | null>(null);
  // Deep link: /care-guide?fabric=khadi opens that fabric, so the popup is
  // shareable and the back button closes it.
  //
  // This deliberately reads location/history directly rather than using
  // useSearchParams(): that hook forces a statically-rendered page to bail out
  // of prerendering, which shipped this entire grid as an empty Suspense
  // fallback — no fabric cards, no search, nothing in the HTML for crawlers or
  // for anyone before hydration. Reading the URL on mount keeps the page
  // server-rendered; the popup just resolves a beat later.
  const openBySlug = useCallback(
    (slug: string | null) => {
      setSelected(slug ? (fabrics.find((f) => f.slug === slug) ?? null) : null);
    },
    [fabrics],
  );

  useEffect(() => {
    const fromUrl = () => new URLSearchParams(window.location.search).get("fabric");
    openBySlug(fromUrl());
    // Back/forward should close or reopen the popup.
    const onPop = () => openBySlug(fromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [openBySlug]);

  const open = useCallback((f: FabricType) => {
    setSelected(f);
    window.history.pushState(null, "", `/care-guide?fabric=${encodeURIComponent(f.slug)}`);
  }, []);

  const close = useCallback(() => {
    setSelected(null);
    window.history.pushState(null, "", "/care-guide");
  }, []);

  // Searching only the name meant "tumble dry" or "embroidery" returned
  // nothing, even though the answer was sitting in the care text.
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return fabrics;
    return fabrics.filter((f) =>
      [f.name, f.details, f.care_detail, f.at_a_glance, f.washing, f.drying, f.ironing, f.storage]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query)),
    );
  }, [q, fabrics]);

  return (
    <div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a fabric, or a care step"
          className="w-full rounded-full border border-border bg-background py-3 pl-11 pr-4 text-sm outline-none focus:border-primary"
          aria-label="Search fabrics and care instructions"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing matches &ldquo;{q}&rdquo;.
          </p>
          <button onClick={() => setQ("")} className="mt-3 text-sm text-primary underline underline-offset-4">
            Show all fabrics
          </button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filtered.map((f) => (
            <FabricCard key={f.id} fabric={f} onOpen={() => open(f)} />
          ))}
        </div>
      )}

      <FabricCareModal fabric={selected} onClose={close} />
    </div>
  );
}

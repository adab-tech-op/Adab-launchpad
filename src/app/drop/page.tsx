import type { Metadata } from "next";
import { getDropContent } from "@/lib/page-content-server";
import { getDropProducts, getPreviousDropDate, type DropProduct } from "@/lib/products";
import { emptyPageHero, type PageHero } from "@/lib/page-content";
import { ProductCard } from "@/components/site/ProductCard";
import { HeroBackground } from "@/components/site/HeroBackground";
import { overlayStyle } from "@/lib/hero";
import { timeAgo } from "@/lib/drop";
import { DropCountdown } from "./drop-countdown";
import { DropNotify } from "./drop-notify";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "The Drop — ADAB",
  description: "Limited ADAB pieces, released on a date. Get notified before they drop.",
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.adab.world";

// Each upcoming product's hero: its own drop_hero, else a fallback from its image/name.
function heroFor(p: DropProduct): PageHero {
  if (p.dropHero && (p.dropHero.hero?.desktop || p.dropHero.heading || p.dropHero.subcopy)) return p.dropHero;
  const h = emptyPageHero();
  h.hero.desktop = p.images[0] ?? "";
  h.heading = p.name;
  h.overlay = { enabled: true, color: "#000000", opacity: 40, from: "bottom" };
  return h;
}

export default async function DropPage() {
  const [content, { upcoming, available }, prevDate] = await Promise.all([
    getDropContent(),
    getDropProducts(),
    getPreviousDropDate(),
  ]);

  return (
    <>
      {/* One hero section per upcoming product, soonest-first */}
      {upcoming.map((p) => {
        const hero = heroFor(p);
        const ov = overlayStyle(hero.overlay);
        return (
          <section key={p.slug} className={`relative flex min-h-[70vh] items-center justify-center overflow-hidden px-5 py-20 text-center ${!hero.hero.desktop ? "bg-foreground" : ""}`}>
            <HeroBackground images={hero.hero} />
            {ov && <div className="absolute inset-0" style={ov} />}
            <div className="relative z-10 mx-auto max-w-3xl">
              <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: hero.subcopyColor, opacity: 0.85 }}>Upcoming</span>
              <h2 className="mt-2 whitespace-pre-line font-display text-4xl leading-[1.05] md:text-6xl" style={{ color: hero.headingColor }}>{hero.heading || p.name}</h2>
              {hero.subcopy && <p className="mx-auto mt-3 max-w-xl font-editorial text-lg md:text-2xl" style={{ color: hero.subcopyColor }}>{hero.subcopy}</p>}
              {p.dropDate && (
                <div className="mt-8">
                  <DropCountdown target={p.dropDate} url={`${SITE_URL}/product/${p.slug}`} title={p.name} />
                </div>
              )}
              <div className="mt-8 flex flex-col items-center gap-2">
                <p className="text-[11px] uppercase tracking-[0.08em]" style={{ color: hero.subcopyColor, opacity: 0.8 }}>Notify me when it drops</p>
                <DropNotify productSlug={p.slug} />
              </div>
            </div>
          </section>
        );
      })}

      {/* Available now */}
      {available.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 md:px-8 py-16">
          <h2 className="font-display text-xs uppercase tracking-[0.08em] text-muted-foreground">Available now</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
            {available.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </section>
      )}

      {/* Default "what's next" section — always at the bottom (unless switched off) */}
      {(content.announcementEnabled ?? true) && (
        <DefaultSection content={content} prevDate={prevDate} />
      )}
    </>
  );
}

function DefaultSection({ content, prevDate }: { content: Awaited<ReturnType<typeof getDropContent>>; prevDate: string | null }) {
  const ov = overlayStyle(content.overlay);
  const hasImage = !!content.hero.desktop;
  return (
    <section className={`relative flex min-h-[70vh] items-center justify-center overflow-hidden px-5 py-20 text-center ${!hasImage ? "bg-foreground" : ""}`}>
      <HeroBackground images={content.hero} />
      {ov && <div className="absolute inset-0" style={ov} />}
      <div className="relative z-10 mx-auto max-w-3xl">
        {content.heading && <h2 className="whitespace-pre-line font-display text-4xl leading-[1.05] md:text-6xl" style={{ color: content.headingColor }}>{content.heading}</h2>}
        {content.subcopy && <p className="mx-auto mt-3 max-w-xl font-editorial text-lg md:text-2xl" style={{ color: content.subcopyColor }}>{content.subcopy}</p>}
        <div className="mt-8">
          {content.nextDropDate ? (
            <DropCountdown target={content.nextDropDate} url={`${SITE_URL}/drop`} title="ADAB Drop" />
          ) : (
            <p className="text-sm uppercase tracking-[0.08em]" style={{ color: content.subcopyColor }}>No drop scheduled yet</p>
          )}
        </div>
        {prevDate && <p className="mt-5 text-xs" style={{ color: content.subcopyColor, opacity: 0.75 }}>Previous drop {timeAgo(prevDate)}</p>}
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-[11px] uppercase tracking-[0.08em]" style={{ color: content.subcopyColor, opacity: 0.8 }}>Get notified</p>
          <DropNotify />
        </div>
      </div>
    </section>
  );
}

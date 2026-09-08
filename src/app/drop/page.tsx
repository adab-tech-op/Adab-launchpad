import type { Metadata } from "next";
import { getDropContent } from "@/lib/page-content-server";
import { getDropProducts, getPreviousDropDate, type DropProduct } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { HeroBackground } from "@/components/site/HeroBackground";
import { overlayStyle } from "@/lib/hero";
import { formatDhaka, timeAgo } from "@/lib/drop";
import { DropCountdown } from "./drop-countdown";
import { DropNotify } from "./drop-notify";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "The Drop — ADAB",
  description: "Limited ADAB pieces, released on a date. Get notified before they drop.",
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.adab.world";

export default async function DropPage() {
  const [content, { upcoming, available }, prevDate] = await Promise.all([
    getDropContent(),
    getDropProducts(),
    getPreviousDropDate(),
  ]);
  const overlay = overlayStyle(content.overlay);
  const nextDate = upcoming[0]?.dropDate ?? null;
  const hasImage = !!content.hero.desktop;

  return (
    <>
      <section
        className={`relative flex min-h-[80vh] items-center justify-center overflow-hidden px-5 py-24 text-center ${!hasImage ? "bg-foreground" : ""}`}
      >
        <HeroBackground images={content.hero} />
        {overlay && <div className="absolute inset-0" style={overlay} />}

        <div className="relative z-10 mx-auto max-w-3xl">
          {content.heading && (
            <h1 className="whitespace-pre-line font-display text-5xl leading-[1.05] md:text-7xl" style={{ color: content.headingColor }}>
              {content.heading}
            </h1>
          )}
          {content.subcopy && (
            <p className="mx-auto mt-4 max-w-xl font-editorial text-xl md:text-2xl" style={{ color: content.subcopyColor }}>
              {content.subcopy}
            </p>
          )}

          <div className="mt-10">
            {nextDate ? (
              <DropCountdown target={nextDate} url={`${SITE_URL}/drop`} title="ADAB Drop" />
            ) : (
              <p className="text-sm uppercase tracking-[0.08em]" style={{ color: content.subcopyColor }}>
                No drop scheduled yet
              </p>
            )}
          </div>

          {prevDate && (
            <p className="mt-5 text-xs" style={{ color: content.subcopyColor, opacity: 0.75 }}>
              Previous drop {timeAgo(prevDate)}
            </p>
          )}

          <div className="mt-8 flex flex-col items-center gap-2">
            <p className="text-[11px] uppercase tracking-[0.08em]" style={{ color: content.subcopyColor, opacity: 0.8 }}>
              Get notified
            </p>
            <div className="flex justify-center">
              <DropNotify />
            </div>
          </div>
        </div>
      </section>

      {available.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 md:px-8 py-16">
          <h2 className="font-display text-xs uppercase tracking-[0.08em] text-muted-foreground">Available now</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
            {available.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 md:px-8 py-16">
          <h2 className="font-display text-xs uppercase tracking-[0.08em] text-muted-foreground">Dropping soon</h2>
          <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
            {upcoming.map((p) => (
              <UpcomingCard key={p.slug} p={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function UpcomingCard({ p }: { p: DropProduct }) {
  const img = p.images[0];
  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-paper">
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-foreground/85 px-3 py-1 text-[10px] uppercase tracking-[0.05em] text-background">
          Upcoming
        </span>
      </div>
      <h3 className="mt-3 font-editorial text-xl">{p.name}</h3>
      {p.dropDate && (
        <p className="mt-1 text-[11px] uppercase tracking-[0.05em] text-muted-foreground">Drops {formatDhaka(p.dropDate)}</p>
      )}
      <div className="mt-3">
        <DropNotify productSlug={p.slug} compact />
      </div>
    </div>
  );
}

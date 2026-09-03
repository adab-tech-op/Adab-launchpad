import type { Metadata } from "next";
import { getScrapbookImages } from "@/lib/scrapbook-server";
import { ScrapbookCtaTile } from "@/components/site/ScrapbookCtaTile";

export const metadata: Metadata = {
  title: "Scrapbook — ADAB",
  description:
    "People, places, textures, and moments around Adab. Premium heritage-fusion menswear from Bangladesh.",
};

export const revalidate = 60; // ISR: admin edits appear within ~1 min

export default async function ScrapbookPage() {
  const images = await getScrapbookImages();

  // Drop the "Share your ADAB moment" CTA into the grid as a masonry tile,
  // roughly a third of the way in (after up to 4 images) so it reads as part of
  // the scrapbook rather than a footer. With fewer images it lands at the end.
  const insertAt = Math.min(4, images.length);
  const tiles = images.map((img) => (
    <figure
      key={img.id}
      className="group relative mb-3 break-inside-avoid overflow-hidden rounded-lg md:mb-4"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.image_url}
        alt={img.caption || "ADAB scrapbook"}
        className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />
      {img.caption && (
        <figcaption className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-foreground/70 to-transparent p-4 pt-12 text-sm text-background transition-transform duration-500 group-hover:translate-y-0">
          {img.caption}
        </figcaption>
      )}
    </figure>
  ));

  const grid = [
    ...tiles.slice(0, insertAt),
    <ScrapbookCtaTile key="cta" className="mb-3 md:mb-4" />,
    ...tiles.slice(insertAt),
  ];

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 md:px-8 pt-20 md:pt-28 pb-12">
        <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">Scrapbook</p>
        <h1 className="mt-3 font-editorial text-5xl md:text-6xl">Scrapbook.</h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
          People, places, textures, and moments around Adab.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 md:px-8 pb-24">
        {images.length === 0 ? (
          <div className="mx-auto max-w-md">
            <ScrapbookCtaTile />
          </div>
        ) : (
          <div className="columns-2 gap-3 md:columns-3 md:gap-4">{grid}</div>
        )}
      </section>
    </>
  );
}

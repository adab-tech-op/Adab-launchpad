import type { Metadata } from "next";
import { getScrapbookImages } from "@/lib/scrapbook-server";

export const metadata: Metadata = {
  title: "Scrapbook — ADAB",
  description:
    "People, places, textures, and moments around Adab. Premium heritage-fusion menswear from Bangladesh.",
};

export const revalidate = 60; // ISR: admin edits appear within ~1 min

const MAILTO =
  "mailto:info@adab.world" +
  "?subject=" + encodeURIComponent("My ADAB moment") +
  "&body=" + encodeURIComponent(
    "Hi ADAB team,\n\nHere's my ADAB moment (photo attached).\n\nName / handle:\nWhere it was taken:\n\nThank you!"
  );

export default async function ScrapbookPage() {
  const images = await getScrapbookImages();

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 md:px-8 pt-20 md:pt-28 pb-12">
        <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">Scrapbook</p>
        <h1 className="mt-3 font-editorial text-5xl md:text-6xl">Scrapbook.</h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
          People, places, textures, and moments around Adab.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 md:px-8 pb-16">
        {images.length === 0 ? (
          <p className="text-sm text-muted-foreground">The scrapbook is being put together — check back soon.</p>
        ) : (
          <div className="columns-2 gap-3 md:columns-3 md:gap-4">
            {images.map((img) => (
              <figure key={img.id} className="group relative mb-3 break-inside-avoid overflow-hidden rounded-lg md:mb-4">
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
            ))}
          </div>
        )}
      </section>

      {/* Share CTA — mail us your moment (no on-site form) */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 pb-24">
        <div className="rounded-2xl border border-border p-8 text-center md:p-12 paper-grain">
          <h2 className="font-editorial text-3xl md:text-4xl">Share your ADAB moment.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Wearing Adab? Caught a moment that fits? Email it to us — a favourite few make the Scrapbook.
          </p>
          <a
            href={MAILTO}
            className="mt-8 inline-block rounded-full bg-foreground px-7 py-3 text-sm uppercase tracking-[0.12em] text-background transition-opacity hover:opacity-90"
          >
            Email your moment
          </a>
        </div>
      </section>
    </>
  );
}

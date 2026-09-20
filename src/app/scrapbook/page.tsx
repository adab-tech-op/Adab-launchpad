import type { Metadata } from "next";
import { getScrapbookImages } from "@/lib/scrapbook-server";
import { ScrapbookCtaTile } from "@/components/site/ScrapbookCtaTile";
import { ScrapbookBoard } from "@/components/site/ScrapbookBoard";
import type { ScrapbookImage } from "@/lib/scrapbook";

export const metadata: Metadata = {
  title: "Scrapbook — ADAB",
  description:
    "People, places, textures, and moments around Adab. Premium heritage-fusion menswear from Bangladesh.",
};

export const revalidate = 60; // ISR: admin edits appear within ~1 min

/** Group tiles by their label, preserving sort order and keeping ungrouped
 *  items together. A scrapbook has chronology; a flat grid has none — the
 *  dividers are what turn a pile into a sequence. */
function groupTiles(images: ScrapbookImage[]): { label: string; items: ScrapbookImage[] }[] {
  const groups: { label: string; items: ScrapbookImage[] }[] = [];
  for (const img of images) {
    const label = img.group_label.trim();
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(img);
    else groups.push({ label, items: [img] });
  }
  return groups;
}

export default async function ScrapbookPage() {
  const images = await getScrapbookImages();
  const groups = groupTiles(images);

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 md:px-8 pt-20 md:pt-28 pb-12">
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
          groups.map((group, gi) => (
            <div key={`${group.label}-${gi}`} className={gi > 0 ? "mt-20 md:mt-24" : ""}>
              {group.label && (
                <div className="mb-8 flex items-center gap-5">
                  <h2 className="shrink-0 font-display text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {group.label}
                  </h2>
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                </div>
              )}
              <ScrapbookBoard
                items={group.items}
                cta={gi === 0 ? <ScrapbookCtaTile key="cta" /> : undefined}
              />
            </div>
          ))
        )}
      </section>
    </>
  );
}

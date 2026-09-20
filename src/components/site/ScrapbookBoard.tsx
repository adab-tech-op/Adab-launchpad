import { ScrapbookTile } from "@/components/site/ScrapbookTile";
import { COLLAGE_COLUMNS, type ScrapbookImage } from "@/lib/scrapbook";
import type { ReactNode } from "react";

/**
 * The collage board.
 *
 * Three layouts, same cards, progressively calmer:
 *
 *  - Desktop (lg+): the authored board. Each card sits where an admin placed
 *    it on a 12-column grid, nudged up or down so cards tuck under each other,
 *    rotated by its own authored angle. Overlap is the point.
 *
 *  - Tablet (sm–lg): two columns in sort order, tilt kept, and only the small
 *    alternating offset that overlaps across the seam. Authored placement is
 *    ignored — a board composed for 12 columns doesn't survive being squeezed
 *    into 2.
 *
 *  - Mobile (<sm): one column, tilt kept, overlap dropped entirely. At this
 *    width a card overlapping by even a little would cover the caption below
 *    it, and captions carry the provenance that makes this a scrapbook.
 *
 * All three render from the same markup — the layout switches, the DOM order
 * does not, so screen readers and keyboard order always follow sort order.
 */
export function ScrapbookBoard({ items, cta }: { items: ScrapbookImage[]; cta?: ReactNode }) {
  // The CTA lands a third of the way in so it reads as another pinned card
  // rather than a footer.
  const insertAt = Math.min(4, items.length);

  return (
    <>
      {/* Desktop — authored board */}
      <div className="hidden lg:grid lg:auto-rows-min lg:grid-cols-12 lg:gap-x-6">
        {items.map((img, i) => (
          <div
            key={img.id}
            className="min-w-0"
            style={{
              gridColumn: `${clampStart(img) + 1} / span ${clampSpan(img)}`,
              marginTop: `${img.nudge_y}px`,
              // Later cards sit above earlier ones, so a card tucks under the
              // one before it rather than punching through — and an object
              // card lifts above the photos it overlaps.
              zIndex: img.kind === "object" ? 40 + i : 10 + i,
              marginBottom: "2.25rem",
            }}
          >
            <ScrapbookTile img={img} />
          </div>
        ))}
        {cta && (
          <div className="min-w-0" style={{ gridColumn: "span 4", marginBottom: "2.25rem", zIndex: 5 }}>
            {cta}
          </div>
        )}
      </div>

      {/* Tablet — two columns, overlap only across the seam */}
      <div className="hidden sm:grid sm:grid-cols-2 sm:gap-x-6 lg:hidden">
        {withCta(items, insertAt, cta).map((node, i) => (
          <div key={i} className="min-w-0" style={{ marginTop: i % 2 === 1 ? "2.5rem" : 0, marginBottom: "2rem" }}>
            {node}
          </div>
        ))}
      </div>

      {/* Mobile — single column, tilt only */}
      <div className="grid grid-cols-1 sm:hidden">
        {withCta(items, insertAt, cta).map((node, i) => (
          <div key={i} className="min-w-0" style={{ marginBottom: "2rem" }}>
            {node}
          </div>
        ))}
      </div>
    </>
  );
}

function withCta(items: ScrapbookImage[], insertAt: number, cta?: ReactNode): ReactNode[] {
  const tiles = items.map((img) => <ScrapbookTile key={img.id} img={img} />);
  if (!cta) return tiles;
  return [...tiles.slice(0, insertAt), cta, ...tiles.slice(insertAt)];
}

// The DB has CHECK constraints for these, but a row written before this
// migration (or by hand) shouldn't be able to break the grid.
function clampStart(img: ScrapbookImage): number {
  return Math.min(Math.max(img.col_start ?? 0, 0), COLLAGE_COLUMNS - 2);
}

function clampSpan(img: ScrapbookImage): number {
  const span = Math.min(Math.max(img.col_span ?? 4, 2), COLLAGE_COLUMNS);
  return Math.min(span, COLLAGE_COLUMNS - clampStart(img));
}

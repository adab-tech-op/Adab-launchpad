import {
  objectTilt,
  provenanceOf,
  type ScrapbookImage,
} from "@/lib/scrapbook";

/** How a span breaks the uniform rhythm.
 *
 *  `wide` spans every column of the masonry flow (an arbitrary property —
 *  column-span isn't a core Tailwind utility), but only from `sm` up: on a
 *  single-column phone layout every tile is already full width.
 *
 *  `tall` and `wide` crop to a fixed ratio so they read as deliberate
 *  compositions; `normal` keeps the image's own proportions, which is what
 *  makes the column heights uneven in the first place. */
const FIGURE_SPAN: Record<string, string> = {
  normal: "",
  tall: "",
  wide: "sm:[column-span:all]",
};

const MEDIA_SPAN: Record<string, string> = {
  normal: "",
  tall: "aspect-[2/3]",
  wide: "aspect-[16/9]",
};

/**
 * One scrapbook tile.
 *
 * A photograph is full-bleed with its provenance sitting *under* the image,
 * always visible — not a hover overlay. A scrapbook's whole emotional
 * mechanism is knowing who and where; hiding that until mouseover throws it
 * away, and on touch there is no hover at all.
 *
 * An object (swatch, thread card, handwritten note, sample tag) sits on paper
 * stock with a slight, stable tilt. That single difference is what stops the
 * page reading as a lookbook — it makes the grid feel like a collection of
 * things rather than a feed of pictures.
 */
export function ScrapbookTile({ img }: { img: ScrapbookImage }) {
  const isObject = img.kind === "object";
  const provenance = provenanceOf(img);
  const hasMeta = !!(img.caption || img.caption_bn || provenance || img.credit);

  // An object scan is never cropped — a swatch or a note has to be seen whole.
  const mediaSpan = isObject ? "" : (MEDIA_SPAN[img.span] ?? "");
  const media = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={img.image_url}
      alt={img.caption || img.caption_bn || "ADAB scrapbook"}
      className={
        isObject
          ? "w-full object-contain"
          : `w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] ${mediaSpan}`
      }
      loading="lazy"
    />
  );

  return (
    <figure
      className={`group mb-4 break-inside-avoid md:mb-5 ${isObject ? "" : (FIGURE_SPAN[img.span] ?? "")}`}
      style={isObject ? { transform: `rotate(${objectTilt(img.id)}deg)` } : undefined}
    >
      <div
        className={
          isObject
            ? "paper-grain overflow-hidden rounded-sm border border-border bg-paper p-3 shadow-[0_2px_10px_rgba(28,28,28,0.07)]"
            : "overflow-hidden rounded-lg"
        }
      >
        {media}
      </div>

      {hasMeta && (
        <figcaption className={`mt-3 ${isObject ? "px-3" : ""}`}>
          {img.caption && (
            <p className="font-editorial text-lg leading-snug text-foreground">{img.caption}</p>
          )}
          {img.caption_bn && (
            <p className="mt-0.5 font-sans text-sm leading-[1.8] text-foreground/75">{img.caption_bn}</p>
          )}
          {(provenance || img.credit) && (
            <p className="mt-1.5 text-[11px] uppercase tracking-[0.07em] text-muted-foreground">
              {provenance}
              {provenance && img.credit ? " · " : ""}
              {/* Attribution without the borrowed social-media chrome: a real
                  person stood there, stated plainly. */}
              {img.credit && <span className="normal-case tracking-normal">— {img.credit}</span>}
            </p>
          )}
        </figcaption>
      )}
    </figure>
  );
}

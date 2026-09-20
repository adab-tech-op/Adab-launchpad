import { provenanceOf, tiltOf, type ScrapbookImage } from "@/lib/scrapbook";
import { BlurImage } from "@/components/site/BlurImage";

/** Fixed ratios so a card reads as a deliberate composition. `normal` keeps
 *  the image's own proportions, which is what makes the board uneven. */
const MEDIA_RATIO: Record<string, string> = {
  normal: "",
  tall: "aspect-[2/3]",
  wide: "aspect-[16/9]",
};

/**
 * One card on the board.
 *
 * A photograph gets a lift shadow; an object (swatch, thread card, note, tag)
 * sits on paper stock with tape at its top edge and is never cropped — a
 * swatch has to be seen whole. That difference is what stops the page reading
 * as a lookbook.
 *
 * Provenance sits under the image, always visible. Hiding it behind hover
 * would throw away the whole mechanism, and on touch there is no hover at all.
 */
export function ScrapbookTile({ img, tilt = true }: { img: ScrapbookImage; tilt?: boolean }) {
  const isObject = img.kind === "object";
  const provenance = provenanceOf(img);
  const hasMeta = !!(img.caption || img.caption_bn || provenance || img.credit);
  const deg = tilt ? tiltOf(img) : 0;

  return (
    <figure
      className="group"
      style={deg ? { transform: `rotate(${deg}deg)` } : undefined}
    >
      {isObject ? (
        <div className="paper-grain relative rounded-sm border border-border bg-paper p-3 shadow-[0_12px_30px_rgba(28,28,28,0.16)]">
          {/* Tape — the cheapest bit of physicality, and it costs nothing at
              any width, so it survives all the way down to mobile. */}
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-[-10px] h-5 w-[78px] -translate-x-1/2 rotate-[-3deg] bg-[color:var(--border)]/70"
          />
          <BlurImage
            src={img.image_url}
            alt={img.caption || img.caption_bn || "ADAB scrapbook"}
            className="w-full rounded-[2px] object-contain"
            wrapperClassName="rounded-[2px]"
          />
          {hasMeta && <Meta img={img} provenance={provenance} className="px-1 pb-1" />}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg shadow-[0_12px_30px_rgba(28,28,28,0.17)]">
            <BlurImage
              src={img.image_url}
              alt={img.caption || img.caption_bn || "ADAB scrapbook"}
              className={`w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] ${MEDIA_RATIO[img.span] ?? ""}`}
            />
          </div>
          {hasMeta && <Meta img={img} provenance={provenance} />}
        </>
      )}
    </figure>
  );
}

function Meta({
  img,
  provenance,
  className = "",
}: {
  img: ScrapbookImage;
  provenance: string;
  className?: string;
}) {
  return (
    <figcaption className={`mt-2.5 ${className}`}>
      {img.caption && <p className="font-editorial text-lg leading-snug text-foreground">{img.caption}</p>}
      {img.caption_bn && <p className="mt-0.5 font-sans text-sm leading-[1.8] text-foreground/75">{img.caption_bn}</p>}
      {(provenance || img.credit) && (
        <p className="mt-1.5 text-[11px] uppercase tracking-[0.07em] text-muted-foreground">
          {provenance}
          {provenance && img.credit ? " · " : ""}
          {/* Attribution without borrowed social chrome: a real person stood
              there, stated plainly. No invented metrics. */}
          {img.credit && <span className="normal-case tracking-normal">— {img.credit}</span>}
        </p>
      )}
    </figcaption>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { lqipUrl } from "@/lib/lqip";

/**
 * A photograph that comes into focus rather than fading in.
 *
 * A tiny pre-blurred placeholder (~1-2 kB) paints immediately, then the real
 * image cross-fades over it once decoded. The effect reads as a lens pulling
 * focus — which on a heritage-menswear scrapbook is the right metaphor — and
 * unlike a plain opacity fade it does real work: no empty box while a large
 * photo downloads, and no flash of background.
 *
 * Deliberately not a CSS blur animation. `filter: blur()` repaints every frame
 * and its cost scales with area, so blurring a dozen large cards is where a
 * mid-range phone starts dropping frames. The blur here is baked into the
 * placeholder by Cloudinary, so the browser only ever composites two images.
 *
 * Images that can't be transformed (local /assets, third-party) degrade to a
 * plain fade — still smooth, just without the focus pull.
 */
export function BlurImage({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  eager = false,
  style,
}: {
  src: string;
  alt: string;
  /** Classes for the <img> itself — pass object-cover, aspect ratios, etc. */
  className?: string;
  /** Classes for the positioned wrapper that holds the placeholder layer. */
  wrapperClassName?: string;
  eager?: boolean;
  style?: React.CSSProperties;
}) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const placeholder = lqipUrl(src);

  // A cached image can finish before React attaches onLoad, which would leave
  // it stuck behind the placeholder forever.
  useEffect(() => {
    if (ref.current?.complete) setLoaded(true);
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`} style={style}>
      {placeholder && !loaded && (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${placeholder}")` }}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        // If the real image 404s, don't strand the visitor on a blurred smear.
        onError={() => setLoaded(true)}
        className={`relative transition-opacity duration-700 ease-out motion-reduce:transition-none ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
      />
    </div>
  );
}

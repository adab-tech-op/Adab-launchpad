"use client";

import { type HeroOverlay, type OverlayFrom, overlayStyle } from "@/lib/hero";

const GRID: OverlayFrom[] = [
  "top-left", "top", "top-right",
  "left", "solid", "right",
  "bottom-left", "bottom", "bottom-right",
];

const ARROW: Record<OverlayFrom, string> = {
  solid: "■",
  top: "↑",
  bottom: "↓",
  left: "←",
  right: "→",
  "top-left": "↖",
  "top-right": "↗",
  "bottom-left": "↙",
  "bottom-right": "↘",
};

export function HeroOverlayEditor({
  value,
  onChange,
  previewImage,
}: {
  value: HeroOverlay;
  onChange: (o: HeroOverlay) => void;
  previewImage?: string;
}) {
  const set = (patch: Partial<HeroOverlay>) => onChange({ ...value, ...patch });
  const style = overlayStyle(value);

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.14em]">Overlay</span>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={value.enabled} onChange={(e) => set({ enabled: e.target.checked })} className="accent-foreground" />
          Show
        </label>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        A colour wash over the image for legibility. Choose which edge it appears from (or solid), its colour, and strength.
      </p>

      {value.enabled && (
        <div className="mt-3 flex flex-wrap items-start gap-6">
          <div>
            <p className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Appears from</p>
            <div className="grid grid-cols-3 gap-1">
              {GRID.map((f) => (
                <button
                  key={f}
                  type="button"
                  title={f === "solid" ? "Solid (whole image)" : `From ${f.replace("-", " ")}`}
                  onClick={() => set({ from: f })}
                  className={`grid h-7 w-7 place-items-center rounded text-sm ${
                    value.from === f
                      ? "bg-foreground text-background"
                      : "border border-border text-muted-foreground hover:border-foreground"
                  }`}
                >
                  {ARROW[f]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Colour</span>
              <div className="mt-1 flex items-center gap-2">
                <input type="color" value={value.color} onChange={(e) => set({ color: e.target.value })} className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent" />
                <input type="text" value={value.color} onChange={(e) => set({ color: e.target.value })} className="w-24 rounded border border-border bg-transparent px-2 py-1 text-sm" />
              </div>
            </label>
            <label className="block">
              <span className="flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Opacity <span className="tabular-nums">{value.opacity}%</span>
              </span>
              <input type="range" min={0} max={100} value={value.opacity} onChange={(e) => set({ opacity: Number(e.target.value) })} className="mt-1 w-40 accent-foreground" />
            </label>
          </div>

          {previewImage && (
            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Preview</p>
              <div className="relative h-24 w-40 overflow-hidden rounded-md ring-1 ring-border">
                <div className="absolute inset-0" style={{ backgroundImage: `url("${previewImage}")`, backgroundSize: "cover", backgroundPosition: "center" }} />
                {style && <div className="absolute inset-0" style={style} />}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Search, X, Droplets, Wind, Flame, Package, type LucideIcon } from "lucide-react";
import { CARE_SECTIONS, type FabricType } from "@/lib/fabrics";
import { ModalShell } from "@/components/site/ModalShell";

const SECTION_ICONS: Record<string, LucideIcon> = {
  washing: Droplets,
  drying: Wind,
  ironing: Flame,
  storage: Package,
};

function FabricThumb({ fabric }: { fabric: FabricType }) {
  if (fabric.thumbnail_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={fabric.thumbnail_url} alt="" className="h-full w-full object-cover" />
    );
  }
  return <div className="h-full w-full bg-muted" aria-hidden="true" />;
}

function FabricCard({ fabric, onOpen }: { fabric: FabricType; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex items-stretch gap-4 rounded-2xl border border-border p-4 text-left transition-colors hover:border-primary/60 sm:gap-5 sm:p-5"
    >
      <div className="h-auto w-28 shrink-0 overflow-hidden rounded-xl sm:w-36">
        <FabricThumb fabric={fabric} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-sans text-lg sm:text-xl">{fabric.name}</h3>
        <div className="mt-2 min-h-[4.5rem] rounded-lg border border-border p-3 text-xs leading-relaxed text-muted-foreground line-clamp-4">
          {fabric.details || fabric.care_detail || "Care details coming soon."}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
          {CARE_SECTIONS.map(({ key, label }, i) => (
            <span key={key} className="flex items-center gap-3">
              {i > 0 && <span className="text-border">·</span>}
              {label}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

function FabricCareModal({ fabric, onClose }: { fabric: FabricType | null; onClose: () => void }) {
  return (
    <ModalShell open={!!fabric} onClose={onClose} labelledBy="fabric-care-modal-title" className="max-w-lg">
      {fabric && (
        <>
          <button onClick={onClose} className="absolute right-4 top-4 z-10 p-2 text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <div className="max-h-[85vh] overflow-y-auto p-8 sm:p-10">
            {fabric.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fabric.thumbnail_url} alt="" className="h-36 w-full rounded-xl object-cover" />
            )}
            <h3 id="fabric-care-modal-title" className="mt-6 font-sans text-3xl leading-tight">
              {fabric.name}
            </h3>
            {(fabric.details || fabric.care_detail) && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{fabric.details || fabric.care_detail}</p>
            )}

            <div className="mt-8 space-y-6 border-t border-border pt-6">
              {CARE_SECTIONS.map(({ key, label }) => {
                const Icon = SECTION_ICONS[key] ?? Package;
                const body = fabric[key];
                if (!body) return null;
                return (
                  <div key={key}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" strokeWidth={1.25} />
                      <h4 className="font-sans text-sm uppercase tracking-[0.06em]">{label}</h4>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </ModalShell>
  );
}

export function FabricCareGrid({ fabrics }: { fabrics: FabricType[] }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<FabricType | null>(null);
  const query = q.trim().toLowerCase();
  const filtered = query === "" ? fabrics : fabrics.filter((f) => f.name.toLowerCase().includes(query));

  return (
    <div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a fabric — cotton, linen, khadi…"
          className="w-full rounded-full border border-border bg-background py-3 pl-11 pr-4 text-sm outline-none focus:border-primary"
          aria-label="Search fabrics"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">No fabric matches &ldquo;{q}&rdquo;.</p>
      ) : (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((f) => (
            <FabricCard key={f.id} fabric={f} onOpen={() => setSelected(f)} />
          ))}
        </div>
      )}

      <FabricCareModal fabric={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

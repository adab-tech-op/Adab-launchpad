"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { CARE_SECTIONS, type FabricType } from "@/lib/fabrics";
import { FabricCareModal } from "@/components/site/FabricCareModal";

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

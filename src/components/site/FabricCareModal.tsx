"use client";

import { X, Droplets, Wind, Flame, Package, type LucideIcon } from "lucide-react";
import { CARE_SECTIONS, type FabricType } from "@/lib/fabrics";
import { ModalShell } from "@/components/site/ModalShell";

const SECTION_ICONS: Record<string, LucideIcon> = {
  washing: Droplets,
  drying: Wind,
  ironing: Flame,
  storage: Package,
};

/** Fabric name + little details + full sectioned washing/drying/ironing/storage
 *  instructions, in a popup. Used by the Care Guide card grid and by the PDP's
 *  Care Guide row (keyed to the product's own fabric type). */
export function FabricCareModal({ fabric, onClose }: { fabric: FabricType | null; onClose: () => void }) {
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

"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { FabricType } from "@/lib/fabrics";

export function FabricSearch({ fabrics }: { fabrics: FabricType[] }) {
  const [q, setQ] = useState("");
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

      <div className="mt-10 divide-y divide-border border-t border-border">
        {filtered.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">No fabric matches &ldquo;{q}&rdquo;.</p>
        ) : (
          filtered.map((f) => (
            <div key={f.id} className="py-6">
              <h3 className="font-sans text-xl">{f.name}</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{f.care_detail}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

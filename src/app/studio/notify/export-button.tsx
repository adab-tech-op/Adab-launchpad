"use client";

import type { NotifyContact } from "@/lib/studio";

export function ExportButton({ contacts }: { contacts: NotifyContact[] }) {
  const download = () => {
    const header = "email,name,source,added_at";
    const rows = contacts.map((c) => {
      const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
      return [esc(c.email), esc(c.name ?? ""), esc(c.source), esc(c.addedAt)].join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adab-notify-list-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={download}
      disabled={contacts.length === 0}
      className="rounded-full border border-border px-4 py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-40"
    >
      Export CSV
    </button>
  );
}

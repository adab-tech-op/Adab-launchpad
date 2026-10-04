"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export type Contact = { email: string; name: string | null; source: string; addedAt: string };

/**
 * The stored source is a code path, not a sentence: "newsletter_modal" tells
 * you which component ran, not how somebody joined the list. Everything shown
 * to a person reads as English; the raw value stays in the CSV export, where a
 * machine is the reader.
 */
function sourceLabel(source: string): string {
  const s = source.toLowerCase();
  const news = s.includes("newsletter");
  const bought = s.includes("purchase");
  if (news && bought) return "Newsletter, then bought";
  if (bought) return "Bought something";
  if (s.includes("modal")) return "Newsletter popup";
  if (news) return "Newsletter";
  if (s.includes("waitlist")) return "Waitlist";
  return source.replace(/[._]+/g, " ");
}

const FILTERS = [
  { value: "all", label: "All sources" },
  { value: "newsletter", label: "Newsletter" },
  { value: "purchase", label: "Bought something" },
] as const;

export function NotifyClient({ contacts }: { contacts: Contact[] }) {
  const [q, setQ] = useState("");
  const [source, setSource] = useState<string>("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return contacts.filter((c) => {
      if (source !== "all" && !c.source.toLowerCase().includes(source)) return false;
      if (!query) return true;
      return [c.email, c.name ?? "", sourceLabel(c.source)].join(" ").toLowerCase().includes(query);
    });
  }, [contacts, q, source]);

  const field =
    "rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary";

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 md:max-w-sm">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search an email or a name"
            aria-label="Search contacts"
            className={`${field} w-full pl-11`}
          />
        </div>
        <select value={source} onChange={(e) => setSource(e.target.value)} className={field} aria-label="Filter by source">
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length === contacts.length
            ? `${contacts.length} ${contacts.length === 1 ? "contact" : "contacts"}`
            : `${filtered.length} of ${contacts.length}`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="paper-grain mt-6 rounded-2xl border border-border p-12 text-center">
          <p className="font-editorial text-2xl italic text-muted-foreground">
            {contacts.length === 0 ? "No opted-in contacts yet." : "Nothing matches that search."}
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-left text-xs text-primary-foreground/80">
                <th className="px-4 py-3 font-normal">Email</th>
                <th className="px-4 py-3 font-normal">Name</th>
                <th className="px-4 py-3 font-normal">How they joined</th>
                <th className="px-4 py-3 font-normal">Added</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.email} className="border-t border-border">
                  <td className="break-all px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.name ?? "no name given"}</td>
                  <td className="px-4 py-3">{sourceLabel(c.source)}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {new Date(c.addedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

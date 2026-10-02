"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { AUDIT_KINDS, describeAction, targetHref, type AuditKind } from "@/lib/audit-actions";

export type AuditEntry = {
  actorEmail: string;
  action: string;
  target: string | null;
  detail: Record<string, unknown> | null;
  createdAt: string;
};

const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "1", label: "Today" },
  { value: "30", label: "30 days" },
  { value: "all", label: "All time" },
] as const;

const PAGE = 40;

/** First name from an email, so entries read as sentences about people. */
function who(email: string, selfEmail: string): string {
  if (email.toLowerCase() === selfEmail.toLowerCase()) return "You";
  const name = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function dayKey(ts: string): string {
  return new Date(ts).toDateString();
}

function dayLabel(ts: string): string {
  const d = new Date(ts);
  const today = new Date().toDateString();
  const yest = new Date(Date.now() - 86400000).toDateString();
  if (d.toDateString() === today) return "Today";
  if (d.toDateString() === yest) return `Yesterday, ${d.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`;
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

function clock(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function ActivityClient({ entries, selfEmail }: { entries: AuditEntry[]; selfEmail: string }) {
  const [q, setQ] = useState("");
  const [actor, setActor] = useState("all");
  const [kind, setKind] = useState<AuditKind | "all">("all");
  const [range, setRange] = useState<string>("7");
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<string | null>(null);

  const actors = useMemo(
    () => Array.from(new Set(entries.map((e) => e.actorEmail))).sort(),
    [entries],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const cutoff = range === "all" ? 0 : Date.now() - Number(range) * 86400000;
    return entries.filter((e) => {
      if (actor !== "all" && e.actorEmail !== actor) return false;
      if (kind !== "all" && describeAction(e.action).kind !== kind) return false;
      if (cutoff && new Date(e.createdAt).getTime() < cutoff) return false;
      if (!query) return true;
      // Search covers the things you actually look for: an order ref, an
      // email, a product slug, and the words of the action itself.
      const hay = [e.actorEmail, e.target ?? "", describeAction(e.action).verb, JSON.stringify(e.detail ?? {})]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [entries, q, actor, kind, range]);

  const page = filtered.slice(0, shown);

  const groups = useMemo(() => {
    const out: { label: string; items: { entry: AuditEntry; id: string }[] }[] = [];
    page.forEach((entry, i) => {
      const label = dayLabel(entry.createdAt);
      const last = out[out.length - 1];
      const item = { entry, id: `${dayKey(entry.createdAt)}-${i}` };
      if (last && last.label === label) last.items.push(item);
      else out.push({ label, items: [item] });
    });
    return out;
  }, [page]);

  const exportCsv = () => {
    const rows = [
      ["timestamp_utc", "actor", "action", "target", "detail"],
      ...filtered.map((e) => [
        new Date(e.createdAt).toISOString(),
        e.actorEmail,
        e.action,
        e.target ?? "",
        JSON.stringify(e.detail ?? {}),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `adab-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const field =
    "rounded-full border border-white/20 bg-[#1b4a6b] px-4 py-2.5 text-sm text-[#dce7f0] outline-none placeholder:text-[#dce7f0]/60 focus:border-white/50";

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-xl text-sm text-muted-foreground">
          Every change made in Studio. Who, what, and when. Only root admins see this.
        </p>
        <button
          onClick={exportCsv}
          className="shrink-0 rounded-full bg-primary px-5 py-2 text-xs text-primary-foreground"
        >
          Export CSV
        </button>
      </div>

      {/* Filters. Without these the log stops being usable after the first week. */}
      <div className="mt-6 rounded-2xl bg-primary p-4 md:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_200px]">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShown(PAGE);
            }}
            placeholder="Search an order ref, an email, a product slug"
            className={field}
            aria-label="Search activity"
          />
          <select value={actor} onChange={(e) => setActor(e.target.value)} className={field} aria-label="Filter by person">
            <option value="all">Anyone</option>
            {actors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as AuditKind | "all")}
            className={field}
            aria-label="Filter by kind"
          >
            {AUDIT_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => {
                setRange(r.value);
                setShown(PAGE);
              }}
              className={`rounded-full px-4 py-1.5 text-xs transition-colors ${
                range === r.value
                  ? "bg-white text-foreground"
                  : "border border-white/20 bg-[#1b4a6b] text-[#dce7f0]"
              }`}
            >
              {r.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-[#cfd8e0]">
            {filtered.length} {filtered.length === 1 ? "event" : "events"}, newest first
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border p-12 text-center">
          <p className="font-editorial text-2xl italic text-muted-foreground">Nothing matches those filters.</p>
          <button
            onClick={() => {
              setQ("");
              setActor("all");
              setKind("all");
              setRange("all");
            }}
            className="mt-3 text-sm text-primary underline underline-offset-4"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {groups.map((g) => (
            <section key={g.label} className="mt-8">
              <p className="inline-block rounded-full bg-primary px-4 py-2 text-xs text-primary-foreground">{g.label}</p>
              <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
                {g.items.map(({ entry, id }) => {
                  const meta = describeAction(entry.action);
                  const href = targetHref(entry.action, entry.target);
                  const isOpen = open === id;
                  const detail = entry.detail ?? {};
                  const hasDiff = "from" in detail && "to" in detail;
                  const hasDetail = Object.keys(detail).length > 0;

                  return (
                    <div key={id} className="border-t border-border first:border-t-0">
                      <button
                        onClick={() => setOpen(isOpen ? null : id)}
                        aria-expanded={isOpen}
                        className="flex w-full items-start gap-3 px-5 py-3.5 text-left"
                      >
                        <span
                          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                            meta.destructive ? "bg-destructive" : "bg-border"
                          }`}
                        />
                        <span className="min-w-0 flex-1 text-sm">
                          <span className={meta.destructive ? "text-destructive" : ""}>
                            <strong className="font-medium">{who(entry.actorEmail, selfEmail)}</strong> {meta.verb}
                          </span>{" "}
                          {entry.target &&
                            (href ? (
                              <Link
                                href={href}
                                onClick={(e) => e.stopPropagation()}
                                className="text-primary underline underline-offset-4 break-all"
                              >
                                {entry.target}
                              </Link>
                            ) : (
                              <span className="break-all">{entry.target}</span>
                            ))}
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {clock(entry.createdAt)}
                        </span>
                        {hasDetail && (
                          <ChevronDown
                            className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </button>

                      {isOpen && hasDetail && (
                        <div className="px-5 pb-4 pl-[2.1rem]">
                          <div className="rounded-xl border border-border bg-background p-3.5 text-xs leading-relaxed">
                            {hasDiff ? (
                              <p>
                                <span className="text-muted-foreground">Changed </span>
                                <span className="text-destructive line-through">{String(detail.from)}</span>
                                <span className="text-muted-foreground"> to </span>
                                <span className="text-emerald-700">{String(detail.to)}</span>
                              </p>
                            ) : (
                              Object.entries(detail).map(([k, v]) => (
                                <p key={k}>
                                  <span className="text-muted-foreground">{k.replace(/_/g, " ")}: </span>
                                  {String(v)}
                                </p>
                              ))
                            )}
                            {/* Naming the zone matters: an ambiguous timestamp
                                during an incident is worse than none. */}
                            <p className="mt-2 text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleString("en-GB", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              , {Intl.DateTimeFormat().resolvedOptions().timeZone}, by {entry.actorEmail}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {shown < filtered.length && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setShown((s) => s + PAGE)}
                className="rounded-full border border-border px-5 py-2.5 text-sm hover:border-foreground"
              >
                Load older activity
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

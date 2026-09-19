"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { countdownParts, dropIcs, formatDhaka } from "@/lib/drop";

export function DropCountdown({
  target,
  title = "ADAB Drop",
  url,
  color,
}: {
  target: string;
  title?: string;
  url: string;
  /** Countdown colour, from the hero's timerColor. Omitted (e.g. on a light
   *  page) keeps the old inherited/muted treatment. */
  color?: string;
}) {
  const router = useRouter();
  const [parts, setParts] = useState(() => countdownParts(target));

  useEffect(() => {
    const id = setInterval(() => {
      const p = countdownParts(target);
      setParts(p);
      if (p.done) {
        clearInterval(id);
        router.refresh(); // auto-reveal: piece flips to buyable live
      }
    }, 1000);
    return () => clearInterval(id);
  }, [target, router]);

  const addToCalendar = () => {
    const blob = new Blob([dropIcs(title, target, url)], { type: "text/calendar;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "adab-drop.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  };

  // When a colour is supplied, everything in the block follows it — the
  // secondary bits at reduced opacity so the digits still read as primary.
  const digitStyle = color ? { color } : undefined;
  const mutedStyle = color ? { color, opacity: 0.75 } : undefined;
  const mutedCls = color ? "" : "text-muted-foreground";

  const cell = (n: number, label: string) => (
    <div className="flex flex-col items-center">
      <span className="font-display text-4xl tabular-nums md:text-6xl" style={digitStyle}>{String(n).padStart(2, "0")}</span>
      <span className={`mt-1 text-[10px] uppercase tracking-[0.08em] ${mutedCls}`} style={mutedStyle}>{label}</span>
    </div>
  );
  const sep = <span className={`font-display text-3xl md:text-5xl ${mutedCls}`} style={mutedStyle}>:</span>;

  return (
    <div>
      <div className="flex items-start justify-center gap-3 md:gap-6">
        {cell(parts.days, "days")}
        {sep}
        {cell(parts.hours, "hrs")}
        {sep}
        {cell(parts.minutes, "min")}
        {sep}
        {cell(parts.seconds, "sec")}
      </div>
      <div className={`mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs ${mutedCls}`} style={mutedStyle}>
        <span>Drops {formatDhaka(target)} (Bangladesh time)</span>
        <button onClick={addToCalendar} className={`underline underline-offset-4 ${color ? "hover:opacity-100" : "hover:text-foreground"}`}>
          Add to calendar
        </button>
      </div>
    </div>
  );
}

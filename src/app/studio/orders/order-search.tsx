"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

/**
 * Finding one order meant picking a status chip and reading down the page.
 * When a customer writes in they give a reference, a phone number or an email,
 * and support starts by finding their order — so that is what this searches,
 * plus the TrxID, because that is the value that appears on the bKash
 * statement you are reconciling against.
 *
 * Filtering is done in the DOM rather than by refetching: the page is a server
 * component rendering full order cards, and this keeps the filter instant
 * without turning all of it into client state.
 */
export function OrderSearch({ count }: { count: number }) {
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(count);

  useEffect(() => {
    const query = q.trim().toLowerCase();
    const cards = document.querySelectorAll<HTMLElement>("[data-order-card]");
    let visible = 0;
    cards.forEach((card) => {
      const hay = (card.dataset.search ?? "").toLowerCase();
      const match = !query || hay.includes(query);
      card.style.display = match ? "" : "none";
      if (match) visible += 1;
    });
    setShown(visible);
  }, [q, count]);

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <div className="relative min-w-0 flex-1 md:max-w-md">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.5}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Order ref, phone, email, or a bKash TrxID"
          aria-label="Search orders"
          className="w-full rounded-full border border-border bg-background py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary"
        />
      </div>
      {q.trim() && (
        <span className="text-xs text-muted-foreground">
          {shown} of {count} shown
        </span>
      )}
    </div>
  );
}

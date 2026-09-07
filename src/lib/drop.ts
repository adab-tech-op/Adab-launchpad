// Drop lifecycle — pure, client-safe. Given a product's drop fields, the window
// setting, and "now", derive its state and where it may appear. No DB imports.

export const DROP_WINDOW_DEFAULT = 7; // days before drop_date that it turns "upcoming"
export const DHAKA_OFFSET = "+06:00"; // Asia/Dhaka is a fixed UTC+6 (no DST)

export type DropState = "none" | "hidden" | "upcoming" | "available" | "concluded";

export type DropFields = {
  dropDate?: string | null;
  dropEnd?: string | null;
  inShop?: boolean;
  soldOut?: boolean;
};

/** Derive the drop state. "none" = no drop scheduled (manual status governs). */
export function dropStateOf(p: DropFields, windowDays: number, now: Date = new Date()): DropState {
  if (!p.dropDate) return "none";
  const t = now.getTime();
  const drop = new Date(p.dropDate).getTime();
  if (Number.isNaN(drop)) return "none";
  const end = p.dropEnd ? new Date(p.dropEnd).getTime() : null;
  const concluded = p.soldOut === true || (end !== null && !Number.isNaN(end) && t >= end);
  if (concluded) return "concluded";
  if (t >= drop) return "available";
  if (t >= drop - windowDays * 86_400_000) return "upcoming";
  return "hidden";
}

// ---- Visibility predicates (a normal, non-staff visitor) --------------------

/** Shown on /shop, home, search, sitemap. "none" defers to the manual status. */
export function isShopVisible(state: DropState, inShop = false): boolean {
  if (state === "none") return true;
  if (state === "available") return true;
  if (state === "concluded") return inShop; // resurfaced to shop only
  return false; // hidden, upcoming
}

/** Shown on /drop (the drop event page). */
export function isDropVisible(state: DropState): boolean {
  return state === "upcoming" || state === "available";
}

/** Visible anywhere to a normal user (used for the PDP 404 gate). */
export function isUserVisible(state: DropState, inShop = false): boolean {
  return isShopVisible(state, inShop) || isDropVisible(state);
}

/** May this piece be reserved/bought right now? Only gates drop-scheduled
 *  pieces; "none" products keep their existing (manual-status) behaviour. */
export function isDropPurchasable(state: DropState): boolean {
  return state === "available";
}

// ---- Timezone helpers (studio edits in Dhaka, stored as UTC instants) --------

/** "YYYY-MM-DDTHH:mm" (datetime-local, read as Dhaka time) → UTC ISO string. */
export function dhakaLocalToISO(local: string): string {
  if (!local) return "";
  const d = new Date(`${local}:00${DHAKA_OFFSET}`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

/** UTC ISO → "YYYY-MM-DDTHH:mm" in Dhaka, for a datetime-local input. */
export function isoToDhakaLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() + 6 * 3_600_000).toISOString().slice(0, 16);
}

/** Human date/time in Dhaka, e.g. "14 Jun 2026, 18:00". */
export function formatDhaka(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Rough "… ago" for the previous drop line. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const s = Math.max(0, Math.floor((now.getTime() - then) / 1000));
  const days = Math.floor(s / 86400);
  if (days >= 14) return `${Math.floor(days / 7)} weeks ago`;
  if (days >= 7) return `a week ago`;
  if (days >= 2) return `${days} days ago`;
  if (days >= 1) return `yesterday`;
  const h = Math.floor(s / 3600);
  if (h >= 1) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const m = Math.floor(s / 60);
  return m >= 1 ? `${m} minute${m > 1 ? "s" : ""} ago` : `just now`;
}

/** Countdown parts to a target instant. */
export function countdownParts(targetIso: string, now: Date = new Date()) {
  const diff = Math.max(0, new Date(targetIso).getTime() - now.getTime());
  return {
    total: diff,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
    done: diff === 0,
  };
}

/** Minimal .ics for an "Add to calendar" button on the countdown. */
export function dropIcs(title: string, startIso: string, url: string): string {
  const dt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = dt(startIso);
  const end = dt(new Date(new Date(startIso).getTime() + 3_600_000).toISOString());
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ADAB//Drop//EN",
    "BEGIN:VEVENT",
    `UID:${start}-${Math.random().toString(36).slice(2)}@adab.world`,
    `DTSTAMP:${dt(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `URL:${url}`,
    `DESCRIPTION:${title} drops on ADAB.`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

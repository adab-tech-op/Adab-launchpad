// Client-safe types + constants for the landing announcement. NO server-only /
// DB imports here, so client components (the modal, the studio editor) can import
// ANNOUNCEMENT_PAGES and the types. The DB read lives in ./announcement-server.

export type Frequency = "once" | "session" | "always";

export type AnnouncementSettings = {
  enabled: boolean;
  eyebrow: string;
  title: string;
  body: string;
  pages: string[];
  frequency: Frequency;
};

export const ANNOUNCEMENT_DEFAULTS: AnnouncementSettings = {
  enabled: true,
  eyebrow: "Founding Drop · Coming Soon",
  title: "Be first to know when Adab drops.",
  body: "Join the list for launch access and limited-drop notifications.",
  pages: ["/"],
  frequency: "once",
};

/** The pages an admin can target, by route. Label is for the studio picker. */
export const ANNOUNCEMENT_PAGES: { path: string; label: string }[] = [
  { path: "/", label: "Home" },
  { path: "/shop", label: "Shop" },
  { path: "/manifesto", label: "Manifesto" },
  { path: "/care-guide", label: "Care guide" },
  { path: "/scrapbook", label: "Scrapbook" },
  { path: "/contact", label: "Contact" },
];

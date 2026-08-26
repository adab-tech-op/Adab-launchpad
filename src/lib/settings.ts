// Client-safe settings types + defaults (no server-only imports) so both the
// studio editor and the rendered banner can share them.

export type BannerSettings = {
  enabled: boolean;
  text: string;
  bgColor: string; // hex, e.g. #ede6d8
  textColor: string; // hex, e.g. #1c1c1c
};

/** Matches the previous hardcoded strip (paper bg, ink text) so nothing changes
 *  visually until an admin edits it. */
export const BANNER_DEFAULT: BannerSettings = {
  enabled: true,
  text: "Founding Drop — this price will not repeat.",
  bgColor: "#ede6d8",
  textColor: "#1c1c1c",
};

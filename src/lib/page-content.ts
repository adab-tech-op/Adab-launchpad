// Client-safe types + current (default) content for the editable editorial
// pages. NO server-only/DB imports here so the studio editor (client) can seed
// from these. The DB read lives in ./page-content-server.

import { emptyHeroImages, defaultOverlay, type HeroImages, type HeroOverlay } from "@/lib/hero";

export type Block = { title: string; body: string; icon?: string }; // icon = optional uploaded SVG (falls back to the built-in card icon)

// A story part additionally carries an optional paired image or video
// (Cloudinary URL), shown in the scroll-driven editorial layout on the Adab
// Story page. When `video` is set it takes precedence and `image` acts as its
// poster frame. Neither set = a titled placeholder panel.
//
// titleEn/bodyEn hold the English of the same chapter. The page renders the
// primary title/body today; the English pair is stored so a language toggle
// can be added later without a migration or re-entry of copy.
export type StoryBlock = Block & {
  image?: string;
  video?: string;
  titleEn?: string;
  bodyEn?: string;
};

export type ManifestoHero = {
  images: HeroImages; // 3-breakpoint hero (desktop required; tablet/phone optional)
  eyebrow: string;
  heading: string; // newlines become line breaks
  subcopy: string; // optional
  textTheme: "light" | "dark"; // legibility over the image/background
  overlay: HeroOverlay; // colour wash (on/off, direction, colour, opacity)
};

export type ManifestoContent = {
  hero: ManifestoHero;
  storyParts: StoryBlock[];
  values: Block[];
};

// Home page hero — 3-breakpoint editable background image + overlay + text.
// Seeded from the current static assets/look so the live hero is unchanged
// until an admin edits it.
export type HomeBody = {
  featuredHeading: string;
  featuredSubcopy: string;
  storyQuote: string;
  trust: string[]; // the 3 trust-strip lines
  menu: string[]; // the 3 mini-menu labels
  scrapbookHeading: string;
  scrapbookSubcopy: string;
  storyImage?: string; // the brand-story strip image (Cloudinary URL)
};

export type HomeContent = {
  hero: HeroImages;
  overlay: HeroOverlay;
  heading: string; // newlines become separate lines (design renders uppercase)
  headingColor: string; // hex
  subcopy: string;
  subcopyColor: string; // hex
  timerColor?: string; // drop slug only: countdown colour (falls back to subcopyColor)
  heroSlides?: HeroSlide[]; // home slug only: the hero carousel. Empty/missing
  // falls back to the single hero/overlay/heading/... fields above.
  heroAutoplaySeconds?: number; // home slug only: seconds each slide is held
  // before advancing. Clamped 2-30; defaults to HERO_AUTOPLAY_SECONDS_DEFAULT.
  body?: HomeBody; // editable page copy (home slug only; drop omits it)
  nextDropDate?: string; // drop slug only: announced countdown target (ISO/UTC)
  announcementEnabled?: boolean; // drop slug only: show the default/announcement section
};

export const HOME_BODY_DEFAULT: HomeBody = {
  featuredHeading: "Two pieces. One DNA.",
  featuredSubcopy: "Limited quantities. No restock.",
  storyQuote: "We don't believe history gets lost. It just waits.",
  trust: [
    "Founding Drop — limited pieces, no restock",
    "Verified 1950s–60s history, not costume",
    "Made in Bangladesh",
  ],
  menu: ["Piran", "Hoodie", "Coming Next"],
  scrapbookHeading: "From the Adab Scrapbook.",
  scrapbookSubcopy: "People, places, textures, and moments around Adab.",
  // Empty means "use the bundled asset", so the homepage keeps working before
  // anything is uploaded.
  storyImage: "",
};

/** Seconds a hero slide is held before advancing, when unset. */
export const HERO_AUTOPLAY_SECONDS_DEFAULT = 6;
export const HERO_AUTOPLAY_SECONDS_MIN = 2;
export const HERO_AUTOPLAY_SECONDS_MAX = 30;

/** Clamps a stored/edited interval into the supported range, falling back to
 *  the default for anything missing or non-numeric. Fractional seconds are
 *  allowed (4.5s is valid); rounded to one decimal place. */
export function clampHeroAutoplaySeconds(v: unknown): number {
  if (v === null || v === undefined || v === "") return HERO_AUTOPLAY_SECONDS_DEFAULT;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return HERO_AUTOPLAY_SECONDS_DEFAULT;
  const clamped = Math.min(HERO_AUTOPLAY_SECONDS_MAX, Math.max(HERO_AUTOPLAY_SECONDS_MIN, n));
  return Math.round(clamped * 10) / 10;
}

const HOME_HERO_IMAGES_DEFAULT = {
  ...emptyHeroImages(),
  desktop: "/assets/hero-desktop.jpg",
  phone: "/assets/hero-main.jpg",
};
// Current look: cream wash rising from the bottom, ink text.
const HOME_OVERLAY_DEFAULT: HeroOverlay = { enabled: true, color: "#FAF6EF", opacity: 85, from: "bottom" };
const HOME_HEADING_DEFAULT = "OLD SOUL.\nNEW CUT.";
const HOME_HEADING_COLOR_DEFAULT = "#1c1c1c";
const HOME_SUBCOPY_DEFAULT = "Same DNA. New Language.";
const HOME_SUBCOPY_COLOR_DEFAULT = "#1c1c1c";

export const HOME_DEFAULT: HomeContent = {
  hero: HOME_HERO_IMAGES_DEFAULT,
  overlay: HOME_OVERLAY_DEFAULT,
  heading: HOME_HEADING_DEFAULT,
  headingColor: HOME_HEADING_COLOR_DEFAULT,
  subcopy: HOME_SUBCOPY_DEFAULT,
  subcopyColor: HOME_SUBCOPY_COLOR_DEFAULT,
  // Single slide seeded from the exact values above, so the carousel renders
  // identically to the old single-hero look until an admin adds more slides.
  heroSlides: [
    {
      hero: HOME_HERO_IMAGES_DEFAULT,
      overlay: HOME_OVERLAY_DEFAULT,
      heading: HOME_HEADING_DEFAULT,
      headingColor: HOME_HEADING_COLOR_DEFAULT,
      subcopy: HOME_SUBCOPY_DEFAULT,
      subcopyColor: HOME_SUBCOPY_COLOR_DEFAULT,
    },
  ],
  heroAutoplaySeconds: HERO_AUTOPLAY_SECONDS_DEFAULT,
  body: HOME_BODY_DEFAULT,
};

// The Drop page hero — same editable shape as the home hero (no body).
export const DROP_DEFAULT: HomeContent = {
  hero: { ...emptyHeroImages() },
  overlay: { enabled: true, color: "#000000", opacity: 35, from: "bottom" },
  heading: "The Drop.",
  headingColor: "#f5f0e8",
  subcopy: "Limited pieces, released on a date. Once they're gone, they're gone.",
  subcopyColor: "#f5f0e8",
  timerColor: "#f5f0e8",
  nextDropDate: "",
  announcementEnabled: true,
};

// A standalone editable hero (image + overlay + text) — used for each product's
// section on the Drop page. Same shape as the home/drop hero, minus the body.
export type PageHero = {
  hero: HeroImages;
  overlay: HeroOverlay;
  heading: string;
  headingColor: string;
  subcopy: string;
  subcopyColor: string;
  timerColor?: string; // drop heroes only: countdown digits/labels. Falls back
  // to subcopyColor when unset, so existing heroes keep their current look.
};

// One slide of the home hero carousel — same shape as PageHero (image, overlay,
// heading, subcopy, colors), named separately for clarity at the call sites.
export type HeroSlide = PageHero;

export function emptyPageHero(): PageHero {
  return {
    hero: emptyHeroImages(),
    overlay: defaultOverlay(),
    heading: "",
    headingColor: "#f5f0e8",
    subcopy: "",
    subcopyColor: "#f5f0e8",
    timerColor: "#f5f0e8",
  };
}

export type ShopContent = { heading: string; subcopy: string };
export const SHOP_DEFAULT: ShopContent = {
  heading: "Shop.",
  subcopy: "Founding pieces in limited quantities. No guaranteed restock.",
};

export type ContactContent = {
  heading: string;
  subcopy: string;
  email: string;
  studioLocation: string;
  studioNote: string;
  instagram: string;
};
export const CONTACT_DEFAULT: ContactContent = {
  heading: "Contact ADAB",
  subcopy: "Questions about a piece, an order, sizing, or the brand — we read every note.",
  email: "hello@adab.co",
  studioLocation: "Dhaka, Bangladesh",
  studioNote: "By appointment only.",
  instagram: "@adab.co",
};

export type CareContent = {
  heading: string;
  subcopy: string;
  sections: Block[];
};

// Defaults mirror the original hardcoded copy — used to seed the DB and as the
// fallback when no row exists. The page chrome (hero, pull-quote, closing, and
// the icons/numerals) stays in code; only these blocks are editable.
export const MANIFESTO_DEFAULT: ManifestoContent = {
  hero: {
    images: emptyHeroImages(),
    eyebrow: "Adab Story",
    heading: "We don't believe history gets lost.\nIt just waits.",
    subcopy: "",
    textTheme: "light",
    overlay: defaultOverlay(),
  },
  storyParts: [
    {
      title: "ইতিহাস হারায় না। অপেক্ষা করে।",
      body: "আমরা বিশ্বাস করি না ইতিহাস হারিয়ে যায়। ও শুধু অপেক্ষা করে — কেউ ফিরে তাকাবে বলে।",
      titleEn: "History doesn't get lost. It waits.",
      bodyEn: "We don't believe history gets lost. It simply waits — for someone to look back.",
    },
    {
      title: "১৯৫০-এর ঢাকা। একটা ছেলে। একটা জামা। নাম — পিরান।",
      body: "পঞ্চাশের দশকে পূর্ব বাংলার একটা ছেলে ঈদের সকালে বেরিয়েছিল একটা খাটো, পরিপাটি জামা পরে, নাম তার পিরান। সময়ের সাথে সেই জামার ঝুল বেড়েছে, নাম বদলেছে, আমাদের চোখও অন্যদিকে ঘুরে গেছে। কিন্তু ডিজাইনটা মরেনি।",
      titleEn: "1950s Dhaka. A boy. A shirt. Its name — piran.",
      bodyEn: "In the fifties, a boy in East Bengal stepped out on Eid morning in a short, neatly cut shirt called the piran. Over time its hem grew longer, its name changed, and our attention drifted elsewhere. But the design never died.",
    },
    {
      title: "আমরা জাদুঘর বানাচ্ছি না।",
      body: "আদব সেই ফিরে তাকানো। আমরা পুরনো নকশাকে কাচের বাক্সে রাখছি না — আজকের ভাষায় বলছি। এটা সংরক্ষণ না। এটা পরবর্তী অধ্যায়।",
      titleEn: "We're not building a museum.",
      bodyEn: "Adab is that looking back. We're not putting an old design behind glass — we're saying it in today's language. This isn't preservation. This is the next chapter.",
    },
    {
      title: "একই DNA। নতুন ভাষা।",
      body: "একই ঝুল, একই সহজতা, কিন্তু আজকের ছেলেটার জন্য, আজকের বাংলাদেশের জন্য। Unpretentious design, tonal thread। পুরনো নকশার grammar, আজকের কাটে।",
      titleEn: "Same DNA. New language.",
      bodyEn: "The same hem, the same ease — but for today's young man, for today's Bangladesh. Unpretentious design, tonal thread. The grammar of an old pattern, in today's cut.",
    },
    {
      title: "পুরনো প্রাণ। নতুন কাট।",
      body: "যে ছেলেটা জানে তার নিজের ইতিহাস আছে — শুধু সেটা বলার মতো জামা ছিল না এতদিন। এখন আছে। ঝুল কম, গল্প লম্বা — এটাই আদব।",
      titleEn: "Old soul. New cut.",
      bodyEn: "The young man who knows he has a history of his own — he just never had the shirt to say it with. Now he does. Shorter hem, longer story — that is Adab.",
    },
  ],
  values: [
    { title: "Truth", body: "Every historical claim is source-backed. If we can't prove it, we don't say it." },
    { title: "Restraint", body: "Tonal embroidery, no loud logos, no public discounts. Restraint is the luxury." },
    { title: "Forward Heritage", body: "The past is our material, not our destination." },
    { title: "Made in Bangladesh", body: "Production, story, language — all homegrown." },
  ],
};

export const CARE_DEFAULT: CareContent = {
  heading: "Care Guide.",
  subcopy: "Adab pieces are designed for repeat wear. Care for them gently and they'll stay with you longer.",
  sections: [
    { title: "Washing", body: "Wash cold, turn inside out, and use a gentle detergent. Wash similar colors together to keep tones true." },
    { title: "Drying", body: "Dry in the shade. Avoid direct sunlight for long stretches. Avoid tumble drying unless the care label allows it." },
    { title: "Ironing", body: "Iron inside out on medium heat. Keep the iron away from the embroidery to protect the raised threadwork." },
    { title: "Storage", body: "Hang structured pieces. Fold heavier garments to keep their shape. Store somewhere cool and dry." },
  ],
};

export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/** Countdown colour for a drop hero: its own timerColor when set, else the
 *  subcopy colour, so heroes saved before timerColor existed look unchanged. */
export function resolveTimerColor(h: { timerColor?: string; subcopyColor?: string }): string {
  return h.timerColor || h.subcopyColor || "#f5f0e8";
}

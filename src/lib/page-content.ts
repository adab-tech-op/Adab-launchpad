// Client-safe types + current (default) content for the editable editorial
// pages. NO server-only/DB imports here so the studio editor (client) can seed
// from these. The DB read lives in ./page-content-server.

export type Block = { title: string; body: string };

export type ManifestoContent = {
  storyParts: Block[];
  values: Block[];
};

export type CareContent = {
  sections: Block[];
};

// Defaults mirror the original hardcoded copy — used to seed the DB and as the
// fallback when no row exists. The page chrome (hero, pull-quote, closing, and
// the icons/numerals) stays in code; only these blocks are editable.
export const MANIFESTO_DEFAULT: ManifestoContent = {
  storyParts: [
    { title: "ORIGIN TENSION", body: "Bangladeshi men have had two options: Western clothing that isn't really theirs, or the panjabi — reserved for occasions. Nothing to wear every day that carries their own history." },
    { title: "THE HERITAGE", body: "In the mid-20th century, men across East Bengal — today's Bangladesh — wore a short-hemmed, full-sleeve shirt called the piran. In 1958, Bengali writer Rajshekhar Basu wrote: 'The piran's shape is like today's panjabi — but shorter.'" },
    { title: "THE BRIDGE", body: "The piran never disappeared — it evolved into today's longer panjabi. Our attention simply drifted elsewhere. Adab reinterprets that specific moment of evolution in today's cut, fabric, and embroidery." },
    { title: "THE PROMISE", body: "Wearing Adab isn't bringing something back. It's writing the next chapter. Your own history, in today's language." },
  ],
  values: [
    { title: "Truth", body: "Every historical claim is source-backed. If we can't prove it, we don't say it." },
    { title: "Restraint", body: "Tonal embroidery, no loud logos, no public discounts. Restraint is the luxury." },
    { title: "Forward Heritage", body: "The past is our material, not our destination." },
    { title: "Made in Bangladesh", body: "Production, story, language — all homegrown." },
  ],
};

export const CARE_DEFAULT: CareContent = {
  sections: [
    { title: "Washing", body: "Wash cold, turn inside out, and use a gentle detergent. Wash similar colors together to keep tones true." },
    { title: "Drying", body: "Dry in the shade. Avoid direct sunlight for long stretches. Avoid tumble drying unless the care label allows it." },
    { title: "Ironing", body: "Iron inside out on medium heat. Keep the iron away from the embroidery to protect the raised threadwork." },
    { title: "Storage", body: "Hang structured pieces. Fold heavier garments to keep their shape. Store somewhere cool and dry." },
  ],
};

export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

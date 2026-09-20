-- Adab Story: write the five chapters into the stored content row.
--
-- The chapters were seeded into MANIFESTO_DEFAULT in code, but defaults only
-- apply when no row exists — and a `manifesto` row has existed since before
-- the rewrite. getManifestoContent() returns the stored storyParts verbatim
-- (only the hero is merged with defaults), so the page has been rendering the
-- one old English story part all along and the five chapters were never
-- reachable. This puts them in the data, where the page actually reads from.
--
-- Replaces ONLY the storyParts array. The hero, the values grid, and anything
-- else on the row are left exactly as they are.
--
-- The guard means this runs only while storyParts is still a single part —
-- i.e. the pre-rewrite state. Once the chapters are in (or once anyone edits
-- them in Studio), re-running does nothing. Idempotent and non-destructive.
--
-- NOTE ON THE BENGALI: this copy is reconstructed from the supplied PDF, whose
-- embedded font corrupts conjuncts and vowel signs on extraction. It is a
-- careful reconstruction, not a transcription, and wants a native read-through
-- in Studio → Content → Adab Story before it matters commercially.

UPDATE page_content
SET content = jsonb_set(
      content,
      '{storyParts}',
      $json$[
        {
          "title": "ইতিহাস হারায় না। অপেক্ষা করে।",
          "body": "আমরা বিশ্বাস করি না ইতিহাস হারিয়ে যায়। ও শুধু অপেক্ষা করে — কেউ ফিরে তাকাবে বলে।",
          "titleEn": "History doesn't get lost. It waits.",
          "bodyEn": "We don't believe history gets lost. It simply waits — for someone to look back.",
          "image": "",
          "video": ""
        },
        {
          "title": "১৯৫০-এর ঢাকা। একটা ছেলে। একটা জামা। নাম — পিরান।",
          "body": "পঞ্চাশের দশকে পূর্ব বাংলার একটা ছেলে ঈদের সকালে বেরিয়েছিল একটা খাটো, পরিপাটি জামা পরে, নাম তার পিরান। সময়ের সাথে সেই জামার ঝুল বেড়েছে, নাম বদলেছে, আমাদের চোখও অন্যদিকে ঘুরে গেছে। কিন্তু ডিজাইনটা মরেনি।",
          "titleEn": "1950s Dhaka. A boy. A shirt. Its name — piran.",
          "bodyEn": "In the fifties, a boy in East Bengal stepped out on Eid morning in a short, neatly cut shirt called the piran. Over time its hem grew longer, its name changed, and our attention drifted elsewhere. But the design never died.",
          "image": "",
          "video": ""
        },
        {
          "title": "আমরা জাদুঘর বানাচ্ছি না।",
          "body": "আদব সেই ফিরে তাকানো। আমরা পুরনো নকশাকে কাচের বাক্সে রাখছি না — আজকের ভাষায় বলছি। এটা সংরক্ষণ না। এটা পরবর্তী অধ্যায়।",
          "titleEn": "We're not building a museum.",
          "bodyEn": "Adab is that looking back. We're not putting an old design behind glass — we're saying it in today's language. This isn't preservation. This is the next chapter.",
          "image": "",
          "video": ""
        },
        {
          "title": "একই DNA। নতুন ভাষা।",
          "body": "একই ঝুল, একই সহজতা, কিন্তু আজকের ছেলেটার জন্য, আজকের বাংলাদেশের জন্য। Unpretentious design, tonal thread। পুরনো নকশার grammar, আজকের কাটে।",
          "titleEn": "Same DNA. New language.",
          "bodyEn": "The same hem, the same ease — but for today's young man, for today's Bangladesh. Unpretentious design, tonal thread. The grammar of an old pattern, in today's cut.",
          "image": "",
          "video": ""
        },
        {
          "title": "পুরনো প্রাণ। নতুন কাট।",
          "body": "যে ছেলেটা জানে তার নিজের ইতিহাস আছে — শুধু সেটা বলার মতো জামা ছিল না এতদিন। এখন আছে। ঝুল কম, গল্প লম্বা — এটাই আদব।",
          "titleEn": "Old soul. New cut.",
          "bodyEn": "The young man who knows he has a history of his own — he just never had the shirt to say it with. Now he does. Shorter hem, longer story — that is Adab.",
          "image": "",
          "video": ""
        }
      ]$json$::jsonb
    ),
    updated_at = now()
WHERE slug = 'manifesto'
  -- only while it is still the single pre-rewrite part
  AND jsonb_array_length(COALESCE(content->'storyParts', '[]'::jsonb)) < 2;

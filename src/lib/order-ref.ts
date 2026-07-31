// Human-friendly order reference, e.g. "ADAB-7QK2P9".
// Excludes ambiguous characters (0/O, 1/I) so refs are easy to read over
// WhatsApp/phone. Generated client-side; all line items from one checkout
// share the same ref so an "order" is the set of reservation rows with it.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateOrderRef(): string {
  let s = "";
  const arr = new Uint32Array(6);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
    for (let i = 0; i < 6; i++) s += ALPHABET[arr[i] % ALPHABET.length];
  } else {
    for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `ADAB-${s}`;
}

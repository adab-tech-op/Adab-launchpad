import { requireUser } from "@/lib/auth-guard";
import { getWishlistSlugs } from "@/lib/queries";
import { getProductMap } from "@/lib/products";
import { WishlistGrid } from "./wishlist-grid";

export const metadata = { title: "Your Wishlist — ADAB" };

export default async function WishlistPage() {
  const user = await requireUser();
  const slugs = await getWishlistSlugs(user.id);
  const productMap = await getProductMap();
  const tiles = slugs
    .map((slug) => {
      const p = productMap.get(slug);
      if (!p) return null;
      return { slug, name: p.name, price: p.price, image: p.images[0], color: p.color };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div>
      <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">Wishlist</p>
      <h1 className="mt-3 font-editorial text-4xl">Saved pieces.</h1>
      <WishlistGrid initial={tiles} />
    </div>
  );
}

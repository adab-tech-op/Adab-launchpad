"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { toggleWishlist, isWishlisted } from "@/lib/actions/wishlist";

export function WishlistButton({ slug }: { slug: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (!session) {
      setSaved(false);
      return;
    }
    isWishlisted(slug)
      .then((v) => active && setSaved(v))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [session, slug]);

  const onClick = async () => {
    if (!session) {
      router.push("/signin");
      return;
    }
    setBusy(true);
    const res = await toggleWishlist(slug);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setSaved(res.saved);
    toast(res.saved ? "Saved to wishlist" : "Removed from wishlist");
  };

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 rounded-full border border-border py-3.5 text-xs uppercase tracking-[0.2em] text-foreground transition-colors hover:border-foreground disabled:opacity-60"
    >
      <Heart className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} strokeWidth={1.5} />
      {saved ? "Saved" : "Save to wishlist"}
    </button>
  );
}

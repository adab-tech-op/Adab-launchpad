"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, HeartCrack } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { toggleWishlist, isWishlisted } from "@/lib/actions/wishlist";

type Anim = "pulse" | "break" | null;

export function WishlistButton({ slug }: { slug: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [anim, setAnim] = useState<Anim>(null);

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
    if (busy) return;
    setBusy(true);
    // Optimistic: animate immediately, reconcile with the server after.
    const next = !saved;
    setSaved(next);
    setAnim(next ? "pulse" : "break");

    const res = await toggleWishlist(slug);
    setBusy(false);
    if (!res.ok) {
      setSaved(!next); // revert
      setAnim(null);
      toast.error(res.error);
      return;
    }
    setSaved(res.saved);
    toast(res.saved ? "Saved to wishlist" : "Removed from wishlist");
  };

  const showBreak = anim === "break";

  return (
    <button
      onClick={onClick}
      aria-pressed={saved}
      className="flex w-full items-center justify-center gap-2 rounded-full border border-border py-3.5 text-xs uppercase tracking-[0.2em] text-foreground transition-colors hover:border-foreground active:scale-[0.98]"
    >
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        {showBreak ? (
          <HeartCrack
            className="h-4 w-4 text-primary animate-heart-break"
            strokeWidth={1.75}
            onAnimationEnd={() => setAnim(null)}
          />
        ) : (
          <Heart
            className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""} ${anim === "pulse" ? "animate-heart-pulse" : ""}`}
            strokeWidth={1.5}
            onAnimationEnd={() => setAnim(null)}
          />
        )}
      </span>
      {saved ? "Saved" : "Wishlist"}
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";

export function SignOutButton({ onDark = false }: { onDark?: boolean } = {}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.push("/");
        router.refresh();
      }}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.06em] transition-colors ${
        onDark
          ? "border-white/25 text-primary-foreground/80 hover:border-white/60 hover:text-primary-foreground"
          : "border-border text-muted-foreground hover:border-destructive hover:text-destructive"
      }`}
    >
      <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
      Sign out
    </button>
  );
}

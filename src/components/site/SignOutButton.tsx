"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.push("/");
        router.refresh();
      }}
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
    >
      <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
      Sign out
    </button>
  );
}

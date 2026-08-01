"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await signOut();
        router.push("/");
        router.refresh();
      }}
      className="text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition-colors"
    >
      Sign out
    </button>
  );
}

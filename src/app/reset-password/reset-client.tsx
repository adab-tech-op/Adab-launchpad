"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { resetPassword } from "@/lib/auth-client";
import { AuthShell, authInput, authLabel } from "@/components/site/AuthShell";

export function ResetClient() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const invalid = params.get("error") === "INVALID_TOKEN";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const { error } = await resetPassword({ newPassword: password, token });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Could not reset password.");
      return;
    }
    toast.success("Password updated. Please sign in.");
    router.push("/signin");
  };

  if (!token || invalid) {
    return (
      <AuthShell
        eyebrow="Account"
        title="Link expired."
        subtitle="This password reset link is invalid or has expired. Request a new one."
        footer={<Link href="/forgot-password" className="text-foreground underline underline-offset-4 hover:text-primary">Request a new link</Link>}
      >
        <div />
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Account" title="Set a new password.">
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          {authLabel("New password")}
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={authInput + " mt-2"} />
          <span className="mt-1.5 block text-[11px] text-muted-foreground">At least 8 characters.</span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-foreground py-3.5 text-xs uppercase tracking-[0.2em] text-background hover:bg-foreground/85 transition-colors disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}

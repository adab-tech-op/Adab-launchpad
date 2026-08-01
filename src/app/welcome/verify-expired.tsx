"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { AuthShell, authInput, authLabel } from "@/components/site/AuthShell";

export function VerifyExpired() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const resend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.sendVerificationEmail({ email, callbackURL: "/welcome" });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Could not send a new link.");
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthShell
        eyebrow="Account"
        title="Check your email."
        subtitle={`We've sent a fresh verification link to ${email}. It expires in a little while, so open it soon.`}
        footer={<Link href="/signin" className="text-foreground underline underline-offset-4 hover:text-primary">Back to sign in</Link>}
      >
        <div />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Account"
      title="This link has expired."
      subtitle="Verification links don't last forever. Enter your email and we'll send a fresh one."
      footer={<Link href="/signin" className="text-foreground underline underline-offset-4 hover:text-primary">Back to sign in</Link>}
    >
      <form onSubmit={resend} className="space-y-4">
        <label className="block">
          {authLabel("Email")}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={authInput + " mt-2"} />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-foreground py-3.5 text-xs uppercase tracking-[0.2em] text-background hover:bg-foreground/85 transition-colors disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send a new link"}
        </button>
      </form>
    </AuthShell>
  );
}

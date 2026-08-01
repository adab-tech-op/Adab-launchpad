"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { requestPasswordReset } from "@/lib/auth-client";
import { AuthShell, authInput, authLabel } from "@/components/site/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await requestPasswordReset({ email, redirectTo: "/reset-password" });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Could not send reset link.");
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthShell
        eyebrow="Account"
        title="Check your email."
        subtitle={`If an account exists for ${email}, we've sent a password reset link.`}
        footer={<Link href="/signin" className="text-foreground underline underline-offset-4 hover:text-primary">Back to sign in</Link>}
      >
        <div />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Account"
      title="Reset your password."
      subtitle="Enter your email and we'll send you a reset link."
      footer={<Link href="/signin" className="text-foreground underline underline-offset-4 hover:text-primary">Back to sign in</Link>}
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          {authLabel("Email")}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={authInput + " mt-2"} />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-foreground py-3.5 text-xs uppercase tracking-[0.2em] text-background hover:bg-foreground/85 transition-colors disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}

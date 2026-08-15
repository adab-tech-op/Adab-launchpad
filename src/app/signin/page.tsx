"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { signIn, authClient } from "@/lib/auth-client";
import { AuthShell, authInput, authLabel } from "@/components/site/AuthShell";

/** Only allow internal relative paths as a post-login redirect (no open redirect). */
function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}

function SignInInner() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNeedsVerify(false);
    const { error } = await signIn.email({ email, password });
    setLoading(false);
    if (error) {
      if (error.status === 403) {
        setNeedsVerify(true);
        return;
      }
      toast.error(error.message ?? "Could not sign in.");
      return;
    }
    router.push(next ?? "/account");
    router.refresh();
  };

  const resend = async () => {
    await authClient.sendVerificationEmail({ email, callbackURL: next ?? "/account" });
    toast("Verification email sent. Check your inbox.");
  };

  return (
    <AuthShell
      eyebrow="Account"
      title="Sign in."
      subtitle="Welcome back. Sign in to track your reservations and wishlist."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="text-foreground underline underline-offset-4 hover:text-primary">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          {authLabel("Email")}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={authInput + " mt-2"} />
        </label>
        <label className="block">
          {authLabel("Password")}
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={authInput + " mt-2"} />
        </label>
        <div className="text-right">
          <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
            Forgot password?
          </Link>
        </div>
        {needsVerify && (
          <p className="rounded-md bg-primary/10 px-4 py-3 text-xs text-primary leading-relaxed">
            Please verify your email first.{" "}
            <button type="button" onClick={resend} className="underline underline-offset-2">
              Resend verification
            </button>
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-foreground py-3.5 text-xs uppercase tracking-[0.2em] text-background hover:bg-foreground/85 transition-colors disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}

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
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  // Arriving via the isolation gate: land on the homepage with the welcome
  // modal, not on the account page. Someone sent here by the gate was trying
  // to see the site, not manage their account.
  const fromGate = params.get("gate") === "1";
  const destination = next ?? (fromGate ? "/?welcome=1" : "/account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNeedsVerify(false);
    try {
      const { error } = await signIn.email({ email, password });
      if (error) {
        if (error.status === 403) {
          setNeedsVerify(true);
          return;
        }
        toast.error(error.message ?? "Could not sign in.");
        return;
      }
      if (fromGate) {
        // A full page load, not router.push(). The welcome modal is mounted
        // once in Providers and checks the URL on mount — a client-side
        // navigation leaves it mounted, so its effect never re-runs and the
        // modal never appears. A hard navigation also guarantees the server
        // sees the newly-set session cookie on the very next request, which
        // is what the isolation gate is checking.
        window.location.assign(destination);
        return;
      }
      router.push(destination);
      router.refresh();
    } catch (err) {
      // Network / CORS / server error — surface it instead of spinning forever.
      console.error("[signin] request failed", err);
      toast.error("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    await authClient.sendVerificationEmail({ email, callbackURL: destination });
    toast("Verification email sent. Check your inbox.");
  };

  return (
    <AuthShell
      eyebrow={fromGate ? "ADAB" : "Account"}
      title="Sign in."
      subtitle={
        fromGate
          ? "ADAB is not open to the public yet. Sign in to continue."
          : "Welcome back. Sign in to track your reservations and wishlist."
      }
      footer={
        // No "create an account" on the gate. Sign-up is invitation-only while
        // the site is closed, so offering it would send people down a road that
        // ends in a registered account that still cannot open anything — which
        // reads as the site being broken rather than closed.
        fromGate ? (
          <>Access is by invitation while we finish building.</>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="text-foreground underline underline-offset-4 hover:text-primary">
              Create an account
            </Link>
          </>
        )
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
          className="w-full rounded-full bg-foreground py-3.5 text-xs uppercase tracking-[0.08em] text-background hover:bg-foreground/85 transition-colors disabled:opacity-60"
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

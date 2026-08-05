"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { signUp } from "@/lib/auth-client";
import { AuthShell, authInput, authLabel } from "@/components/site/AuthShell";

export default function SignUpForm({
  initialEmail = "",
  ref: orderRef = "",
}: {
  initialEmail?: string;
  ref?: string;
}) {
  const securing = Boolean(orderRef);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (!consent) {
      toast.error("Please accept the privacy policy to continue.");
      return;
    }
    setLoading(true);
    // On account creation, the Better Auth user.create hook claims any past
    // guest reservations with this email — so a buyer who sets a password here
    // finds their order waiting in /account/orders after verifying.
    const { error } = await signUp.email({ name, email, password, callbackURL: "/welcome" });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Could not create your account.");
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <AuthShell
        eyebrow="Account"
        title="Check your email."
        subtitle={`We've sent a verification link to ${email}. Confirm it to activate your account${
          securing ? ` — then your reservation ${orderRef} will be waiting in your orders.` : ", then sign in."
        }`}
        footer={
          <Link href="/signin" className="text-foreground underline underline-offset-4 hover:text-primary">
            Go to sign in
          </Link>
        }
      >
        <div />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={securing ? "Secure your reservation" : "Account"}
      title={securing ? "Set a password." : "Create your account."}
      subtitle={
        securing
          ? `Reservation ${orderRef} is safe. Set a password to track its status and reserve faster next time.`
          : "Optional — you can reserve as a guest. An account lets you track orders and save a wishlist."
      }
      footer={
        <>
          Already have an account?{" "}
          <Link href="/signin" className="text-foreground underline underline-offset-4 hover:text-primary">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          {authLabel("Name")}
          <input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={authInput + " mt-2"} />
        </label>
        <label className="block">
          {authLabel("Email")}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={authInput + " mt-2"} />
        </label>
        <label className="block">
          {authLabel("Password")}
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={authInput + " mt-2"} />
          <span className="mt-1.5 block text-[11px] text-muted-foreground">At least 8 characters.</span>
        </label>
        <label className="flex items-start gap-3 text-xs text-muted-foreground">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
          <span>
            I agree to the{" "}
            <Link href="/policies/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>{" "}
            and{" "}
            <Link href="/policies/terms" className="underline underline-offset-2 hover:text-foreground">Terms</Link>.
          </span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-foreground py-3.5 text-xs uppercase tracking-[0.2em] text-background hover:bg-foreground/85 transition-colors disabled:opacity-60"
        >
          {loading ? "Creating…" : securing ? "Set password" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}

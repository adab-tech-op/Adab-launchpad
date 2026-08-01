import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AuthShell } from "@/components/site/AuthShell";
import { VerifyExpired } from "./verify-expired";

export const metadata = { title: "Email verified — ADAB" };

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  if (error) return <VerifyExpired />;

  let signedIn = false;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    signedIn = Boolean(session);
  } catch {
    signedIn = false;
  }

  return (
    <AuthShell
      eyebrow="Account"
      title="Email verified."
      subtitle={
        signedIn
          ? "You're all set and signed in. Welcome to ADAB."
          : "Your email is confirmed. Sign in to access your account."
      }
      footer={
        signedIn ? (
          <Link href="/account" className="text-foreground underline underline-offset-4 hover:text-primary">
            Go to your account →
          </Link>
        ) : (
          <Link href="/signin" className="text-foreground underline underline-offset-4 hover:text-primary">
            Sign in →
          </Link>
        )
      }
    >
      <Link
        href={signedIn ? "/account" : "/signin"}
        className="inline-block rounded-full bg-foreground px-8 py-3.5 text-xs uppercase tracking-[0.2em] text-background hover:bg-foreground/85 transition-colors"
      >
        {signedIn ? "Go to account" : "Sign in"}
      </Link>
    </AuthShell>
  );
}

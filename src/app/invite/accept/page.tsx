import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AcceptClient } from "./accept-client";

export const metadata = { title: "Accept invitation — ADAB" };

// This page sits OUTSIDE the /studio layout guard (it's /studio/invite, but the
// invitee isn't an admin yet). It only needs a signed-in session matching the
// invited email; the acceptInvitation action does the real validation.
export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });

  const shell = (children: React.ReactNode) => (
    <div className="mx-auto max-w-lg px-5 md:px-8 py-16 md:py-24">
      <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">ADAB Studio</p>
      <h1 className="mt-3 font-editorial text-4xl">Invitation.</h1>
      {children}
    </div>
  );

  if (!token) {
    return shell(<p className="mt-6 text-sm text-muted-foreground">This link is missing its invitation token.</p>);
  }

  if (!session) {
    const next = encodeURIComponent(`/invite/accept?token=${token}`);
    return shell(
      <>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          You&rsquo;ve been invited to ADAB Studio. Sign in (or create an account) with the email the
          invitation was sent to, then come back to accept.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href={`/signin?next=${next}`} className="rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] text-background">
            Sign in
          </Link>
          <Link href={`/signup?next=${next}`} className="rounded-full border border-border px-6 py-3 text-xs uppercase tracking-[0.2em]">
            Create account
          </Link>
        </div>
      </>,
    );
  }

  return shell(
    <>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        Signed in as <strong className="text-foreground">{session.user.email}</strong>. If this is the
        invited address, accept below to activate your studio access.
      </p>
      <AcceptClient token={token} />
    </>,
  );
}

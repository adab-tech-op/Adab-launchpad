import SignUpForm from "./signup-form";
import { invitedEmailForToken, tokenFromNext } from "@/lib/invitations-server";

export const metadata = { title: "Create your account — ADAB" };

function safeNext(raw?: string): string | null {
  if (!raw) return null;
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; ref?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNext(sp.next);

  // Arriving from an invitation: the address is decided by whoever sent it,
  // not by whoever opens the link. Carry it forward and lock the field so a
  // forwarded invite cannot be used to register some other address — which
  // would waste a verification email and end in rejection at the accept step
  // anyway.
  const invitedEmail = await invitedEmailForToken(tokenFromNext(next));

  return (
    <SignUpForm
      initialEmail={invitedEmail ?? sp.email ?? ""}
      lockedEmail={!!invitedEmail}
      orderRef={sp.ref ?? ""}
      next={next}
    />
  );
}

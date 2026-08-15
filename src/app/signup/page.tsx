import SignUpForm from "./signup-form";

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
  return <SignUpForm initialEmail={sp.email ?? ""} orderRef={sp.ref ?? ""} next={safeNext(sp.next)} />;
}

import SignUpForm from "./signup-form";

export const metadata = { title: "Create your account — ADAB" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; ref?: string }>;
}) {
  const sp = await searchParams;
  return <SignUpForm initialEmail={sp.email ?? ""} orderRef={sp.ref ?? ""} />;
}

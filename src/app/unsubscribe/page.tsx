import { verifyUnsubscribe, addUnsubscribe } from "@/lib/broadcast-server";

export const metadata = { title: "Unsubscribe — ADAB" };

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; t?: string }>;
}) {
  const { e, t } = await searchParams;
  const email = (e ?? "").trim();
  const token = (t ?? "").trim();
  const valid = email && token && verifyUnsubscribe(email, token);
  if (valid) await addUnsubscribe(email);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      {valid ? (
        <>
          <h1 className="font-editorial text-3xl">You’re unsubscribed.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {email} won’t receive any more ADAB offers. You’ll still get order and account emails.
            Changed your mind? Rejoin from the site any time.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-editorial text-3xl">Link not valid.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This unsubscribe link is missing or incorrect. Email{" "}
            <a href="mailto:info@adab.world" className="underline">info@adab.world</a> and we’ll take you off the list.
          </p>
        </>
      )}
    </main>
  );
}

import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/site/SignOutButton";

export const metadata = { title: "Your Account — ADAB" };

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/signin");

  const { user } = session;

  return (
    <div className="mx-auto max-w-4xl px-5 md:px-8 py-16 md:py-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">Account</p>
          <h1 className="mt-3 font-editorial text-4xl md:text-5xl">Hello, {user.name}.</h1>
          <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Orders", href: "/account/orders", note: "Track your reservations" },
          { label: "Wishlist", href: "/account/wishlist", note: "Saved pieces" },
          { label: "Profile", href: "/account/profile", note: "Details & addresses" },
        ].map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-border p-6 paper-grain hover:border-foreground transition-colors"
          >
            <p className="font-sans text-xl">{c.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>
          </Link>
        ))}
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Your reservations are linked to this email. Full order tracking, wishlist,
        and profile management are being built out next.
      </p>
    </div>
  );
}

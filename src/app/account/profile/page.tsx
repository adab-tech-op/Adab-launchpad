import { requireUser } from "@/lib/auth-guard";
import { getProfile } from "@/lib/queries";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Your Profile — ADAB" };

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  return (
    <div>
      <p className="font-display text-[11px] uppercase tracking-[0.24em] text-primary">Profile</p>
      <h1 className="mt-3 font-editorial text-4xl">Your details.</h1>
      <ProfileForm initial={profile} name={user.name} email={user.email} />
    </div>
  );
}

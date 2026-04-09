import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth.action";
import ProfileClient from "./ProfileClient";

const ProfilePage = async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <main className="max-w-2xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-light-400 text-sm mt-1">
          Manage your resume and account details.
        </p>
      </div>

      <ProfileClient user={user} />
    </main>
  );
};

export default ProfilePage;

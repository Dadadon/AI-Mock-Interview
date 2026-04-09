import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getApplicationsByUserId } from "@/lib/actions/jobs.action";
import ApplicationsClient from "./ApplicationsClient";

const MyApplicationsPage = async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const applications = await getApplicationsByUserId(user.id);

  return (
    <main className="max-w-4xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Applications</h1>
        <p className="text-light-400 text-sm mt-1">
          Track your applications and interview performance over time.
        </p>
      </div>
      <ApplicationsClient applications={applications} />
    </main>
  );
};

export default MyApplicationsPage;

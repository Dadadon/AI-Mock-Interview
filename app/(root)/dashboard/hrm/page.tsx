import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getApplicationsByEmployerId } from "@/lib/actions/jobs.action";
import HRMDashboard from "@/components/HRMDashboard";

const HRMPage = async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const initialApplications = await getApplicationsByEmployerId(user.id);

  return (
    <main>
      <HRMDashboard
        employerId={user.id}
        initialApplications={initialApplications}
      />
    </main>
  );
};

export default HRMPage;

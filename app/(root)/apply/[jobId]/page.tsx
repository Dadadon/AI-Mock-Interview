import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { getJobById } from "@/lib/actions/jobs.action";
import ApplyClient from "./ApplyClient";

const ApplyPage = async ({ params }: RouteParams) => {
  const { jobId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const job = await getJobById(jobId);
  if (!job) redirect("/marketplace");

  return (
    <main className="flex flex-col items-center gap-8 py-8">
      <ApplyClient
        userId={user.id}
        userName={user.name}
        jobId={job.id}
        employerId={job.employerId}
        jobTitle={job.title}
        jobParish={job.parish}
        jobPay={job.pay}
        jobType={job.type}
        screeningQuestions={job.screeningQuestions}
      />
    </main>
  );
};

export default ApplyPage;

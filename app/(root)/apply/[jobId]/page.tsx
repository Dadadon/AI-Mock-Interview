import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { getJobById } from "@/lib/actions/jobs.action";
import Agent from "@/components/Agent";

const ApplyPage = async ({ params }: RouteParams) => {
  const { jobId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const job = await getJobById(jobId);
  if (!job) redirect("/marketplace");

  return (
    <main className="flex flex-col items-center gap-8 max-w-3xl mx-auto">
      <section className="text-center space-y-2 w-full">
        <h1 className="text-2xl font-bold capitalize">{job.title}</h1>
        <p className="text-light-400 text-sm">
          {job.parish}, Jamaica &bull; {job.pay} &bull;{" "}
          {job.type === "gig" ? "Short-term Gig" : "Full-time Job"}
        </p>
        <p className="text-sm max-w-md mx-auto">
          An AI assistant will conduct a brief 2-minute screening call. Your
          response will be evaluated and sent to the employer.
        </p>
      </section>

      <Agent
        userName={user.name}
        userId={user.id}
        type="job_apply"
        scenario="job_screening"
        jobId={job.id}
        employerId={job.employerId}
        jobTitle={job.title}
      />
    </main>
  );
};

export default ApplyPage;

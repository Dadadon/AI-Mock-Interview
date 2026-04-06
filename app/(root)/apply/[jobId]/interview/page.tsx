import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { getJobById, getApplicationById } from "@/lib/actions/jobs.action";
import Agent from "@/components/Agent";

const InterviewPage = async ({ params, searchParams }: RouteParams) => {
  const { jobId } = await params;
  const { applicationId } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [job, application] = await Promise.all([
    getJobById(jobId),
    applicationId ? getApplicationById(applicationId) : Promise.resolve(null),
  ]);

  if (!job) redirect("/marketplace");

  // Guard: only let in applicants who passed screening
  if (!application || application.status !== "interview_pending") {
    redirect(`/apply/${jobId}`);
  }

  const interviewQuestions = application.interviewQuestions ?? [];

  return (
    <main className="flex flex-col items-center gap-8 max-w-3xl mx-auto py-8">
      <section className="text-center space-y-2 w-full">
        <p className="text-xs font-bold uppercase tracking-widest text-jamaica-green">
          You passed the screening
        </p>
        <h1 className="text-3xl capitalize">{job.title} — Interview</h1>
        <p className="text-light-400 text-sm">
          {job.parish}, Jamaica &bull; Questions tailored to your resume
        </p>
        {interviewQuestions.length > 0 && (
          <p className="text-xs text-jamaica-gold">
            {interviewQuestions.length} personalised questions ready
          </p>
        )}
      </section>

      <Agent
        userName={user.name}
        userId={user.id}
        type="interview"
        jobId={jobId}
        employerId={job.employerId}
        jobTitle={job.title}
        questions={interviewQuestions}
        applicationId={applicationId}
      />
    </main>
  );
};

export default InterviewPage;

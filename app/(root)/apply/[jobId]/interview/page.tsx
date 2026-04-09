import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { getJobById, getApplicationById } from "@/lib/actions/jobs.action";
import { db } from "@/firebase/admin";
import Agent from "@/components/Agent";

const InterviewPage = async ({ params, searchParams }: RouteParams) => {
  const { jobId } = await params;
  const { applicationId, retry } = await searchParams;
  const isRetry = retry === "true";

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [job, application] = await Promise.all([
    getJobById(jobId),
    applicationId ? getApplicationById(applicationId) : Promise.resolve(null),
  ]);

  if (!job) redirect("/marketplace");

  const allowedStatuses = ["interview_pending", "interview_incomplete"];
  if (!application || !allowedStatuses.includes(application.status)) {
    redirect(`/apply/${jobId}`);
  }

  // Reset status to interview_pending so the processing page poll works again
  if (isRetry && applicationId && application.status === "interview_incomplete") {
    await db.collection("applications").doc(applicationId).update({
      status: "interview_pending",
      updatedAt: new Date().toISOString(),
    });
  }

  const interviewQuestions = application.interviewQuestions ?? [];

  return (
    <main className="flex flex-col items-center gap-8 max-w-3xl mx-auto py-8">
      {isRetry && (
        <div className="w-full max-w-lg bg-jamaica-gold/10 border border-jamaica-gold/30 rounded-2xl px-5 py-3 text-center">
          <p className="text-sm font-semibold text-jamaica-gold">
            Your previous call ended too early.
          </p>
          <p className="text-xs text-light-400 mt-0.5">
            Take a breath and start when you&apos;re ready — the same questions are waiting for you.
          </p>
        </div>
      )}

      <section className="text-center space-y-2 w-full">
        <p className="text-xs font-bold uppercase tracking-widest text-jamaica-green">
          {isRetry ? "Retry your interview" : "You passed eligibility"}
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

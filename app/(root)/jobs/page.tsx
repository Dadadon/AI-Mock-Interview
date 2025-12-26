import { getJobPostings } from "@/lib/actions/general.action";
import InterviewCard from "@/components/InterviewCard";
import Link from "next/link";


export default async function JobsPage() {
  const jobs = await getJobPostings();

  return (
    <main className="flex flex-col gap-10">
      <h1 className="text-4xl font-bold text-light-100">Job Marketplace</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs?.map((job: any) => (
          <div
            key={job.id}
            className="card dark-gradient p-5 rounded-2xl border border-input"
          >
            <h2 className="text-xl font-bold text-primary-200">{job.title}</h2>
            <p className="text-light-400 mt-2">{job.location}</p>
            <button className="blue-gradient-dark py-2 px-4 rounded-lg mt-4 w-full">
              Apply Now
            </button>
            // Inside your jobs.map()
            <Link
              href={`/interview?role=${encodeURIComponent(
                job.title
              )}&tech=${encodeURIComponent(job.techstack.join(","))}&jobId=${
                job.id
              }`}
              className="block text-center blue-gradient-dark py-2 px-4 rounded-lg mt-4 w-full"
            >
              Apply with AI Interview
            </Link>
          </div>
        ))}
        {!jobs && <p className="text-light-500">No jobs posted yet.</p>}
      </div>
    </main>
  );
}
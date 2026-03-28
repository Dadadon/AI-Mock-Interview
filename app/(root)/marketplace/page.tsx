import { getCurrentUser } from "@/lib/actions/auth.action";
import { getJobs } from "@/lib/actions/jobs.action";
import JobCard from "@/components/JobCard";

const MarketplacePage = async () => {
  const [user, jobs] = await Promise.all([getCurrentUser(), getJobs()]);

  return (
    <main className="space-y-8">
      <section className="card-cta">
        <div className="flex flex-col gap-4 max-w-lg">
          <h1 className="text-3xl font-bold leading-tight">
            Find Your Next Gig in Jamaica
          </h1>
          <p className="text-light-400">
            Browse verified positions across the island. Click{" "}
            <strong>Apply Now</strong> to start your 2-minute AI voice
            screening — no resume required.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {jobs.length} Position{jobs.length !== 1 ? "s" : ""} Available
          </h2>
        </div>

        {jobs.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-light-400">
              No positions available yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="interviews-section">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default MarketplacePage;

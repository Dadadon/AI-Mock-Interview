import { getJobs } from "@/lib/actions/jobs.action";
import MarketplaceView from "@/components/MarketplaceView";

const MarketplacePage = async () => {
  const jobs = await getJobs();

  return (
    <main className="space-y-10">
      {/* Hero */}
      <section className="card-cta">
        <div className="flex flex-col gap-4 max-w-lg z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-jamaica-gold">
              Neat Gigz &mdash; Career Hub
            </span>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight">
            Find Your Next<br />
            <span className="text-jamaica-gold">Gig in Jamaica</span>
          </h1>
          <p className="text-light-400 text-base">
            Browse verified positions across the island. Click{" "}
            <strong className="text-white">Apply Now</strong> to start your
            2-minute AI voice screening — no resume required.
          </p>
        </div>

        {/* Decorative flag stripe */}
        <div className="absolute right-0 top-0 bottom-0 w-2 rounded-r-3xl bg-gradient-to-b from-jamaica-gold via-jamaica-green to-jamaica-black opacity-60" />
      </section>

      {/* Filters + Cards */}
      <MarketplaceView jobs={jobs} />
    </main>
  );
};

export default MarketplacePage;

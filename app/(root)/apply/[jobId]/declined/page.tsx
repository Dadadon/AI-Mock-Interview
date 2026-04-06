import Link from "next/link";

const DeclinedPage = async ({ params }: RouteParams) => {
  await params;

  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-dark-300 flex items-center justify-center text-3xl">
          🙏
        </div>
        <h1 className="text-2xl font-bold">Thank You for Applying</h1>
        <p className="text-light-400 max-w-md text-sm leading-relaxed">
          After reviewing your screening, this role isn&apos;t the right fit right now.
          Don&apos;t be discouraged — there are plenty of great opportunities on the marketplace.
        </p>
        <p className="text-xs text-jamaica-gold font-semibold">
          Keep applying. Your next opportunity is out there.
        </p>
      </div>

      <div className="flex gap-4 flex-wrap justify-center">
        <Link
          href="/marketplace"
          className="btn-primary px-6 py-3 rounded-full font-bold text-sm"
        >
          Browse More Gigs
        </Link>
        <Link
          href="/"
          className="btn-secondary px-6 py-3 rounded-full font-bold text-sm"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
};

export default DeclinedPage;

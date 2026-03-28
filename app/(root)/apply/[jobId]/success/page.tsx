import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const SuccessPage = async ({ params }: RouteParams) => {
  // params consumed to satisfy Next.js dynamic route contract
  await params;

  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <CheckCircle className="w-16 h-16 text-green-400" />
        <h1 className="text-2xl font-bold">Application Submitted!</h1>
        <p className="text-light-400 max-w-md">
          Your AI screening call has been processed. The employer will review
          your score and transcript and reach out if you&apos;re a good fit.
        </p>
      </div>

      <div className="flex gap-4">
        <Button asChild className="btn-primary">
          <Link href="/marketplace">Browse More Gigs</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </main>
  );
};

export default SuccessPage;

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  getLatestInterviews,
} from "@/lib/actions/general.action";

async function Home() {
  const user = await getCurrentUser();

  const [userInterviews, allInterviews] = await Promise.all([
    getInterviewsByUserId(user?.id!),
    getLatestInterviews({ userId: user?.id! }),
  ]);

  const hasPastInterviews = userInterviews?.length! > 0;
  const hasUpcomingInterviews = allInterviews?.length! > 0;

  const upcomingFeatures = [
    {
      title: "Video Analysis",
      description: "Get feedback on your body language and facial expressions",
      status: "Beta Testing"
    },
    {
      title: "Company-Specific Questions",
      description: "Practice with actual questions from top tech companies",
      status: "Coming Soon"
    },
    {
      title: "Multi-Round Simulations",
      description: "Full interview process from screening to final round",
      status: "In Development"
    }
  ];

  return (
    <main className="space-y-12">
      {/* Hero Section */}
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h1 className="text-4xl font-bold leading-tight">
            Master Your Next Interview with AI
          </h1>
          <p className="text-lg text-light-400">
            Practice with realistic simulations and get detailed feedback on your
            answers, tone, and confidence level.
          </p>
          <div className="flex gap-4">
            <Button asChild className="btn-primary">
              <Link href="/interview">Start Practice Now</Link>
            </Button>
            {/* {hasPastInterviews && (
              <Button asChild variant="outline" className="btn-secondary">
                <Link href="/history">View History</Link>
              </Button>
            )} */}
          </div>
        </div>

        <Image
          src="/interview.png"
          alt="AI Interview Assistant"
          width={400}
          height={400}
          className="max-sm:hidden"
          priority
        />
      </section>

      {/* Upcoming Features Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Upcoming Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingFeatures.map((feature, index) => (
            <div key={index} className="dark-gradient p-6 rounded-xl border border-input">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-medium">{feature.title}</h3>
                <Badge variant="outline" className="border-primary-200 text-primary-200 text-xs">
                  {feature.status}
                </Badge>
              </div>
              <p className="text-light-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Your Interview History */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Your Practice Sessions</h2>
          {hasPastInterviews && (
            <Link href="/history" className="text-primary-200 hover:underline">
              View All
            </Link>
          )}
        </div>

        <div className="interviews-section">
          {hasPastInterviews ? (
            userInterviews
              ?.slice(0, 3)
              .map((interview) => (
                <InterviewCard
                  key={interview.id}
                  userId={user?.id}
                  interviewId={interview.id}
                  role={interview.role}
                  type={interview.type}
                  techstack={interview.techstack}
                  createdAt={interview.createdAt}
                />
              ))
          ) : (
            <div className="card w-full p-8 text-center">
              <p className="text-light-400 mb-4">No practice sessions yet</p>
              <Button asChild className="btn-primary w-fit mx-auto">
                <Link href="/interview">Start Your First Interview</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Available Interviews */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Available Practice Interviews</h2>
        
        <div className="interviews-section">
          {hasUpcomingInterviews ? (
            allInterviews?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
                isNew={true}
              />
            ))
          ) : (
            <div className="card w-full p-8 text-center">
              <p className="text-light-400">
                Check back later for new interview templates
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Home;
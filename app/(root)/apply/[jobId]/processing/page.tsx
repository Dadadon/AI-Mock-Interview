"use client";

import { useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";

const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS = 120_000;

const ProcessingPage = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const jobId = params.jobId as string;
  const applicationId = searchParams.get("applicationId");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!applicationId) {
      router.replace("/marketplace");
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/application/status?applicationId=${applicationId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "complete") {
          clearInterval(intervalRef.current!);
          clearTimeout(timeoutRef.current!);
          router.replace(`/apply/${jobId}/success`);
        } else if (data.status === "ineligible") {
          clearInterval(intervalRef.current!);
          clearTimeout(timeoutRef.current!);
          router.replace(`/apply/${jobId}/declined`);
        } else if (data.status === "interview_incomplete") {
          clearInterval(intervalRef.current!);
          clearTimeout(timeoutRef.current!);
          router.replace(`/apply/${jobId}/interview?applicationId=${applicationId}&retry=true`);
        }
        // status "interview_pending" → keep polling
      } catch (err) {
        console.error("[processing] poll error:", err);
      }
    };

    // Poll immediately, then every 3 seconds
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    // Safety timeout: 2 minutes
    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current!);
      router.replace("/marketplace");
    }, TIMEOUT_MS);

    return () => {
      clearInterval(intervalRef.current!);
      clearTimeout(timeoutRef.current!);
    };
  }, [applicationId, jobId, router]);

  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <span className="absolute inset-0 rounded-full bg-jamaica-green/20 animate-ping" />
          <span className="relative flex items-center justify-center w-16 h-16 rounded-full bg-jamaica-green/15 text-3xl">
            🎙️
          </span>
        </div>
        <h1 className="text-2xl font-bold">Scoring Your Interview</h1>
        <p className="text-light-400 max-w-sm text-sm">
          Our AI is reviewing your interview. This usually takes less than 30 seconds.
        </p>
        <div className="flex gap-1.5 mt-2">
          <span className="w-2 h-2 rounded-full bg-jamaica-green animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-jamaica-green animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-jamaica-green animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </main>
  );
};

export default ProcessingPage;

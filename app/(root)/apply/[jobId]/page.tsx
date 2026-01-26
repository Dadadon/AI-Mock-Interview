"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ResumeUpload from "@/components/ResumeUpload";
import { getResumeText } from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";

export default function ApplyPage({ params }: { params: { jobId: string } }) {
  const [resumeUrl, setResumeUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleStartScreening = async () => {
    setIsGenerating(true);
    
    // 1. Get Text from Resume
    const resumeText = await getResumeText(resumeUrl);

    // 2. Trigger the AI Generation API
    const response = await fetch("/api/vapi/generate", {
      method: "POST",
      body: JSON.stringify({
        jobId: params.jobId,
        resumeText: resumeText,
        // ... other job details
      }),
    });

    const data = await response.json();
    if (data.success) {
      router.push(`/interview/${data.interviewId}`);
    }
  };

  return (
    <main className="max-w-xl mx-auto py-20 text-center">
      <h1 className="text-3xl font-bold mb-6">Initial Screening</h1>
      <p className="text-light-400 mb-8">
        To provide a personalized screening, please upload your resume. 
        Our AI will review it to ask relevant questions about your experience.
      </p>

      {!resumeUrl ? (
        <ResumeUpload onUploadComplete={(url) => setResumeUrl(url)} />
      ) : (
        <div className="space-y-4">
          <p className="text-green-500 font-semibold">Resume Uploaded Successfully!</p>
          <Button 
            onClick={handleStartScreening} 
            className="w-full blue-gradient-dark py-6"
            disabled={isGenerating}
          >
            {isGenerating ? "Analyzing Resume & Generating Interview..." : "Start AI Screening"}
          </Button>
        </div>
      )}
    </main>
  );
}
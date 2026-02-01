"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { syncUserEligibility } from "@/lib/actions/user.action";
import ResumeUpload from "@/components/ResumeUpload";
import { Button } from "@/components/ui/button";

export default function ApplyPage({ params }: { params: { jobId: string } }) {
  const [step, setStep] = useState(1);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [eligibility, setEligibility] = useState({ location: "", noticePeriod: "", workAuth: "" });

  const userId = "current-user-uid"; // Get from your Auth state

  // 1. Fetch Profile on Mount
  useEffect(() => {
    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, "users", userId));
      if (snap.exists()) {
        const data = snap.data();
        setUserProfile(data);
        setResumeUrl(data.resumeUrl || "");
        setEligibility({
          location: data.location || "",
          noticePeriod: data.noticePeriod || "",
          workAuth: data.workAuth || ""
        });
      }
    };
    fetchProfile();
  }, [userId]);

  const handleFinishStep2 = async () => {
    // 2. Sync changes back to the Profile so they don't have to do this again
    await syncUserEligibility(userId, {
      resumeUrl,
      ...eligibility
    });
    setStep(3);
    startAiGeneration();
  };

  return (
    <main className="max-w-2xl mx-auto py-10">
      {/* STEP 1: RESUME (Check if linked) */}
      {step === 1 && (
        <div className="text-center">
          {resumeUrl ? (
            <div className="card dark-gradient p-6 rounded-2xl border border-green-500/20">
              <p className="text-green-500 mb-4">Resume found on your profile!</p>
              <Button onClick={() => setStep(2)} className="blue-gradient-dark">Use Linked Resume</Button>
              <button onClick={() => setResumeUrl("")} className="block mx-auto mt-4 text-xs underline">Upload New Resume</button>
            </div>
          ) : (
            <ResumeUpload onUploadComplete={(url) => { setResumeUrl(url); setStep(2); }} />
          )}
        </div>
      )}

      {/* STEP 2: ELIGIBILITY (Pre-filled) */}
      {step === 2 && (
        <div className="space-y-6 card dark-gradient p-8 rounded-3xl">
          <h2 className="text-xl font-bold">Confirm Eligibility</h2>
          <input 
            value={eligibility.location} 
            placeholder="Current Location"
            onChange={(e) => setEligibility({...eligibility, location: e.target.value})}
            className="w-full bg-dark-300 border border-input p-3 rounded-xl"
          />
          <input 
            value={eligibility.noticePeriod} 
            placeholder="Notice Period (e.g. Immediate)"
            onChange={(e) => setEligibility({...eligibility, noticePeriod: e.target.value})}
            className="w-full bg-dark-300 border border-input p-3 rounded-xl"
          />
          <Button onClick={handleFinishStep2} className="w-full blue-gradient-dark">Continue to AI Interview</Button>
        </div>
      )}
    </main>
  );
}

const startAiGeneration = async () => {
  setIsGenerating(true); // Ensure you have this state: const [isGenerating, setIsGenerating] = useState(false);
  
  try {
    const response = await fetch("/api/vapi/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jobId: params.jobId,
        role: jobData?.title,
        industry: jobData?.industry,
        resumeUrl: resumeUrl,
        eligibilityAns: eligibility, // Notice period, location, etc.
        userid: userId, // From your auth provider
      }),
    });

    const data = await response.json();

    if (data.success) {
      toast.success("Interview Prepared!");
      // Redirect to the dynamic interview room
      router.push(`/interview/${data.interviewId}`);
    } else {
      throw new Error(data.error || "Failed to generate interview");
    }
  } catch (error) {
    console.error("Generation Error:", error);
    toast.error("Could not start AI Screening. Please try again.");
    setStep(2); // Send them back to verify eligibility if it fails
  } finally {
    setIsGenerating(false);
  }
};

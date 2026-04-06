"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { storage } from "@/firebase/client";
import { createApplication } from "@/lib/actions/jobs.action";
import Agent from "@/components/Agent";

type Phase = "upload" | "screening";

interface ApplyClientProps {
  userId: string;
  userName: string;
  jobId: string;
  employerId: string;
  jobTitle: string;
  jobParish: string;
  jobPay: string;
  jobType: "gig" | "job";
  screeningQuestions?: string[];
}

const ApplyClient = ({
  userId,
  userName,
  jobId,
  employerId,
  jobTitle,
  jobParish,
  jobPay,
  jobType,
  screeningQuestions,
}: ApplyClientProps) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("upload");
  const [applicationId, setApplicationId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowed = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(selected.type) && !selected.name.match(/\.(pdf|doc|docx)$/i)) {
      toast.error("Please upload a PDF or Word document.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB.");
      return;
    }
    setFile(selected);
  };

  const handleStartApplication = async () => {
    if (!file) {
      toast.error("Please upload your resume first.");
      return;
    }

    setUploading(true);
    try {
      // 1. Parse resume with Gemini
      const formData = new FormData();
      formData.append("resume", file);

      const parseRes = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });
      const parseData = await parseRes.json();

      if (!parseData.success) {
        toast.error("Could not read your resume. Please try a different file.");
        setUploading(false);
        return;
      }

      const resumeText: string =
        parseData.resumeData?.rawText ||
        parseData.resumeData?.summary ||
        "";

      // 2. Upload original file to Firebase Storage
      let resumeUrl = "";
      try {
        const storageRef = ref(storage, `resumes/${userId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        resumeUrl = await getDownloadURL(storageRef);
      } catch (uploadErr) {
        // Non-fatal — continue without the storage URL
        console.warn("[ApplyClient] Storage upload failed:", uploadErr);
      }

      // 3. Create application document in Firestore
      const { success, applicationId: newId } = await createApplication({
        userId,
        jobId,
        employerId,
        applicantName: userName,
        jobTitle,
        resumeUrl,
        resumeText,
      });

      if (!success || !newId) {
        toast.error("Failed to start your application. Please try again.");
        setUploading(false);
        return;
      }

      setApplicationId(newId);
      setPhase("screening");
    } catch (err) {
      console.error("[ApplyClient] Error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Upload phase ─────────────────────────────────────────────────────────
  if (phase === "upload") {
    return (
      <div className="w-full max-w-lg mx-auto space-y-6">
        {/* Job summary */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl capitalize">{jobTitle}</h1>
          <p className="text-light-400 text-sm">
            {jobParish}, Jamaica &bull; {jobPay} &bull;{" "}
            {jobType === "gig" ? "Short-term Gig" : "Full-time Job"}
          </p>
          {screeningQuestions && screeningQuestions.length > 0 && (
            <p className="text-xs text-jamaica-gold">
              {screeningQuestions.length} AI screening questions
            </p>
          )}
        </div>

        {/* Upload card */}
        <div className="card-border">
          <div className="card p-6 space-y-5 rounded-3xl">
            <div>
              <h2 className="font-bold text-lg">Upload Your Resume</h2>
              <p className="text-sm text-light-400 mt-1">
                Your resume is used to personalise your interview questions if you pass the screening.
              </p>
            </div>

            {/* Drop zone */}
            <div
              className="border-2 border-dashed border-jamaica-green/30 rounded-2xl p-8 text-center cursor-pointer hover:border-jamaica-green/60 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="space-y-1">
                  <p className="text-jamaica-green font-semibold text-sm">{file.name}</p>
                  <p className="text-xs text-light-400">
                    {(file.size / 1024).toFixed(0)} KB &bull; Click to change
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-2xl">📄</p>
                  <p className="text-sm text-light-400">
                    Click to upload <span className="text-white">PDF or Word</span> (max 5 MB)
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={handleStartApplication}
              disabled={!file || uploading}
              className="btn-primary w-full py-3 rounded-full font-bold disabled:opacity-50"
            >
              {uploading ? "Preparing your application..." : "Continue to Screening"}
            </button>

            <button
              onClick={() => router.push("/marketplace")}
              className="w-full text-sm text-light-400 hover:text-light-100 transition-colors"
            >
              Not ready? Save for later
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Screening phase ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl mx-auto">
      <div className="text-center space-y-1">
        <h1 className="text-3xl capitalize">{jobTitle}</h1>
        <p className="text-light-400 text-sm">AI Screening — ~2 minutes</p>
      </div>

      <Agent
        userName={userName}
        userId={userId}
        type="job_apply"
        jobId={jobId}
        employerId={employerId}
        jobTitle={jobTitle}
        screeningQuestions={screeningQuestions}
        applicationId={applicationId}
      />
    </div>
  );
};

export default ApplyClient;

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { storage } from "@/firebase/client";
import { createApplication } from "@/lib/actions/jobs.action";

type Phase = "eligibility" | "upload" | "done";

interface ApplyClientProps {
  userId: string;
  userName: string;
  jobId: string;
  employerId: string;
  jobTitle: string;
  jobParish: string;
  jobPay: string;
  jobType: "gig" | "job";
  requirements?: string[];
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
  requirements = [],
  screeningQuestions,
}: ApplyClientProps) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>(requirements.length > 0 ? "eligibility" : "upload");
  const [answers, setAnswers] = useState<Record<number, boolean | null>>(
    Object.fromEntries(requirements.map((_, i) => [i, null]))
  );
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const jobMeta = (
    <p className="text-light-400 text-sm">
      {jobParish}, Jamaica &bull; {jobPay} &bull;{" "}
      {jobType === "gig" ? "Short-term Gig" : "Full-time Job"}
    </p>
  );

  // ── Phase 0: Eligibility form ─────────────────────────────────────────
  const handleEligibilitySubmit = () => {
    const failed = requirements.some((_, i) => answers[i] !== true);
    if (failed) {
      router.push(`/apply/${jobId}/declined`);
      return;
    }
    setPhase("upload");
  };

  if (phase === "eligibility") {
    const allAnswered = requirements.every((_, i) => answers[i] !== null);

    return (
      <div className="w-full max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl capitalize">{jobTitle}</h1>
          {jobMeta}
        </div>

        <div className="card-border">
          <div className="card p-6 space-y-5 rounded-3xl">
            <div>
              <h2 className="font-bold text-lg">Eligibility Check</h2>
              <p className="text-sm text-light-400 mt-1">
                Answer all questions honestly. Ineligible applications will not
                proceed to the interview.
              </p>
            </div>

            <div className="space-y-4">
              {requirements.map((req, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-sm font-medium">{req}</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [i]: true }))}
                      className={`flex-1 py-2 rounded-full text-sm font-bold border transition-colors ${
                        answers[i] === true
                          ? "bg-jamaica-green text-black border-jamaica-green"
                          : "border-jamaica-green/30 text-light-400 hover:border-jamaica-green"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [i]: false }))}
                      className={`flex-1 py-2 rounded-full text-sm font-bold border transition-colors ${
                        answers[i] === false
                          ? "bg-destructive-100/20 text-destructive-100 border-destructive-100"
                          : "border-destructive-100/30 text-light-400 hover:border-destructive-100"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleEligibilitySubmit}
              disabled={!allAnswered}
              className="btn-primary w-full py-3 rounded-full font-bold disabled:opacity-50"
            >
              Continue
            </button>

            <button
              onClick={() => router.push("/marketplace")}
              className="w-full text-sm text-light-400 hover:text-light-100 transition-colors"
            >
              Not ready? Go back to marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase 1: Resume upload ────────────────────────────────────────────
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
      const parseRes = await fetch("/api/resume/parse", { method: "POST", body: formData });
      const parseData = await parseRes.json();

      const resumeText: string = parseData.resumeData?.rawText || parseData.resumeData?.summary || "";

      // 2. Upload to Firebase Storage
      let resumeUrl = "";
      try {
        const storageRef = ref(storage, `resumes/${userId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        resumeUrl = await getDownloadURL(storageRef);
      } catch (err) {
        console.warn("[ApplyClient] Storage upload failed:", err);
      }

      // 3. Create application doc — interview_pending from the start
      const { success, applicationId } = await createApplication({
        userId,
        jobId,
        employerId,
        applicantName: userName,
        jobTitle,
        resumeUrl,
        resumeText,
      });

      if (!success || !applicationId) {
        toast.error("Failed to start your application. Please try again.");
        return;
      }

      // 4. Navigate to interview page
      setPhase("done");
      router.push(`/apply/${jobId}/interview?applicationId=${applicationId}`);
    } catch (err) {
      console.error("[ApplyClient]", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (phase === "upload") {
    return (
      <div className="w-full max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-jamaica-green">
            Eligibility confirmed
          </p>
          <h1 className="text-3xl capitalize">{jobTitle}</h1>
          {jobMeta}
          {screeningQuestions && screeningQuestions.length > 0 && (
            <p className="text-xs text-jamaica-gold">
              {screeningQuestions.length} personalised interview questions ready
            </p>
          )}
        </div>

        <div className="card-border">
          <div className="card p-6 space-y-5 rounded-3xl">
            <div>
              <h2 className="font-bold text-lg">Upload Your Resume</h2>
              <p className="text-sm text-light-400 mt-1">
                Used to personalise your interview questions for this role.
              </p>
            </div>

            <div
              className="border-2 border-dashed border-jamaica-green/30 rounded-2xl p-8 text-center cursor-pointer hover:border-jamaica-green/60 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="space-y-1">
                  <p className="text-jamaica-green font-semibold text-sm">{file.name}</p>
                  <p className="text-xs text-light-400">{(file.size / 1024).toFixed(0)} KB &bull; Click to change</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-2xl">📄</p>
                  <p className="text-sm text-light-400">Click to upload <span className="text-white">PDF or Word</span> (max 5 MB)</p>
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
              {uploading ? "Preparing your interview..." : "Continue to Interview"}
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

  return null;
};

export default ApplyClient;

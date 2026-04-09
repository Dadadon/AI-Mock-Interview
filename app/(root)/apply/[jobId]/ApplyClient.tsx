"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { storage } from "@/firebase/client";
import { createApplication } from "@/lib/actions/jobs.action";
import { updateUserResume } from "@/lib/actions/auth.action";

type Phase = "eligibility" | "resume_choice" | "upload" | "done";

interface ApplyClientProps {
  userId: string;
  userName: string;
  jobId: string;
  employerId: string;
  jobTitle: string;
  jobParish: string;
  jobPay: string;
  jobType: "gig" | "job";
  requirements?: { text: string; required: boolean }[];
  screeningQuestions?: string[];
  profileResumeUrl?: string;
  profileResumeText?: string;
  profileResumeFileName?: string;
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
  requirements = [] as { text: string; required: boolean }[],
  screeningQuestions,
  profileResumeUrl,
  profileResumeText,
  profileResumeFileName,
}: ApplyClientProps) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasProfileResume = !!profileResumeUrl && !!profileResumeText;
  const initialUploadPhase = hasProfileResume ? "resume_choice" : "upload";

  const [phase, setPhase] = useState<Phase>(requirements.length > 0 ? "eligibility" : initialUploadPhase);
  const [answers, setAnswers] = useState<Record<number, boolean | null>>(
    Object.fromEntries(requirements.map((_, i) => [i, null]))
  );
  const [eligibilityScore, setEligibilityScore] = useState<number>(100);
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
    // Decline only if any MUST HAVE is answered No
    const failedRequired = requirements.some((r, i) => r.required && answers[i] === false);
    if (failedRequired) {
      router.push(`/apply/${jobId}/declined`);
      return;
    }

    // Calculate eligibility score: percentage of all requirements answered Yes
    const yesCount = requirements.filter((_, i) => answers[i] === true).length;
    const eligibilityScore = requirements.length > 0
      ? Math.round((yesCount / requirements.length) * 100)
      : 100;

    setEligibilityScore(eligibilityScore);
    setPhase(hasProfileResume ? "resume_choice" : "upload");
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
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium flex-1">{req.text}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      req.required
                        ? "bg-destructive-100/15 text-destructive-100"
                        : "bg-jamaica-green/15 text-jamaica-green"
                    }`}>
                      {req.required ? "Must Have" : "Optional"}
                    </span>
                  </div>
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

  // ── Phase 1a: Resume on file — use or replace ────────────────────────
  if (phase === "resume_choice") {
    return (
      <div className="w-full max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-jamaica-green">
            Eligibility confirmed
          </p>
          <h1 className="text-3xl capitalize">{jobTitle}</h1>
          {jobMeta}
        </div>

        <div className="card-border">
          <div className="card p-6 space-y-5 rounded-3xl">
            <div>
              <h2 className="font-bold text-lg">Resume on File</h2>
              <p className="text-sm text-light-400 mt-1">
                Use your saved resume or upload a new one.
              </p>
            </div>

            {/* Profile resume card */}
            <div className="flex items-center gap-4 bg-dark-300 border border-jamaica-green/20 rounded-2xl px-4 py-3">
              <span className="text-2xl">📄</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {profileResumeFileName || "Resume on file"}
                </p>
                <p className="text-xs text-light-400">Saved to your profile</p>
              </div>
            </div>

            <button
              onClick={handleUseProfileResume}
              disabled={uploading}
              className="btn-primary w-full py-3 rounded-full font-bold disabled:opacity-50"
            >
              {uploading ? "Starting interview..." : "Use This Resume"}
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-input" />
              <span className="text-xs text-light-600">or</span>
              <div className="flex-1 h-px bg-input" />
            </div>

            <button
              onClick={() => setPhase("upload")}
              className="w-full py-3 rounded-full font-bold text-sm border border-jamaica-green/30 text-light-400 hover:border-jamaica-green hover:text-white transition-colors"
            >
              Upload a New Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase 1b: Resume upload ───────────────────────────────────────────
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

  // Use profile resume directly
  const handleUseProfileResume = async () => {
    setUploading(true);
    try {
      const { success, applicationId } = await createApplication({
        userId, jobId, employerId, applicantName: userName, jobTitle,
        resumeUrl: profileResumeUrl,
        resumeText: profileResumeText,
        eligibilityScore,
      });
      if (!success || !applicationId) {
        toast.error("Failed to start your application. Please try again.");
        return;
      }
      setPhase("done");
      router.push(`/apply/${jobId}/interview?applicationId=${applicationId}`);
    } catch (err) {
      console.error("[ApplyClient]", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Upload new resume, save to profile, then create application
  const handleStartApplication = async () => {
    if (!file) {
      toast.error("Please upload your resume first.");
      return;
    }
    setUploading(true);
    try {
      // 1. Parse resume
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

      // 3. Save to user profile so future applications can reuse it
      if (resumeUrl) {
        const rd = parseData.resumeData || {};
        await updateUserResume({
          userId, resumeUrl, resumeText, resumeFileName: file.name,
          resumeSummary: rd.summary || "",
          resumeSkills: Array.isArray(rd.skills) ? rd.skills : [],
          resumeExperienceSummary: rd.experienceSummary || "",
          resumeEducation: rd.education || "",
          resumeYearsExperience: rd.yearsExperience ? String(rd.yearsExperience) : "",
        });
      }

      // 4. Create application doc
      const { success, applicationId } = await createApplication({
        userId, jobId, employerId, applicantName: userName, jobTitle,
        resumeUrl, resumeText, eligibilityScore,
      });

      if (!success || !applicationId) {
        toast.error("Failed to start your application. Please try again.");
        return;
      }

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

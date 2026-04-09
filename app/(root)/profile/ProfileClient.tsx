"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Camera, Pencil } from "lucide-react";

import { storage } from "@/firebase/client";
import { updateUserResume, updateUserPhoto } from "@/lib/actions/auth.action";

const ProfileClient = ({ user }: { user: User }) => {
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || "");
  const [resumeFileName, setResumeFileName] = useState(user.resumeFileName || "");
  const [resumeUrl, setResumeUrl] = useState(user.resumeUrl || "");

  // Parsed resume display state
  const [summary, setSummary] = useState(user.resumeSummary || "");
  const [skills, setSkills] = useState<string[]>(user.resumeSkills || []);
  const [experience, setExperience] = useState(user.resumeExperienceSummary || "");
  const [education, setEducation] = useState(user.resumeEducation || "");
  const [years, setYears] = useState(user.resumeYearsExperience || "");

  // ── Photo upload ────────────────────────────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image must be under 3 MB.");
      return;
    }

    setUploadingPhoto(true);
    try {
      const storageRef = ref(storage, `photos/${user.id}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const { success } = await updateUserPhoto({ userId: user.id, photoUrl: url });
      if (success) {
        setPhotoUrl(url);
        toast.success("Profile photo updated.");
      } else {
        toast.error("Failed to save photo.");
      }
    } catch (err) {
      console.error("[ProfileClient photo]", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  // ── Resume upload ───────────────────────────────────────────────────────
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      toast.error("Please upload a PDF or Word document.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB.");
      return;
    }

    setUploading(true);
    try {
      // Parse
      const formData = new FormData();
      formData.append("resume", file);
      const parseRes = await fetch("/api/resume/parse", { method: "POST", body: formData });
      const parseData = await parseRes.json();
      const rd = parseData.resumeData || {};
      const resumeText: string = rd.rawText || rd.summary || "";

      // Upload to Storage
      const storageRef = ref(storage, `resumes/${user.id}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // Save to profile (with parsed fields)
      const { success } = await updateUserResume({
        userId: user.id,
        resumeUrl: url,
        resumeText,
        resumeFileName: file.name,
        resumeSummary: rd.summary || "",
        resumeSkills: Array.isArray(rd.skills) ? rd.skills : [],
        resumeExperienceSummary: rd.experienceSummary || "",
        resumeEducation: rd.education || "",
        resumeYearsExperience: rd.yearsExperience ? String(rd.yearsExperience) : "",
      });

      if (success) {
        setResumeFileName(file.name);
        setResumeUrl(url);
        setSummary(rd.summary || "");
        setSkills(Array.isArray(rd.skills) ? rd.skills : []);
        setExperience(rd.experienceSummary || "");
        setEducation(rd.education || "");
        setYears(rd.yearsExperience ? String(rd.yearsExperience) : "");
        toast.success("Resume updated successfully.");
      } else {
        toast.error("Failed to save resume. Please try again.");
      }
    } catch (err) {
      console.error("[ProfileClient resume]", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  };

  const hasResumeData = summary || skills.length > 0 || experience || education;

  return (
    <div className="space-y-6">

      {/* ── Visual Resume Card ─────────────────────────────────────────── */}
      <div className="card-border">
        <div className="card p-6 rounded-3xl space-y-6">

          {/* Header: photo + name + role + years */}
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-dark-300 border-2 border-jamaica-green/30 flex items-center justify-center">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt={user.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-3xl font-bold text-light-400">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-jamaica-green flex items-center justify-center hover:bg-jamaica-green/80 transition-colors disabled:opacity-50"
                title="Change photo"
              >
                {uploadingPhoto ? (
                  <span className="w-3 h-3 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-black" />
                )}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {/* Name & meta */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold truncate">{user.name}</h2>
              <p className="text-sm text-light-400 truncate">{user.email}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                  user.role === "employer"
                    ? "bg-jamaica-gold/15 text-jamaica-gold"
                    : "bg-jamaica-green/15 text-jamaica-green"
                }`}>
                  {user.role || "applicant"}
                </span>
                {years && (
                  <span className="text-xs text-light-400">
                    {years} yr{Number(years) !== 1 ? "s" : ""} experience
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <div>
              <p className="text-xs text-light-400 uppercase tracking-widest mb-1.5">Summary</p>
              <p className="text-sm text-light-100 leading-relaxed">{summary}</p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <p className="text-xs text-light-400 uppercase tracking-widest mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs font-medium px-3 py-1 rounded-full bg-dark-300 border border-jamaica-green/20 text-light-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {experience && (
            <div>
              <p className="text-xs text-light-400 uppercase tracking-widest mb-1.5">Experience</p>
              <p className="text-sm text-light-100 leading-relaxed">{experience}</p>
            </div>
          )}

          {/* Education */}
          {education && (
            <div>
              <p className="text-xs text-light-400 uppercase tracking-widest mb-1.5">Education</p>
              <p className="text-sm text-light-100">{education}</p>
            </div>
          )}

          {/* Empty state */}
          {!hasResumeData && (
            <div className="text-center py-4 space-y-1">
              <p className="text-sm text-light-400">No resume data yet.</p>
              <p className="text-xs text-light-600">Upload your resume below to populate your profile.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Resume file management ─────────────────────────────────────── */}
      <div className="card-border">
        <div className="card p-6 space-y-5 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">Resume</h2>
              <p className="text-sm text-light-400 mt-1">
                Your saved resume is used automatically when you apply for jobs.
              </p>
            </div>
          </div>

          {resumeUrl ? (
            <div className="flex items-center gap-4 bg-dark-300 border border-jamaica-green/20 rounded-2xl px-4 py-3">
              <span className="text-2xl">📄</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{resumeFileName || "Resume on file"}</p>
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-jamaica-gold hover:text-white transition-colors"
                >
                  View file ↗
                </a>
              </div>
              <button
                onClick={() => resumeInputRef.current?.click()}
                disabled={uploading}
                className="text-xs font-bold text-jamaica-green hover:text-white border border-jamaica-green/30 hover:border-jamaica-green px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Pencil className="w-3 h-3" />
                Replace
              </button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-jamaica-green/30 rounded-2xl p-8 text-center cursor-pointer hover:border-jamaica-green/60 transition-colors"
              onClick={() => resumeInputRef.current?.click()}
            >
              <div className="space-y-2">
                <p className="text-2xl">📄</p>
                <p className="text-sm text-light-400">
                  Click to upload <span className="text-white">PDF or Word</span> (max 5 MB)
                </p>
                <p className="text-xs text-light-600">
                  Populates your profile and saves for faster applications
                </p>
              </div>
            </div>
          )}

          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleResumeUpload}
          />

          {uploading && (
            <p className="text-sm text-jamaica-gold text-center animate-pulse">
              Parsing and saving your resume...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileClient;

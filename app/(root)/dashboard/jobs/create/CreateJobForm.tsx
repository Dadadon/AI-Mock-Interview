"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Sparkles } from "lucide-react";

const PARISHES = [
  "Kingston", "St. Andrew", "St. Thomas", "Portland", "St. Mary",
  "St. Ann", "Trelawny", "St. James", "Hanover", "Westmoreland",
  "St. Elizabeth", "Manchester", "Clarendon", "St. Catherine",
];

const CATEGORIES = [
  "Customer Service", "Retail", "Hospitality", "Construction", "IT & Tech",
  "Healthcare", "Transportation", "Education", "Finance",
  "Events & Entertainment", "General Labour", "Other",
];

type Step = "form" | "review";

const CreateJobForm = ({ employerId }: { employerId: string }) => {
  const router = useRouter();

  const [step, setStep] = useState<Step>("form");
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [criteriaInput, setCriteriaInput] = useState("");
  const [requirementInput, setRequirementInput] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "gig" as "gig" | "job",
    parish: "Kingston",
    pay: "",
    category: "Customer Service",
    criteria: [] as string[],
    requirements: [] as string[],
  });

  // ── Criteria helpers ─────────────────────────────────────────────────
  const addCriteria = () => {
    const trimmed = criteriaInput.trim();
    if (trimmed && !form.criteria.includes(trimmed)) {
      setForm((p) => ({ ...p, criteria: [...p.criteria, trimmed] }));
      setCriteriaInput("");
    }
  };

  const removeCriteria = (item: string) =>
    setForm((p) => ({ ...p, criteria: p.criteria.filter((c) => c !== item) }));

  // ── Requirements helpers ──────────────────────────────────────────────
  const addRequirement = () => {
    const trimmed = requirementInput.trim();
    if (trimmed && !form.requirements.includes(trimmed)) {
      setForm((p) => ({ ...p, requirements: [...p.requirements, trimmed] }));
      setRequirementInput("");
    }
  };

  const removeRequirement = (item: string) =>
    setForm((p) => ({ ...p, requirements: p.requirements.filter((r) => r !== item) }));

  // ── Step 1 → generate questions for review ───────────────────────────
  const handleGeneratePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Job title is required.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/jobs/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.success || !data.questions?.length) {
        toast.error("Failed to generate questions. Please try again.");
        return;
      }

      setQuestions(data.questions);
      setStep("review");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setGenerating(false);
    }
  };

  // ── Question editing ─────────────────────────────────────────────────
  const updateQuestion = (index: number, value: string) =>
    setQuestions((prev) => prev.map((q, i) => (i === index ? value : q)));

  const removeQuestion = (index: number) =>
    setQuestions((prev) => prev.filter((_, i) => i !== index));

  const addQuestion = () =>
    setQuestions((prev) => [...prev, ""]);

  const regenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/jobs/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success && data.questions?.length) {
        setQuestions(data.questions);
        toast.success("Questions regenerated.");
      } else {
        toast.error("Regeneration failed. Keep your current questions.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setGenerating(false);
    }
  };

  // ── Step 2 → publish with reviewed questions ─────────────────────────
  const handlePublish = async () => {
    const finalQuestions = questions.filter((q) => q.trim().length > 0);
    if (finalQuestions.length === 0) {
      toast.error("Add at least one screening question.");
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, employerId, screeningQuestions: finalQuestions, requirements: form.requirements }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Listing published!");
        router.push("/marketplace");
      } else {
        toast.error("Failed to publish. Please try again.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setPublishing(false);
    }
  };

  // ── Step 1: Job details form ─────────────────────────────────────────
  if (step === "form") {
    return (
      <main className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Post a New Listing</h1>
          <p className="text-light-400 text-sm mt-1">
            Fill in the details — AI will draft your screening questions next.
          </p>
        </div>

        <form onSubmit={handleGeneratePreview} className="card p-6 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Job Title *</label>
            <input
              className="w-full bg-dark-300 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
              placeholder="e.g. Customer Service Representative"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="w-full bg-dark-300 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-200 min-h-[100px] resize-none"
              placeholder="Describe the role, responsibilities, and requirements..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          {/* Type + Parish */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Type *</label>
              <select
                className="w-full bg-dark-300 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "gig" | "job" }))}
              >
                <option value="gig">Gig (Short-term)</option>
                <option value="job">Job (Long-term)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Parish</label>
              <select
                className="w-full bg-dark-300 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
                value={form.parish}
                onChange={(e) => setForm((p) => ({ ...p, parish: e.target.value }))}
              >
                {PARISHES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Pay + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Pay</label>
              <input
                className="w-full bg-dark-300 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
                placeholder="e.g. $5,000 JMD/day"
                value={form.pay}
                onChange={(e) => setForm((p) => ({ ...p, pay: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <select
                className="w-full bg-dark-300 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Binary Requirements (eligibility gate) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Eligibility Requirements</label>
            <p className="text-xs text-light-400">
              Hard must-haves shown as Yes / No questions before the interview.
              Candidates who answer No to any requirement are declined instantly — no Vapi call triggered.
            </p>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-dark-300 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
                placeholder="e.g. Do you have a valid Jamaican Driver's License?"
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
              />
              <button type="button" onClick={addRequirement} className="btn-primary px-4 py-2 text-sm rounded-lg">
                Add
              </button>
            </div>
            {form.requirements.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {form.requirements.map((r) => (
                  <div key={r} className="flex items-center justify-between bg-dark-300 border border-jamaica-gold/20 rounded-lg px-3 py-2">
                    <span className="text-sm">{r}</span>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="text-xs text-light-400 font-medium">Yes / No</span>
                      <button type="button" onClick={() => removeRequirement(r)} className="text-light-600 hover:text-destructive-100 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Criteria (used to generate interview questions) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Interview Criteria</label>
            <p className="text-xs text-light-400">
              Skills and traits the AI will use to generate your interview questions.
            </p>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-dark-300 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
                placeholder="e.g. Must have experience with Excel"
                value={criteriaInput}
                onChange={(e) => setCriteriaInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCriteria())}
              />
              <button type="button" onClick={addCriteria} className="btn-primary px-4 py-2 text-sm rounded-lg">
                Add
              </button>
            </div>
            {form.criteria.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.criteria.map((c) => (
                  <span key={c} className="flex items-center gap-1.5 bg-jamaica-green/15 text-jamaica-green text-xs px-2.5 py-1 rounded-full">
                    {c}
                    <button type="button" onClick={() => removeCriteria(c)} className="hover:text-white">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={generating}
            className="btn-primary w-full py-2.5 text-sm font-medium rounded-lg disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? "Generating questions..." : "Generate Screening Questions"}
          </button>
        </form>
      </main>
    );
  }

  // ── Step 2: Review & edit questions ──────────────────────────────────
  return (
    <main className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Review Screening Questions</h1>
          <p className="text-light-400 text-sm mt-1">
            Edit, remove, or add questions before publishing.
          </p>
        </div>
        <button
          onClick={() => setStep("form")}
          className="text-sm text-light-400 hover:text-light-100 transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Job summary pill */}
      <div className="flex flex-wrap gap-2">
        <span className="bg-dark-300 text-xs px-3 py-1 rounded-full text-light-400">{form.title}</span>
        <span className="bg-dark-300 text-xs px-3 py-1 rounded-full text-light-400">{form.parish}</span>
        <span className="bg-dark-300 text-xs px-3 py-1 rounded-full text-light-400">{form.type === "gig" ? "Short-term Gig" : "Full-time Job"}</span>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-light-400">
            {questions.filter((q) => q.trim()).length} question{questions.filter((q) => q.trim()).length !== 1 ? "s" : ""}
          </p>
          <button
            onClick={regenerate}
            disabled={generating}
            className="flex items-center gap-1.5 text-xs text-jamaica-gold hover:text-white transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {generating ? "Regenerating..." : "Regenerate all"}
          </button>
        </div>

        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-2.5 text-xs font-bold text-jamaica-gold w-5 shrink-0">{i + 1}.</span>
              <textarea
                className="flex-1 bg-dark-300 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-jamaica-green resize-none min-h-[72px]"
                value={q}
                onChange={(e) => updateQuestion(i, e.target.value)}
                placeholder="Type a screening question..."
              />
              <button
                onClick={() => removeQuestion(i)}
                className="mt-2 text-light-600 hover:text-destructive-100 transition-colors"
                title="Remove question"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addQuestion}
          className="flex items-center gap-2 text-sm text-jamaica-green hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add question
        </button>
      </div>

      <button
        onClick={handlePublish}
        disabled={publishing || questions.filter((q) => q.trim()).length === 0}
        className="btn-primary w-full py-2.5 text-sm font-medium rounded-lg disabled:opacity-60"
      >
        {publishing ? "Publishing..." : "Publish Listing"}
      </button>
    </main>
  );
};

export default CreateJobForm;

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const PARISHES = [
  "Kingston",
  "St. Andrew",
  "St. Thomas",
  "Portland",
  "St. Mary",
  "St. Ann",
  "Trelawny",
  "St. James",
  "Hanover",
  "Westmoreland",
  "St. Elizabeth",
  "Manchester",
  "Clarendon",
  "St. Catherine",
];

const CATEGORIES = [
  "Customer Service",
  "Retail",
  "Hospitality",
  "Construction",
  "IT & Tech",
  "Healthcare",
  "Transportation",
  "Education",
  "Finance",
  "Events & Entertainment",
  "General Labour",
  "Other",
];

const CreateJobForm = ({ employerId }: { employerId: string }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [criteriaInput, setCriteriaInput] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "gig" as "gig" | "job",
    parish: "Kingston",
    pay: "",
    category: "Customer Service",
    criteria: [] as string[],
  });

  const addCriteria = () => {
    const trimmed = criteriaInput.trim();
    if (trimmed && !form.criteria.includes(trimmed)) {
      setForm((prev) => ({ ...prev, criteria: [...prev.criteria, trimmed] }));
      setCriteriaInput("");
    }
  };

  const removeCriteria = (item: string) => {
    setForm((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((c) => c !== item),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Job title is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, employerId }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Job listing created!");
        router.push("/marketplace");
      } else {
        toast.error("Failed to create listing. Please try again.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Post a New Listing</h1>
        <p className="text-light-400 text-sm mt-1">
          Applicants will be screened automatically via a 2-minute AI voice call.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
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
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
          />
        </div>

        {/* Type + Parish */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type *</label>
            <select
              className="w-full bg-dark-300 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
              value={form.type}
              onChange={(e) =>
                setForm((p) => ({ ...p, type: e.target.value as "gig" | "job" }))
              }
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
              onChange={(e) =>
                setForm((p) => ({ ...p, parish: e.target.value }))
              }
            >
              {PARISHES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
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
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* AI Screening Criteria */}
        <div className="space-y-2">
          <label className="text-sm font-medium">AI Screening Criteria</label>
          <p className="text-xs text-light-400">
            Add specific requirements the AI should assess during the call.
          </p>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-dark-300 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
              placeholder="e.g. Must be available on weekends"
              value={criteriaInput}
              onChange={(e) => setCriteriaInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addCriteria())
              }
            />
            <button
              type="button"
              onClick={addCriteria}
              className="btn-primary px-4 py-2 text-sm rounded-lg"
            >
              Add
            </button>
          </div>
          {form.criteria.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.criteria.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-1.5 bg-jamaica-green/15 text-jamaica-green text-xs px-2.5 py-1 rounded-full"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => removeCriteria(c)}
                    className="hover:text-white"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2.5 text-sm font-medium rounded-lg disabled:opacity-60"
        >
          {loading ? "Generating questions & publishing..." : "Publish Listing"}
        </button>
      </form>
    </main>
  );
};

export default CreateJobForm;

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { createJobPosting } from "@/lib/actions/general.action";
import { toast } from "sonner";

export default function PostJobPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    // Construct the JobPosting object
    const jobData = {
      title: formData.get("title") as string,
      location: formData.get("location") as string,
      description: formData.get("description") as string,
      level: formData.get("level") as string,
      techstack: (formData.get("techstack") as string).split(",").map(s => s.trim()),
      requirements: (formData.get("requirements") as string).split("\n"),
      companyId: "local-jamaica-biz", // This will be dynamic once Company profiles are ready
    };

    const result = await createJobPosting(jobData as any);

    if (result.success) {
      toast.success("Job posted successfully!");
      router.push("/jobs");
    } else {
      toast.error("Failed to post job.");
    }
    setIsLoading(false);
  };

  return (
    <main className="max-w-3xl mx-auto py-10">
      <h1 className="text-4xl font-bold text-light-100 mb-8">Post a New Opportunity</h1>
      
      <form onSubmit={handleSubmit} className="card dark-gradient p-8 rounded-3xl border border-input space-y-6">
        <FormField label="Job Title" name="title" placeholder="e.g. Senior Frontend Developer" required />
        <FormField label="Location" name="location" placeholder="e.g. Kingston, Jamaica (Remote)" required />
        <FormField label="Tech Stack" name="techstack" placeholder="React, Next.js, Tailwind (comma separated)" required />
        <FormField label="Experience Level" name="level" placeholder="Junior, Mid, Senior" required />
        
        <div className="flex flex-col gap-2">
          <label className="text-light-100 font-semibold">Job Description</label>
          <textarea 
            name="description" 
            className="bg-dark-200 border border-input rounded-xl p-4 text-light-100 min-h-[150px]"
            placeholder="Describe the role..."
            required
          />
        </div>

        <Button type="submit" className="w-full blue-gradient-dark py-6 text-lg" disabled={isLoading}>
          {isLoading ? "Posting..." : "Publish Job Posting"}
        </Button>
      </form>
    </main>
  );
}
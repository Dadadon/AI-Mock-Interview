"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import FormField from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form"; // Import the Form provider
import { createJobPosting } from "@/lib/actions/general.action";
import { toast } from "sonner";

// Define a schema for validation (optional but recommended)
const formSchema = z.object({
  title: z.string().min(2),
  location: z.string().min(2),
  techstack: z.string(),
  level: z.string(),
  description: z.string().min(10),
  requirements: z.string(),
});

export default function PostJobPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // 1. Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      location: "",
      techstack: "",
      level: "",
      description: "",
      requirements: "",
    },
  });

  // 2. Define the submit handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    const jobData = {
      ...values,
      techstack: values.techstack.split(",").map(s => s.trim()),
      requirements: values.requirements.split("\n"),
      companyId: "local-jamaica-biz", 
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
      
      {/* 3. Wrap everything in the Form provider */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="card dark-gradient p-8 rounded-3xl border border-input space-y-6">
          <FormField 
            control={form.control} 
            label="Job Title" 
            name="title" 
            placeholder="e.g. Senior Frontend Developer" 
          />
          <FormField 
            control={form.control} 
            label="Location" 
            name="location" 
            placeholder="e.g. Kingston, Jamaica (Remote)" 
          />
          <FormField 
            control={form.control} 
            label="Tech Stack" 
            name="techstack" 
            placeholder="React, Next.js, Tailwind (comma separated)" 
          />
          <FormField 
            control={form.control} 
            label="Experience Level" 
            name="level" 
            placeholder="Junior, Mid, Senior" 
          />
          
          <FormField 
            control={form.control} 
            label="Job Description" 
            name="description" 
            placeholder="Describe the role..." 
          />

          <FormField 
            control={form.control} 
            label="Requirements" 
            name="requirements" 
            placeholder="List requirements (one per line)..." 
          />

          <Button type="submit" className="w-full blue-gradient-dark py-6 text-lg" disabled={isLoading}>
            {isLoading ? "Posting..." : "Publish Job Posting"}
          </Button>
        </form>
      </Form>
    </main>
  );
}
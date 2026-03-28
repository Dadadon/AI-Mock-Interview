"use server";

import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";

/**
 * Creates a new job/gig listing and auto-generates role-specific AI
 * screening questions using Gemini. The questions are stored on the job
 * document so every applicant is screened with criteria tailored to that
 * specific role, rather than a generic question set.
 */
export async function createJob(params: CreateJobParams) {
  try {
    // ── Generate AI screening questions ──────────────────────────────
    const { text: rawQuestions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `You are designing a short voice screening for a Jamaican hiring platform called Neat Gigz.

Generate exactly 4 focused screening questions for the following position.

Role: ${params.title}
Type: ${params.type === "gig" ? "Short-term Gig" : "Full-time Job"}
Category: ${params.category}
Parish: ${params.parish}, Jamaica
Description: ${params.description || "N/A"}
Employer Screening Criteria: ${params.criteria.length > 0 ? params.criteria.join("; ") : "General eligibility"}

REQUIREMENTS:
- Each question must be answerable by voice in under 30 seconds
- Cover: eligibility/availability, relevant experience, a key skill from the criteria, and motivation/fit
- Tone: professional yet warm — suitable for the Jamaican workforce
- Do NOT use "/", "*", "#", or any special characters (the AI reads these aloud)
- Return ONLY a valid JSON array of 4 strings, nothing else:
  ["Question 1", "Question 2", "Question 3", "Question 4"]`,
    });

    let screeningQuestions: string[] = [];
    try {
      screeningQuestions = JSON.parse(rawQuestions.trim());
    } catch {
      // Fallback: split on newlines and take the first 4 non-empty lines
      screeningQuestions = rawQuestions
        .split("\n")
        .map((l) => l.replace(/^[-\d.)\s]+/, "").trim())
        .filter(Boolean)
        .slice(0, 4);
    }

    // ── Persist job document ─────────────────────────────────────────
    const jobRef = db.collection("jobs").doc();
    await jobRef.set({
      ...params,
      screeningQuestions,
      createdAt: new Date().toISOString(),
    });

    return { success: true, jobId: jobRef.id };
  } catch (error) {
    console.error("[createJob] Error:", error);
    return { success: false };
  }
}

export async function getJobs({
  limit = 20,
}: { limit?: number } = {}): Promise<Job[]> {
  const jobs = await db
    .collection("jobs")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return jobs.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Job[];
}

export async function getJobById(jobId: string): Promise<Job | null> {
  const doc = await db.collection("jobs").doc(jobId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Job;
}

export async function getApplicationsByEmployerId(
  employerId: string
): Promise<Application[]> {
  const apps = await db
    .collection("applications")
    .where("employerId", "==", employerId)
    .orderBy("createdAt", "desc")
    .get();

  return apps.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Application[];
}

export async function getApplicationsByJobId(
  jobId: string
): Promise<Application[]> {
  const apps = await db
    .collection("applications")
    .where("jobId", "==", jobId)
    .orderBy("createdAt", "desc")
    .get();

  return apps.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Application[];
}

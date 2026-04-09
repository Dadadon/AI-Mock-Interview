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
export async function createJob(params: CreateJobParams & { screeningQuestions?: string[] }) {
  try {
    // ── Use provided questions or generate via AI ─────────────────────
    if (params.screeningQuestions && params.screeningQuestions.length > 0) {
      const jobRef = db.collection("jobs").doc();
      await jobRef.set({
        ...params,
        createdAt: new Date().toISOString(),
      });
      return { success: true, jobId: jobRef.id };
    }

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
      // Strip markdown code fences Gemini sometimes wraps around JSON
      const cleaned = rawQuestions
        .trim()
        .replace(/^```json?\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();
      screeningQuestions = JSON.parse(cleaned);
    } catch {
      // Fallback: extract quoted question strings
      const matches = rawQuestions.match(/"([^"]+\?)"/g);
      if (matches && matches.length >= 2) {
        screeningQuestions = matches.map((m) => m.replace(/^"|"$/g, "")).slice(0, 4);
      } else {
        screeningQuestions = rawQuestions
          .split("\n")
          .map((l) => l.replace(/^[\s\-\d.)"'`]+/, "").replace(/["'`]$/, "").trim())
          .filter((l) => l.length > 10 && l.includes("?"))
          .slice(0, 4);
      }
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

export async function getApplicationsByUserId(
  userId: string
): Promise<Application[]> {
  const apps = await db
    .collection("applications")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return apps.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Application[];
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

export async function getApplicationById(
  applicationId: string
): Promise<Application | null> {
  const doc = await db.collection("applications").doc(applicationId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Application;
}

export async function createApplication(params: {
  userId: string;
  jobId: string;
  employerId: string;
  applicantName: string;
  jobTitle: string;
  resumeUrl?: string;
  resumeText?: string;
  eligibilityScore?: number;
}): Promise<{ success: boolean; applicationId?: string }> {
  try {
    // ── Fetch job for employer questions + context ─────────────────────
    const jobSnap = await db.collection("jobs").doc(params.jobId).get();
    const jobData = jobSnap.data() || {};
    const employerQuestions: string[] = jobData.screeningQuestions || [];

    // ── Generate resume-tailored additions using Gemini ───────────────
    let interviewQuestions: string[] = [...employerQuestions];

    try {
      const resumeText = params.resumeText || "";
      const { text: rawAdditions } = await generateText({
        model: google("gemini-2.0-flash-001"),
        prompt: `You are preparing personalised voice interview questions for a candidate applying to a role on Neat Gigz, a Jamaican hiring platform.

Job Title: ${params.jobTitle}
Job Description: ${jobData.description || "N/A"}
Job Category: ${jobData.category || "General"}
Employer Criteria: ${Array.isArray(jobData.criteria) ? jobData.criteria.join("; ") : "N/A"}

Candidate Resume:
${resumeText || "No resume text available."}

The employer has already set these interview questions that MUST be asked:
${employerQuestions.length > 0 ? employerQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n") : "None"}

Generate ${employerQuestions.length > 0 ? "2-3" : "5-6"} ADDITIONAL questions that are personalised to this specific candidate's resume and the role.
- Deep-dive into specific experience, skills, or gaps visible in their resume
- Situational or behavioural questions relevant to the job
- Do NOT repeat or rephrase the employer's existing questions above
- Each answerable by voice in 60-90 seconds
- Warm professional tone for the Jamaican workforce
- Do NOT use "/", "*", "#", or special characters
- Return ONLY a valid JSON array of strings, nothing else`,
      });

      const cleaned = rawAdditions.trim()
        .replace(/^```json?\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();

      let additions: string[] = [];
      try {
        additions = JSON.parse(cleaned);
      } catch {
        const matches = rawAdditions.match(/"([^"]+\?)"/g);
        if (matches) {
          additions = matches.map((m) => m.replace(/^"|"$/g, ""));
        }
      }

      // Employer questions first, personalised additions after
      interviewQuestions = [...employerQuestions, ...additions];
    } catch (genErr) {
      console.error("[createApplication] Question generation failed, using employer questions only:", genErr);
    }

    // ── Persist application doc ───────────────────────────────────────
    const ref = db.collection("applications").doc();
    await ref.set({
      ...params,
      interviewQuestions,
      status: "interview_pending",
      createdAt: new Date().toISOString(),
    });

    return { success: true, applicationId: ref.id };
  } catch (error) {
    console.error("[createApplication] Error:", error);
    return { success: false };
  }
}

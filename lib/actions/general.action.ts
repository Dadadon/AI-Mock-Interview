"use server";

import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";


export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();

  return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const interviews = await db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

// lib/actions/general.action.ts (ADDITIONS)

// CRUD for Job Postings (C is shown)
export async function createJobPosting(params: JobPosting) {
  // In a real app, verify user role is 'business' before proceeding
  try {
    const jobPosting = { ...params, createdAt: new Date().toISOString() };
    const docRef = await db.collection("jobPostings").add(jobPosting);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating job posting:", error);
    return { success: false };
  }
}

// CRUD for Gig Projects (C is shown)
export async function createGigProject(params: GigProject) {
  // In a real app, verify user role is 'business' before proceeding
  try {
    const gigProject = { ...params, createdAt: new Date().toISOString() };
    const docRef = await db.collection("gigProjects").add(gigProject);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating gig project:", error);
    return { success: false };
  }
}
// Add corresponding fetch functions: getJobPostings(), getGigProjects(), etc.
/**
 * Fetches all active job postings for the marketplace.
 */
export async function getJobPostings(): Promise<JobPosting[] | null> {
  try {
    const postings = await db.collection("jobPostings").orderBy("createdAt", "desc").get();
    
    if (postings.empty) return null;

    return postings.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as JobPosting[];
  } catch (error) {
    console.error("Error fetching job postings:", error);
    return null;
  }
}

/**
 * Fetches all active gig projects for the marketplace.
 */
export async function getGigProjects(): Promise<GigProject[] | null> {
  try {
    const gigs = await db.collection("gigProjects").orderBy("createdAt", "desc").get();
    
    if (gigs.empty) return null;

    return gigs.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GigProject[];
  } catch (error) {
    console.error("Error fetching gig projects:", error);
    return null;
  }
}

/**
 * Fetches a single job posting by ID.
 */
export async function getJobPostingById(id: string): Promise<JobPosting | null> {
  const job = await db.collection("jobPostings").doc(id).get();
  return job.data() as JobPosting | null;
}

/**
 * Fetches all applications submitted to a specific company.
 */
export async function getApplicationsForBusiness(companyId: string): Promise<Application[] | null> {
  try {
    const applications = await db
      .collection("applications")
      .where("companyId", "==", companyId)
      .orderBy("submittedAt", "desc")
      .get();
      
    if (applications.empty) return null;

    return applications.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Application[];
  } catch (error) {
    console.error("Error fetching applications for business:", error);
    return null;
  }
}


// --- NEW EXIT INTERVIEW ACTION ---

interface CreateExitInterviewSummaryParams {
    userId: string;
    transcript: { role: string; content: string }[];
    companyId: string;
    jobTitle: string; 
}

/**
 * Conducts AI analysis on a full exit interview transcript and saves the summary.
 */
export async function createExitInterviewSummary(params: CreateExitInterviewSummaryParams) {
  const { userId, transcript, companyId, jobTitle } = params;

  try {
    const formattedTranscript = transcript
      .map((sentence: { role: string; content: string }) => `- ${sentence.role}: ${sentence.content}\n`)
      .join("");

    const { text: aiSummary } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Analyze the following exit interview transcript and provide a neutral, concise summary, structured as follows:
        **Main Reason for Leaving:** (1-2 sentences)
        **Key Feedback on Management/Culture:** (1-2 sentences)
        **Top Suggestion for Improvement:** (1 sentence)
        **Overall Tone:** (e.g., Positive, Neutral, Hostile)
        
        Transcript:
        ${formattedTranscript}
        
        Return the summary as a single, formatted markdown string ready for display.`,
    });

    const exitInterview = {
      companyId: companyId,
      userId: userId,
      jobTitle: jobTitle,
      dateConducted: new Date().toISOString(),
      transcript: transcript,
      aiSummary: aiSummary,
    };

    const docRef = await db.collection("exitInterviews").add(exitInterview);

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating exit interview summary:", error);
    return { success: false };
  }
}

// lib/actions/general.action.ts (ADDITIONS)

export async function getAnalyticsData(companyId: string) {
    // NOTE: In production, filter feedback by companyId/jobId.
    // For this guide, we fetch ALL feedback and focus on aggregation logic.
    const feedbackSnapshot = await db.collection("feedback").get(); 
    const allFeedback = feedbackSnapshot.docs.map(doc => doc.data()) as Feedback[];

    const totalInterviews = allFeedback.length;
    const totalScoreSum = allFeedback.reduce((sum, f) => sum + f.totalScore, 0);
    const averageScore = totalInterviews > 0 ? totalScoreSum / totalInterviews : 0;
    
    // Skill Gap Analysis (Counting for local intelligence)
    const improvementFrequency = new Map<string, number>();

    allFeedback.forEach(f => {
        // Aggregate all areas for improvement across all feedback
        f.areasForImprovement.forEach(area => {
            const normalizedArea = area.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
            improvementFrequency.set(normalizedArea, (improvementFrequency.get(normalizedArea) || 0) + 1);
        });
    });
    
    // Get top 5 skill gaps
    const topSkillGaps = Array.from(improvementFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([area, count]) => ({ area, count }));


    return {
        averageScore: Math.round(averageScore),
        totalInterviews,
        topSkillGaps,
        // Add other metrics like Application Counts from 'applications' collection
    };
}

// Add this to lib/actions/general.action.ts

export async function submitApplication(params: { jobId: string; userId: string; companyId: string }) {
  try {
    const application = {
      ...params,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };
    
    const docRef = await db.collection("applications").add(application);
    return { success: true, applicationId: docRef.id };
  } catch (error) {
    console.error("Error submitting application:", error);
    return { success: false };
  }
}

// lib/actions/general.action.ts




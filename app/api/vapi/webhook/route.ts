import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

export async function POST(request: Request) {
  const body = await request.json();
  const { message } = body;

  // Acknowledge all non-report events immediately
  if (!message || message.type !== "end-of-call-report") {
    return Response.json({ success: true }, { status: 200 });
  }

  const { call, transcript, summary } = message;

  // Extract identifiers — try metadata first, then assistantOverrides.variableValues
  const meta = call?.metadata || {};
  const vars = call?.assistantOverrides?.variableValues || {};

  const userId: string = meta.userId || vars.userid || "";
  const jobId: string = meta.jobId || vars.jobId || "";
  const employerId: string = meta.employerId || vars.employerId || "";
  const applicantName: string = meta.applicantName || vars.username || "Unknown Applicant";
  const jobTitle: string = meta.jobTitle || vars.jobTitle || "Unknown Role";

  if (!userId || !jobId) {
    console.error("[vapi/webhook] Missing userId or jobId in call metadata:", { meta, vars });
    return Response.json({ success: false, error: "Missing call metadata" }, { status: 400 });
  }

  try {
    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", { structuredOutputs: false }),
      schema: feedbackSchema,
      prompt: `You are evaluating a voice screening interview for a Jamaican gig/job platform.
Job Title: ${jobTitle}

Interview Transcript:
${transcript || "No transcript available."}

Score the candidate from 0 to 100 in the following categories:
- Communication Skills
- Technical Knowledge
- Problem Solving
- Cultural Fit
- Confidence and Clarity

Be fair but honest. Consider the Jamaican job market context.`,
      system:
        "You are a professional recruiter evaluating a voice-based job screening interview for a Jamaican labor platform.",
    });

    const application = {
      userId,
      jobId,
      employerId,
      applicantName,
      jobTitle,
      status: "completed",
      transcript: transcript || "",
      score: object.totalScore,
      summary: summary || object.finalAssessment,
      callId: call?.id || "",
      createdAt: new Date().toISOString(),
    };

    await db.collection("applications").add(application);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[vapi/webhook] Error processing call report:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, message: "Vapi webhook endpoint is live." }, { status: 200 });
}

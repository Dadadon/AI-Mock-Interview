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
      prompt: `You are evaluating a voice screening interview for Neat Gigz, a Jamaican AI-powered gig and job placement platform.

Job Title: ${jobTitle}

Interview Transcript:
${transcript || "No transcript available."}

JAMAICAN CONTEXT — CRITICAL SCORING GUIDANCE:
- The candidate may speak with a Jamaican accent, in Jamaican Standard English, or blend Jamaican Patois expressions. This is completely normal and expected on this platform.
- DO NOT penalise any candidate for their accent, dialect, or use of Patois expressions. Accent and dialect are NOT indicators of communication quality on this platform.
- Jamaican expressions like "yeah man", "irie", "wah gwaan", "big up", "nuh worry", "mi deh yah", "lickle more", "soon come", etc. are professional communication in context — evaluate the intent and meaning, not the phrasing.
- Communication Skills should be scored on clarity of thought, coherence of answers, and ability to convey relevant information — not on whether the candidate speaks in a particular accent or dialect.
- Cultural Fit should reflect Jamaican professional culture: hardworking, warm, community-oriented, and resilient. A candidate who demonstrates "wi likkle but wi tallawah" (we may be small but we are strong) mentality is showing excellent cultural fit.
- For hospitality, retail, and customer service roles: genuine warmth and a welcoming personality are professional strengths — score them accordingly.

Score the candidate from 0 to 100 in these categories:
- Communication Skills (clarity of thought and ability to convey information — not accent)
- Technical Knowledge (relevant skills and experience for the role)
- Problem Solving (ability to think through challenges and offer solutions)
- Cultural Fit (alignment with Jamaican professional culture and the employer's values)
- Confidence and Clarity (composed, engaged, and clear in their responses)

Be fair, constructive, and culturally aware. Aim to surface genuine talent.`,
      system:
        "You are a professional recruiter and cultural intelligence expert evaluating voice-based job screenings for Neat Gigz, a Jamaican labor placement platform. You understand and respect Jamaican accents, Patois, and professional culture.",
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

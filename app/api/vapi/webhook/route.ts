import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

const JAMAICAN_CONTEXT = `
JAMAICAN CONTEXT — CRITICAL SCORING GUIDANCE:
- The candidate may speak with a Jamaican accent, in Jamaican Standard English, or blend Patois. This is normal and expected.
- DO NOT penalise accent, dialect, or Patois expressions.
- Communication Skills = clarity of thought and ability to convey information — not accent.
- Cultural Fit = Jamaican professional culture: hardworking, warm, community-oriented, resilient.
`;

export async function POST(request: Request) {
  // ── Secret verification ────────────────────────────────────────────────────
  const incomingSecret = request.headers.get("x-vapi-secret");
  const expectedSecret = process.env.VAPI_WEBHOOK_SECRET;

  if (expectedSecret && incomingSecret !== expectedSecret) {
    console.warn("[vapi/webhook] Rejected — secret mismatch");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { message } = body;

  if (!message || message.type !== "end-of-call-report") {
    return Response.json({ success: true }, { status: 200 });
  }

  const { call, transcript, summary } = message;

  const meta = call?.metadata || {};
  const vars = call?.assistantOverrides?.variableValues || {};

  const userId: string = meta.userId || vars.userId || vars.userid || "";
  const jobId: string = meta.jobId || vars.jobId || "";
  const employerId: string = meta.employerId || vars.employerId || "";
  const applicantName: string = meta.applicantName || vars.username || "Unknown Applicant";
  const jobTitle: string = meta.jobTitle || vars.jobTitle || "Unknown Role";
  const applicationId: string = meta.applicationId || vars.applicationId || "";

  if (!userId || !jobId) {
    console.error("[vapi/webhook] Missing userId or jobId:", { meta, vars });
    return Response.json({ success: false, error: "Missing call metadata" }, { status: 400 });
  }

  try {
    // ── Guard: require meaningful candidate participation ──────────────────
    const candidateLines = (transcript || "")
      .split("\n")
      .filter((l) => l.trim().toLowerCase().startsWith("user:") || l.trim().toLowerCase().startsWith("candidate:"));

    const candidateWordCount = candidateLines
      .join(" ")
      .replace(/^(user|candidate):\s*/gim, "")
      .split(/\s+/)
      .filter(Boolean).length;

    if (candidateLines.length === 0 || candidateWordCount < 20) {
      console.warn(`[vapi/webhook] Insufficient candidate speech (${candidateWordCount} words) — marking incomplete`);
      if (applicationId) {
        await db.collection("applications").doc(applicationId).update({
          status: "interview_incomplete",
          updatedAt: new Date().toISOString(),
        });
      }
      return Response.json({ success: true, skipped: "no candidate speech" }, { status: 200 });
    }

    // ── Score the interview ────────────────────────────────────────────────
    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", { structuredOutputs: false }),
      schema: feedbackSchema,
      prompt: `You are evaluating a voice interview for Neat Gigz, a Jamaican hiring platform.
The candidate already passed a binary eligibility check — evaluate their qualitative depth.

Job Title: ${jobTitle}
Interview Transcript:
${transcript || "No transcript available."}

${JAMAICAN_CONTEXT}

Score the candidate 0–100 across these five categories:
- Communication Skills (clarity of thought — not accent)
- Technical Knowledge (depth of relevant skills and experience)
- Problem Solving (ability to think through challenges)
- Cultural Fit (alignment with Jamaican professional culture)
- Confidence and Clarity (composed, engaged, clear)

CRITICAL REQUIREMENT — TRANSCRIPT EVIDENCE:
Every piece of feedback MUST be grounded in specific moments from the transcript above.
- category comment: cite a direct quote or paraphrase from the candidate's actual words that justifies the score. Example: "When asked about X, the candidate said '...' which showed..."
- strengths: each item must reference a specific answer or moment — not generic praise. Example: "Clearly articulated their experience with X when answering the question about Y."
- areasForImprovement: each item must reference a specific gap or vague answer from the call. Example: "When asked about Z, the response lacked specifics — mentioned only '...' without concrete detail."
- finalAssessment: a 2–3 sentence narrative that references the standout moments (positive and negative) from the conversation by name.

Do NOT write generic feedback that could apply to any candidate. Every observation must be traceable to something said in this specific call.
This is the final assessment sent to the employer — make it evidence-based and actionable.`,
      system: "You are a professional recruiter evaluating voice interviews for Neat Gigz, a Jamaican hiring platform.",
    });

    // ── Persist result ────────────────────────────────────────────────────
    const updateData = {
      interviewScore: object.totalScore,
      interviewTranscript: transcript || "",
      interviewSummary: summary || object.finalAssessment,
      interviewFeedback: object,
      status: "complete",
      updatedAt: new Date().toISOString(),
    };

    if (applicationId) {
      await db.collection("applications").doc(applicationId).update(updateData);
      console.log(`[vapi/webhook] Scored application ${applicationId}: ${object.totalScore}/100`);
    } else {
      // Legacy path: no pre-created doc — create one now
      await db.collection("applications").add({
        userId, jobId, employerId, applicantName, jobTitle,
        ...updateData,
        createdAt: new Date().toISOString(),
      });
      console.warn("[vapi/webhook] No applicationId in metadata — created new doc");
    }

    return Response.json({ success: true, score: object.totalScore }, { status: 200 });
  } catch (error) {
    console.error("[vapi/webhook] Error:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, message: "Vapi webhook endpoint is live." }, { status: 200 });
}

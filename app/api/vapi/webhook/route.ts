import { generateObject, generateText } from "ai";
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

  const userId: string = meta.userId || vars.userid || "";
  const jobId: string = meta.jobId || vars.jobId || "";
  const employerId: string = meta.employerId || vars.employerId || "";
  const applicantName: string = meta.applicantName || vars.username || "Unknown Applicant";
  const jobTitle: string = meta.jobTitle || vars.jobTitle || "Unknown Role";
  const applicationId: string = meta.applicationId || "";

  if (!userId || !jobId) {
    console.error("[vapi/webhook] Missing userId or jobId:", { meta, vars });
    return Response.json({ success: false, error: "Missing call metadata" }, { status: 400 });
  }

  try {
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

Score the candidate 0–100 across:
- Communication Skills (clarity of thought — not accent)
- Technical Knowledge (depth of relevant skills and experience)
- Problem Solving (ability to think through challenges)
- Cultural Fit (alignment with Jamaican professional culture)
- Confidence and Clarity (composed, engaged, clear)

Provide detailed, constructive feedback. This is the final assessment sent to the employer.`,
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

    // ── Generate personalised interview questions for future use ──────────
    // (stored for reference; the interview already happened)
    if (applicationId) {
      try {
        const appSnap = await db.collection("applications").doc(applicationId).get();
        const resumeText: string = appSnap.data()?.resumeText || "";

        if (resumeText) {
          const jobSnap = await db.collection("jobs").doc(jobId).get();
          const jobData = jobSnap.data() || {};

          const { text: rawQuestions } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: `Based on this candidate's resume and the ${jobTitle} role at Neat Gigz, generate 6 tailored follow-up or debrief questions an employer could ask in a second-round interview.

Job Description: ${jobData.description || "N/A"}
Resume Summary: ${resumeText.substring(0, 1000)}

Return ONLY a valid JSON array of 6 strings.`,
          });

          let followUpQuestions: string[] = [];
          try {
            const cleaned = rawQuestions.trim().replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
            followUpQuestions = JSON.parse(cleaned);
          } catch {
            // Non-fatal — skip
          }

          if (followUpQuestions.length > 0) {
            await db.collection("applications").doc(applicationId).update({ followUpQuestions });
          }
        }
      } catch (err) {
        console.error("[vapi/webhook] Follow-up question generation failed:", err);
      }
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

import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

const SCREENING_PASS_THRESHOLD = 60;

// ── Shared Jamaican scoring context ──────────────────────────────────────────
const JAMAICAN_CONTEXT = `
JAMAICAN CONTEXT — CRITICAL SCORING GUIDANCE:
- The candidate may speak with a Jamaican accent, in Jamaican Standard English, or blend Jamaican Patois expressions. This is completely normal and expected on this platform.
- DO NOT penalise any candidate for their accent, dialect, or use of Patois expressions.
- Jamaican expressions like "yeah man", "irie", "wah gwaan", "big up", "nuh worry", "mi deh yah", "lickle more", "soon come" are professional communication in context.
- Communication Skills should be scored on clarity of thought and ability to convey relevant information — not on accent or dialect.
- Cultural Fit should reflect Jamaican professional culture: hardworking, warm, community-oriented, and resilient.
`;

export async function POST(request: Request) {
  // ── Secret verification ────────────────────────────────────────────────────
  const incomingSecret = request.headers.get("x-vapi-secret");
  const expectedSecret = process.env.VAPI_WEBHOOK_SECRET;

  if (expectedSecret && incomingSecret !== expectedSecret) {
    console.warn("[vapi/webhook] Rejected request — secret mismatch");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { message } = body;

  if (!message || message.type !== "end-of-call-report") {
    return Response.json({ success: true }, { status: 200 });
  }

  const { call, transcript, summary } = message;

  // ── Extract metadata ───────────────────────────────────────────────────────
  const meta = call?.metadata || {};
  const vars = call?.assistantOverrides?.variableValues || {};

  const userId: string = meta.userId || vars.userid || "";
  const jobId: string = meta.jobId || vars.jobId || "";
  const employerId: string = meta.employerId || vars.employerId || "";
  const applicantName: string = meta.applicantName || vars.username || "Unknown Applicant";
  const jobTitle: string = meta.jobTitle || vars.jobTitle || "Unknown Role";
  const applicationId: string = meta.applicationId || "";
  const callPhase: "screening" | "interview" = meta.callPhase || "screening";

  if (!userId || !jobId) {
    console.error("[vapi/webhook] Missing userId or jobId:", { meta, vars });
    return Response.json({ success: false, error: "Missing call metadata" }, { status: 400 });
  }

  try {
    if (callPhase === "screening") {
      return await handleScreening({
        applicationId, userId, jobId, employerId,
        applicantName, jobTitle, transcript, summary,
      });
    } else {
      return await handleInterview({
        applicationId, userId, jobId, employerId,
        applicantName, jobTitle, transcript, summary,
      });
    }
  } catch (error) {
    console.error("[vapi/webhook] Error:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// ── Screening handler ─────────────────────────────────────────────────────────
async function handleScreening(params: {
  applicationId: string;
  userId: string;
  jobId: string;
  employerId: string;
  applicantName: string;
  jobTitle: string;
  transcript: string;
  summary: string;
}) {
  const { applicationId, userId, jobId, employerId, applicantName, jobTitle, transcript, summary } = params;

  const { object } = await generateObject({
    model: google("gemini-2.0-flash-001", { structuredOutputs: false }),
    schema: feedbackSchema,
    prompt: `You are evaluating a SHORT VOICE SCREENING for Neat Gigz, a Jamaican hiring platform.
This is a 2-minute gatekeeping screening — not a full interview.

Job Title: ${jobTitle}
Transcript:
${transcript || "No transcript available."}

${JAMAICAN_CONTEXT}

Score the candidate 0–100 in these categories:
- Communication Skills (clarity and ability to convey information — not accent)
- Technical Knowledge (relevant skills/experience mentioned)
- Problem Solving (ability to think through challenges)
- Cultural Fit (alignment with Jamaican professional culture)
- Confidence and Clarity (composed and clear responses)

Be fair. This is a quick filter — focus on whether the candidate has basic eligibility and communication ability.`,
    system: "You are a professional recruiter evaluating voice screenings for Neat Gigz, a Jamaican hiring platform.",
  });

  const passed = object.totalScore >= SCREENING_PASS_THRESHOLD;

  const updateData: Record<string, unknown> = {
    screeningScore: object.totalScore,
    screeningPassed: passed,
    screeningTranscript: transcript || "",
    screeningSummary: summary || object.finalAssessment,
    status: passed ? "interview_pending" : "screening_failed",
    updatedAt: new Date().toISOString(),
  };

  // If no application doc exists yet (legacy path), create it
  const docRef = applicationId
    ? db.collection("applications").doc(applicationId)
    : db.collection("applications").doc();

  if (!applicationId) {
    // Legacy: create full application doc
    await docRef.set({
      userId, jobId, employerId, applicantName, jobTitle,
      ...updateData,
      createdAt: new Date().toISOString(),
    });
  } else {
    await docRef.update(updateData);
  }

  // If passed, generate tailored interview questions from resume + job
  if (passed) {
    try {
      const appSnap = await docRef.get();
      const appData = appSnap.data() || {};
      const resumeText: string = appData.resumeText || "";

      // Fetch job description for context
      const jobSnap = await db.collection("jobs").doc(jobId).get();
      const jobData = jobSnap.data() || {};

      const { text: rawQuestions } = await generateText({
        model: google("gemini-2.0-flash-001"),
        prompt: `You are preparing a personalised voice interview for a candidate applying to a role on Neat Gigz, a Jamaican hiring platform.

Job Title: ${jobTitle}
Job Description: ${jobData.description || "N/A"}
Job Category: ${jobData.category || "General"}
Employer Criteria: ${Array.isArray(jobData.criteria) ? jobData.criteria.join("; ") : "N/A"}

Candidate's Resume:
${resumeText || "No resume provided — generate general role-relevant questions."}

Generate exactly 6 interview questions tailored to this specific candidate and role.
- Mix of: experience deep-dives based on their resume, situational/behavioural, and role-specific technical
- Each question answerable by voice in 60–90 seconds
- Warm and professional tone suitable for Jamaican workforce
- Do NOT use "/", "*", "#", or special characters
- Return ONLY a valid JSON array of 6 strings:
  ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5", "Question 6"]`,
      });

      let interviewQuestions: string[] = [];
      try {
        const cleaned = rawQuestions
          .trim()
          .replace(/^```json?\s*/i, "")
          .replace(/```\s*$/, "")
          .trim();
        interviewQuestions = JSON.parse(cleaned);
      } catch {
        const matches = rawQuestions.match(/"([^"]+\?)"/g);
        if (matches && matches.length >= 2) {
          interviewQuestions = matches.map((m) => m.replace(/^"|"$/g, "")).slice(0, 6);
        } else {
          interviewQuestions = rawQuestions
            .split("\n")
            .map((l) => l.replace(/^[\s\-\d.)"'`]+/, "").replace(/["'`]$/, "").trim())
            .filter((l) => l.length > 10 && l.includes("?"))
            .slice(0, 6);
        }
      }

      if (interviewQuestions.length === 0) {
        // Fallback: role-generic questions so the interview can still proceed
        interviewQuestions = [
          `Tell me about your background and what drew you to the ${jobTitle} role.`,
          `What relevant experience do you have that makes you a strong fit for this position?`,
          `Describe a challenge you faced in a previous role and how you resolved it.`,
          `How do you handle working under pressure or tight deadlines?`,
          `What are your key strengths that would benefit this role?`,
          `Where do you see yourself professionally in the next two years?`,
        ];
        console.warn("[vapi/webhook] Using fallback interview questions — Gemini parse failed");
      }

      await docRef.update({ interviewQuestions });
      console.log(`[vapi/webhook] Saved ${interviewQuestions.length} interview questions for application ${docRef.id}`);
    } catch (err) {
      console.error("[vapi/webhook] Interview question generation failed:", err);
      // Still try to save fallback questions so the interview is not blocked
      try {
        await docRef.update({
          interviewQuestions: [
            `Tell me about your background and what drew you to the ${jobTitle} role.`,
            `What relevant experience do you have for this position?`,
            `Describe a challenge you resolved in a previous role.`,
            `How do you handle working under pressure?`,
            `What are your key strengths for this role?`,
            `Where do you see yourself professionally in the next two years?`,
          ],
        });
      } catch (fallbackErr) {
        console.error("[vapi/webhook] Fallback question save also failed:", fallbackErr);
      }
    }
  }

  return Response.json({ success: true, passed, score: object.totalScore }, { status: 200 });
}

// ── Interview handler ─────────────────────────────────────────────────────────
async function handleInterview(params: {
  applicationId: string;
  userId: string;
  jobId: string;
  employerId: string;
  applicantName: string;
  jobTitle: string;
  transcript: string;
  summary: string;
}) {
  const { applicationId, jobTitle, transcript, summary } = params;

  const { object } = await generateObject({
    model: google("gemini-2.0-flash-001", { structuredOutputs: false }),
    schema: feedbackSchema,
    prompt: `You are evaluating a FULL VOICE INTERVIEW for Neat Gigz, a Jamaican hiring platform.
This candidate already passed the initial screening — evaluate them thoroughly.

Job Title: ${jobTitle}
Interview Transcript:
${transcript || "No transcript available."}

${JAMAICAN_CONTEXT}

Score the candidate 0–100 across these categories:
- Communication Skills (clarity of thought — not accent)
- Technical Knowledge (depth of relevant skills and experience)
- Problem Solving (ability to think through challenges and offer solutions)
- Cultural Fit (alignment with Jamaican professional culture and employer values)
- Confidence and Clarity (composed, engaged, and clear)

Provide detailed, constructive feedback. This is the final assessment sent to the employer.`,
    system: "You are a professional recruiter evaluating full-length voice interviews for Neat Gigz, a Jamaican hiring platform.",
  });

  const updateData: Record<string, unknown> = {
    interviewScore: object.totalScore,
    interviewTranscript: transcript || "",
    interviewSummary: summary || object.finalAssessment,
    interviewFeedback: object,
    status: "complete",
    updatedAt: new Date().toISOString(),
  };

  if (applicationId) {
    await db.collection("applications").doc(applicationId).update(updateData);
  } else {
    console.warn("[vapi/webhook] Interview phase missing applicationId — cannot update doc");
  }

  return Response.json({ success: true, score: object.totalScore }, { status: 200 });
}

export async function GET() {
  return Response.json({ success: true, message: "Vapi webhook endpoint is live." }, { status: 200 });
}

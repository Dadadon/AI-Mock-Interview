import { db } from "@/firebase/admin";

/**
 * GET /api/application/status?applicationId=xxx
 * Server-side status check using admin SDK — bypasses Firestore security rules.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const applicationId = searchParams.get("applicationId");

  if (!applicationId) {
    return Response.json({ error: "Missing applicationId" }, { status: 400 });
  }

  const snap = await db.collection("applications").doc(applicationId).get();
  if (!snap.exists) {
    return Response.json({ status: "pending" }, { status: 200 });
  }

  const data = snap.data()!;
  return Response.json({
    status: data.status,
    screeningPassed: data.screeningPassed ?? null,
    hasInterviewQuestions: Array.isArray(data.interviewQuestions) && data.interviewQuestions.length > 0,
  }, { status: 200 });
}

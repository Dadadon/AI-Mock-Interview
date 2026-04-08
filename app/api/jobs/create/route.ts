import { createJob } from "@/lib/actions/jobs.action";

/**
 * POST /api/jobs/create
 * Delegates to the createJob server action which handles both Gemini
 * question generation and Firestore persistence in a single transaction.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { employerId, title, description, type, parish, pay, category, criteria, screeningQuestions, requirements } =
    body;

  if (!employerId || !title || !type) {
    return Response.json(
      { success: false, error: "Missing required fields: employerId, title, type" },
      { status: 400 }
    );
  }

  const result = await createJob({
    employerId,
    title,
    description: description || "",
    type,
    parish: parish || "Kingston",
    pay: pay || "Negotiable",
    category: category || "General",
    criteria: Array.isArray(criteria) ? criteria : [],
    requirements: Array.isArray(requirements) ? requirements : [],
    screeningQuestions: Array.isArray(screeningQuestions) ? screeningQuestions : undefined,
  });

  if (result.success) {
    return Response.json({ success: true, jobId: result.jobId }, { status: 200 });
  }

  return Response.json(
    { success: false, error: "Failed to create listing" },
    { status: 500 }
  );
}

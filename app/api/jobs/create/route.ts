import { db } from "@/firebase/admin";

export async function POST(request: Request) {
  const body = await request.json();
  const { employerId, title, description, type, parish, pay, category, criteria } = body;

  if (!employerId || !title || !type) {
    return Response.json(
      { success: false, error: "Missing required fields: employerId, title, type" },
      { status: 400 }
    );
  }

  try {
    const jobRef = db.collection("jobs").doc();
    await jobRef.set({
      employerId,
      title,
      description: description || "",
      type,
      parish: parish || "Kingston",
      pay: pay || "Negotiable",
      category: category || "General",
      criteria: Array.isArray(criteria) ? criteria : [],
      createdAt: new Date().toISOString(),
    });

    return Response.json({ success: true, jobId: jobRef.id }, { status: 200 });
  } catch (error) {
    console.error("[jobs/create] Error:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}

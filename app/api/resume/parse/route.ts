import { NextRequest } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

/**
 * POST /api/resume/parse
 * Accepts a PDF resume as multipart/form-data, passes it to Gemini 2.0 Flash
 * for text extraction, and returns structured resume data.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("resume") as File | null;

  if (!file) {
    return Response.json({ success: false, error: "No file provided" }, { status: 400 });
  }

  const allowedTypes = ["application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
    return Response.json(
      { success: false, error: "Only PDF and Word documents are accepted" },
      { status: 400 }
    );
  }

  try {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = file.type || "application/pdf";

    const { text } = await generateText({
      model: google("gemini-2.0-flash-001"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              data: base64,
              mimeType,
            },
            {
              type: "text",
              text: `Extract the following information from this resume and return ONLY a valid JSON object, nothing else:
{
  "name": "candidate's full name or empty string if not found",
  "summary": "2-3 sentence professional summary of the candidate",
  "skills": ["skill1", "skill2", "skill3"],
  "experienceSummary": "brief summary of work experience and key roles",
  "education": "highest qualification and institution",
  "yearsExperience": "estimated total years of relevant work experience as a plain number or '0'",
  "rawText": "the full plain text content of the resume for AI processing"
}`,
            },
          ],
        },
      ],
    });

    let resumeData: Record<string, unknown> = {};
    try {
      // Strip markdown code fences if Gemini wraps the JSON
      const cleaned = text.trim().replace(/^```json?\n?/i, "").replace(/```$/, "").trim();
      resumeData = JSON.parse(cleaned);
    } catch {
      // Fallback: treat the raw text as the resume content
      resumeData = { rawText: text.trim(), summary: text.substring(0, 300) };
    }

    return Response.json({ success: true, resumeData }, { status: 200 });
  } catch (error) {
    console.error("[resume/parse] Error:", error);
    return Response.json(
      { success: false, error: "Failed to parse resume" },
      { status: 500 }
    );
  }
}

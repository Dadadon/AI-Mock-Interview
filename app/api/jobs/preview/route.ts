import { generateText } from "ai";
import { google } from "@ai-sdk/google";

/**
 * POST /api/jobs/preview
 * Generates AI screening questions for review without saving anything.
 * The employer can edit the questions before submitting to /api/jobs/create.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { title, description, type, category, parish, criteria } = body;

  if (!title) {
    return Response.json({ success: false, error: "title is required" }, { status: 400 });
  }

  try {
    const { text: rawQuestions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `You are designing a short voice screening for a Jamaican hiring platform called Neat Gigz.

Generate exactly 4 focused screening questions for the following position.

Role: ${title}
Type: ${type === "gig" ? "Short-term Gig" : "Full-time Job"}
Category: ${category || "General"}
Parish: ${parish || "Jamaica"}
Description: ${description || "N/A"}
Employer Screening Criteria: ${Array.isArray(criteria) && criteria.length > 0 ? criteria.join("; ") : "General eligibility"}

REQUIREMENTS:
- Each question must be answerable by voice in under 30 seconds
- Cover: eligibility/availability, relevant experience, a key skill from the criteria, and motivation/fit
- Tone: professional yet warm — suitable for the Jamaican workforce
- Do NOT use "/", "*", "#", or any special characters (the AI reads these aloud)
- Return ONLY a valid JSON array of 4 strings, nothing else:
  ["Question 1", "Question 2", "Question 3", "Question 4"]`,
    });

    let questions: string[] = [];
    try {
      const cleaned = rawQuestions
        .trim()
        .replace(/^```json?\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();
      questions = JSON.parse(cleaned);
    } catch {
      const matches = rawQuestions.match(/"([^"]+\?)"/g);
      if (matches && matches.length >= 2) {
        questions = matches.map((m) => m.replace(/^"|"$/g, "")).slice(0, 4);
      } else {
        questions = rawQuestions
          .split("\n")
          .map((l) => l.replace(/^[\s\-\d.)"'`]+/, "").replace(/["'`]$/, "").trim())
          .filter((l) => l.length > 10 && l.includes("?"))
          .slice(0, 4);
      }
    }

    return Response.json({ success: true, questions }, { status: 200 });
  } catch (error) {
    console.error("[jobs/preview] Error:", error);
    return Response.json({ success: false, error: "Failed to generate questions" }, { status: 500 });
  }
}

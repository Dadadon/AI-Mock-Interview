import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

/* export async function POST(request: Request) {
  const { type, role, level, techstack, amount, userid } = await request.json();

  try {
    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Thank you! <3
    `,
    });

    const interview = {
      role: role,
      type: type,
      level: level,
      techstack: techstack.split(","),
      questions: JSON.parse(questions),
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviews").add(interview);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ success: false, error: error }, { status: 500 });
  }
} */
// app/api/vapi/generate/route.ts


export async function POST(request: Request) {
  const { role, level, techstack, amount, userid, resumeText, jobId } = await request.json();

  try {
    const { text: questionsResponse } = await generateText({
      model: google("gemini-2.0-flash-001"), 
      prompt: `
        You are a specialized Initial Screening Recruiter for a Jamaican business.
        
        CONTEXT:
        - Job Role: ${role}
        - Experience Level: ${level}
        - Required Tech Stack: ${techstack}
        - Candidate Resume Content: ${resumeText || "No resume provided."}

        TASK:
        Generate ${amount} unique interview questions for an initial screening.

        GUIDELINES FOR UNIQUENESS:
        1. PERSOANLIZATION: If a resume is provided, at least 2 questions MUST reference specific past roles, companies (e.g., Digicel, NCB, Sutherland), or projects mentioned in the candidate's resume.
        2. VERIFICATION: Ask questions that verify the candidate actually performed the tasks they claimed on their resume.
        3. LOCAL RELEVANCE: Ensure the tone is professional yet warm (Jamaican business standard). 
        4. VOICE COMPATIBILITY: Do not use special characters like "/", "*", or markdown bolding. Use plain text only as this will be read by a voice assistant.

        OUTPUT FORMAT:
        Return ONLY a JSON array of strings. Example: ["Question 1", "Question 2"]
      `,
    });

    // Parse the AI response to ensure it's a clean array
    const parsedQuestions = JSON.parse(questionsResponse);

    const interviewData = {
      userId: userid,
      jobId: jobId || null, // Link this interview to the job posting
      role,
      level,
      techstack: techstack.split(","),
      questions: parsedQuestions,
      coverImage: getRandomInterviewCover(),
      finalized: false,
      createdAt: new Date().toISOString(),
      isScreening: !!jobId, // Boolean to identify if this is a job application screening
    };

    const docRef = await db.collection("interviews").add(interviewData);

    return Response.json({ 
      success: true, 
      interviewId: docRef.id,
      questions: parsedQuestions 
    });

  } catch (error) {
    console.error("Error generating unique interview:", error);
    return Response.json({ success: false, error: "Failed to generate interview" }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}

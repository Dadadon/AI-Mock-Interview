interface Feedback {
  id: string;
  interviewId: string;
  totalScore: number;
  categoryScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
}

interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;
  /** Distinguishes practice sessions from live job screenings */
  scenario?: "practice" | "job_screening";
}

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
}

interface User {
  name: string;
  email: string;
  id: string;
  role?: "applicant" | "employer";
}

interface InterviewCardProps {
  interviewId?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
  isNew?: boolean;
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview" | "job_apply";
  questions?: string[];
  scenario?: "practice" | "job_screening" | "gig_inquiry";
  jobId?: string;
  employerId?: string;
  jobTitle?: string;
  /** AI-generated questions specific to the job listing */
  screeningQuestions?: string[];
}

interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

interface SignInParams {
  email: string;
  idToken: string;
}

interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  password: string;
  role?: "applicant" | "employer";
}

type FormType = "sign-in" | "sign-up";

interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  amount: number;
}

interface TechIconProps {
  techStack: string[];
}

// Neat Gigz / Career Hub types

interface Job {
  id: string;
  employerId: string;
  title: string;
  description: string;
  type: "gig" | "job";
  parish: string;
  pay: string;
  category: string;
  criteria: string[];
  /** AI-generated screening questions unique to this listing */
  screeningQuestions?: string[];
  createdAt: string;
}

interface Application {
  id: string;
  userId: string;
  jobId: string;
  employerId: string;
  applicantName: string;
  jobTitle: string;
  status: "completed" | "reviewed";
  transcript: string;
  score: number;
  summary: string;
  callId: string;
  createdAt: string;
}

interface CreateJobParams {
  employerId: string;
  title: string;
  description: string;
  type: "gig" | "job";
  parish: string;
  pay: string;
  category: string;
  criteria: string[];
}

interface JobCardProps {
  job: Job;
  currentUserId?: string;
}

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
}

interface InterviewCardProps {
  interviewId?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
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

// types/index.d.ts (ADDITIONS)

// --- User & Company ---
interface User {
  name: string;
  email: string;
  id: string;
  // NEW: Role property is crucial for RBAC
  role: "candidate" | "business" | "admin"; 
  skills?: string[]; // Automated Skill Tags
  averageRating?: number; // Gig Reputation
  companyId?: string; // Link to the company if role is 'business'
}

interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  location: string;
  contactEmail: string;
}

// --- Marketplace & Application ---
interface JobPosting {
  id: string;
  companyId: string;
  title: string;
  location: string;
  description: string;
  requirements: string[];
  techstack: string[];
  level: string;
  mockInterviewId?: string;
  createdAt: string;
}

interface GigProject {
  id: string;
  companyId: string;
  title: string;
  description: string;
  budget: number;
  duration: string; 
  skillsRequired: string[];
  location: string;
  isRemote: boolean;
  createdAt: string;
}

interface Application {
  id: string;
  jobId?: string;
  gigId?: string;
  userId: string;
  companyId: string;
  status: "pending" | "reviewed" | "hired" | "rejected";
  submittedAt: string;
  feedbackId?: string;
  proposalText?: string;
}

// --- Live Chat ---
interface ChatThread {
  id: string;
  participants: string[]; // [userId, businessId]
  jobId?: string;
  gigId?: string;
  lastMessageAt: string;
}

interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

// --- Exit Interviews & Reviews ---
interface ExitInterview {
  id: string;
  companyId: string;
  userId: string;
  jobTitle: string;
  dateConducted: string;
  transcript: { role: string; content: string }[];
  aiSummary: string; // Gemini-generated summary
}

interface Review {
  id: string;
  gigId: string; 
  reviewerId: string;
  revieweeId: string;
  rating: number; // 1 to 5 stars
  comment: string;
  createdAt: string;
}

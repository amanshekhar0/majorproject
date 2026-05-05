import axios from "axios";
import type { Question } from "../data/questions";

const API = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  highlights: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

export interface CodeRunResult {
  stdout: string;
  stderr: string;
  compile_output: string;
  exit_code: number;
}

export interface EvaluationResult {
  overallScore: number;
  grade: string;
  summary: string;
  strongPoints: Array<{ point: string; evidence: string }>;
  weakPoints: Array<{ point: string; suggestion: string }>;
  codeQuality: {
    score: number;
    correctness: number;
    efficiency: number;
    readability: number;
    feedback: string;
  };
  sectionScores: {
    mcq: number;
    coding: number;
    communication: number;
    resumeDepth: number;
    behavioral?: number;
  };
  recommendation: string;
  nextSteps: string;
}

// Resume API
export const uploadResume = async (
  file: File,
): Promise<{ projects: Project[]; resumeLength: number }> => {
  const formData = new FormData();
  formData.append("resume", file);
  const { data } = await axios.post("/api/resume/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
  return data;
};

// Interview chat API
export const sendChatMessage = async (
  message: string,
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  context?: {
    projects?: Project[];
    submittedCode?: string;
    language?: string;
    currentQuestion?: string;
    questionType?: string;
  },
): Promise<string> => {
  const { data } = await API.post("/interview/chat", {
    message,
    history,
    context,
  });
  return data.message;
};

// Generate resume questions
export const generateResumeQuestions = async (projects: Project[]) => {
  const { data } = await API.post("/interview/generate-questions", {
    projects,
  });
  return data.questions;
};

export const generateRandomQuestions = async (
  difficulty: "easy" | "medium" | "hard",
  projects: Project[] = [],
): Promise<Question[]> => {
  const { data } = await API.post("/interview/generate-random", {
    difficulty,
    projects,
  });
  return data.questions;
};

// Code execution API
export const executeCode = async (
  code: string,
  language: string,
  stdin?: string,
): Promise<CodeRunResult> => {
  const { data } = await API.post("/code/run", { code, language, stdin });
  return data;
};

// Results evaluation API
export const evaluateSession = async (sessionData: {
  chatHistory: ChatMessage[];
  codeSubmissions: Array<{ language: string; code: string; question: string }>;
  mcqScore: number;
  mcqTotal: number;
  tabSwitchCount: number;
  timeUsed: number;
  terminated: boolean;
  projects: Project[];
  faceViolationCount?: number;
  noiseAlertCount?: number;
  difficulty?: string;
  candidateEmail?: string;
  candidateName?: string;
}): Promise<EvaluationResult> => {
  const { data } = await API.post("/results/evaluate", sessionData);
  return data.evaluation;
};

export interface CompletedInterviewPayload {
  email: string;
  name?: string;
  resumeUrl?: string;
  difficulty?: string;
  terminated?: boolean;
  timeUsed?: number;
  evaluation: EvaluationResult | Record<string, unknown>;
  sessionSnapshot?: Record<string, unknown>;
  proctoring?: {
    tabSwitchCount: number;
    faceViolationCount: number;
    noiseAlertCount: number;
  };
}

export const saveCompletedInterview = async (
  payload: CompletedInterviewPayload,
): Promise<{
  success: boolean;
  sessionId?: string;
  totalInterviews?: number;
}> => {
  const { data } = await API.post("/user/interviews", payload);
  return data;
};

export interface UserPerformanceResponse {
  success: boolean;
  user: {
    name: string;
    email: string;
    totalInterviews: number;
    resumeUrl?: string;
  } | null;
  trend: Array<{ label: string; score: number; date: string }>;
  mcqTrend: Array<{ label: string; pct: number }>;
  radar: Array<{ dimension: string; value: number; fullMark: number }> | null;
  recentSessions?: Array<{
    id: string;
    completedAt: string;
    overallScore: number;
    grade?: string;
  }>;
}

export const fetchUserPerformance = async (
  email: string,
): Promise<UserPerformanceResponse> => {
  const { data } = await API.get("/user/performance", { params: { email } });
  return data;
};

export default API;

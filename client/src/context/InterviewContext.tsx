import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  Question,
  QUESTION_BANK,
  QUESTION_BANK_BY_DIFFICULTY,
} from "../data/questions";
import { Project, ChatMessage, executeCode, sendChatMessage } from "../lib/api";
import toast from "react-hot-toast";
import {
  silenceInterviewerSpeech,
  speakInterviewerText,
} from "../utils/speechOut";

const CANDIDATE_PROFILE_KEY = "interview_candidate_profile";

interface CodeSubmission {
  language: string;
  code: string;
  question: string;
  timestamp: number;
}

interface MCQAnswer {
  questionId: string;
  answer: string;
  correct: boolean;
}

export type Difficulty = "easy" | "medium" | "hard";

interface InterviewState {
  // Session
  sessionStarted: boolean;
  sessionEnded: boolean;
  terminated: boolean;
  timeUsed: number;

  // Difficulty
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;

  // Resume
  projects: Project[];
  setProjects: (p: Project[]) => void;

  // Questions
  questions: Question[];
  setQuestions: (q: Question[]) => void;
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  currentQuestion: Question | null;
  goNextQuestion: () => void;

  // Chat
  chatHistory: ChatMessage[];
  geminiHistory: Array<{ role: string; parts: Array<{ text: string }> }>;
  addUserMessage: (msg: string) => void;
  addAIMessage: (msg: string) => void;
  sendMessage: (msg: string, context?: object) => Promise<void>;
  isAITyping: boolean;

  // Code
  code: string;
  setCode: (c: string) => void;
  language: string;
  setLanguage: (l: string) => void;
  terminalOutput: string;
  isRunning: boolean;
  runCode: () => Promise<void>;
  submitCode: () => Promise<void>;
  codeSubmissions: CodeSubmission[];

  // MCQ
  mcqAnswers: MCQAnswer[];
  submitMCQ: (answer: string) => boolean;

  // Anti-cheat / proctoring (session-scoped totals for reporting)
  tabSwitchCount: number;
  incrementTabSwitch: () => void;
  faceViolationCount: number;
  noiseAlertCount: number;
  incrementFaceViolation: () => void;
  incrementNoiseAlert: () => void;
  setTerminated: (v: boolean) => void;

  candidateName: string;
  candidateEmail: string;
  setCandidateIdentity: (p: Partial<{ name: string; email: string }>) => void;

  // Session control
  startSession: (customQuestions?: Question[]) => void;
  endSession: (terminated?: boolean, timeUsedSecs?: number) => void;
  resetSession: () => void;
  getSessionData: () => object;

  // Theme
  isDark: boolean;
  toggleTheme: () => void;
}

const InterviewContext = createContext<InterviewState | null>(null);

export const useInterview = () => {
  const ctx = useContext(InterviewContext);
  if (!ctx)
    throw new Error("useInterview must be used within InterviewProvider");
  return ctx;
};

export const InterviewProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDark, setIsDark] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [terminated, setTerminated] = useState(false);
  const [timeUsed, setTimeUsed] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  const [projects, setProjects] = useState<Project[]>([]);
  const [questions, setQuestions] = useState<Question[]>(QUESTION_BANK);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Alex, your interviewer today. Let's get started — I'll walk you through the questions one by one. Good luck! 🚀",
      timestamp: Date.now(),
    },
  ]);
  const [geminiHistory, setGeminiHistory] = useState<
    Array<{ role: string; parts: Array<{ text: string }> }>
  >([]);
  const [isAITyping, setIsAITyping] = useState(false);

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [terminalOutput, setTerminalOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [codeSubmissions, setCodeSubmissions] = useState<CodeSubmission[]>([]);

  const [mcqAnswers, setMcqAnswers] = useState<MCQAnswer[]>([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [faceViolationCount, setFaceViolationCount] = useState(0);
  const [noiseAlertCount, setNoiseAlertCount] = useState(0);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");

  const currentQuestion = questions[currentIndex] || null;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CANDIDATE_PROFILE_KEY);
      if (!raw) return;
      const j = JSON.parse(raw) as { name?: string; email?: string };
      if (typeof j.name === "string") setCandidateName(j.name);
      if (typeof j.email === "string") setCandidateEmail(j.email);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        CANDIDATE_PROFILE_KEY,
        JSON.stringify({ name: candidateName, email: candidateEmail }),
      );
    } catch {
      /* ignore */
    }
  }, [candidateName, candidateEmail]);

  const setCandidateIdentity = useCallback(
    (p: Partial<{ name: string; email: string }>) => {
      setCandidateName((prev) => (p.name !== undefined ? p.name : prev));
      setCandidateEmail((prev) =>
        p.email !== undefined ? p.email.trim() : prev,
      );
    },
    [],
  );

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }, []);

  const addUserMessage = useCallback((msg: string) => {
    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: msg, timestamp: Date.now() },
    ]);
    setGeminiHistory((prev) => [
      ...prev,
      { role: "user", parts: [{ text: msg }] },
    ]);
  }, []);

  const addAIMessage = useCallback((msg: string) => {
    setChatHistory((prev) => [
      ...prev,
      { role: "assistant", content: msg, timestamp: Date.now() },
    ]);
    setGeminiHistory((prev) => [
      ...prev,
      { role: "model", parts: [{ text: msg }] },
    ]);
  }, []);

  const sendMessage = useCallback(
    async (msg: string, ctx?: object) => {
      addUserMessage(msg);
      setIsAITyping(true);
      try {
        const response = await sendChatMessage(msg, geminiHistory, {
          projects,
          ...(ctx || {}),
        });
        addAIMessage(response);
        speakInterviewerText(response, 460);
      } catch {
        const fallback =
          "I'm having a bit of connectivity trouble. Please continue — I'm still evaluating your answer.";
        addAIMessage(fallback);
        speakInterviewerText(fallback);
      } finally {
        setIsAITyping(false);
      }
    },
    [addUserMessage, addAIMessage, geminiHistory, projects],
  );

  const goNextQuestion = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
    setCode("");
    setTerminalOutput("");
  }, [questions.length]);

  const runCodeFn = useCallback(async () => {
    if (!code.trim()) {
      toast.error("No code to run");
      return;
    }
    setIsRunning(true);
    setTerminalOutput("⏳ Running...");
    try {
      const result = await executeCode(code, language);
      let output = "";
      if (result.compile_output)
        output += `[Compiler]\n${result.compile_output}\n`;
      if (result.stdout) output += result.stdout;
      if (result.stderr) output += `\n[Error]\n${result.stderr}`;
      if (!output.trim()) output = "[No output]";
      setTerminalOutput(output);
    } catch (err: unknown) {
      setTerminalOutput(
        `[Network Error] Could not connect to execution service.\n${err instanceof Error ? err.message : ""}`,
      );
    } finally {
      setIsRunning(false);
    }
  }, [code, language]);

  const submitCode = useCallback(async () => {
    if (!code.trim()) {
      toast.error("Write some code before submitting");
      return;
    }
    const submission = {
      language,
      code,
      question: currentQuestion?.question || "",
      timestamp: Date.now(),
    };
    setCodeSubmissions((prev) => [...prev, submission]);
    toast.success("Code submitted! Asking for AI review...");

    await sendMessage(
      `I've submitted my solution. Here it is for review:\n\`\`\`${language}\n${code}\n\`\`\`\nWhat do you think? Any feedback on correctness, time complexity, or optimizations?`,
      { submittedCode: code, language },
    );
    goNextQuestion();
  }, [code, language, currentQuestion, sendMessage, goNextQuestion]);

  const submitMCQ = useCallback(
    (answer: string): boolean => {
      if (!currentQuestion) return false;
      const correct = answer === currentQuestion.correctAnswer;
      setMcqAnswers((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          answer,
          correct,
        },
      ]);
      return correct;
    },
    [currentQuestion],
  );

  const incrementTabSwitch = useCallback(() => {
    setTabSwitchCount((prev) => prev + 1);
  }, []);

  const incrementFaceViolation = useCallback(() => {
    setFaceViolationCount((prev) => prev + 1);
  }, []);

  const incrementNoiseAlert = useCallback(() => {
    setNoiseAlertCount((prev) => prev + 1);
  }, []);

  const startSession = useCallback(
    (customQuestions?: Question[]) => {
      const pool =
        customQuestions && customQuestions.length > 0
          ? customQuestions
          : QUESTION_BANK_BY_DIFFICULTY[difficulty];
      setQuestions(pool);
      setSessionStarted(true);
      setCurrentIndex(0);
      setTabSwitchCount(0);
      setFaceViolationCount(0);
      setNoiseAlertCount(0);
      document.documentElement.classList.add("dark");
    },
    [difficulty],
  );

  const endSession = useCallback((term = false, timeSecs = 0) => {
    setSessionEnded(true);
    setTerminated(term);
    setTimeUsed(timeSecs);
    silenceInterviewerSpeech();
  }, []);

  const resetSession = useCallback(() => {
    setSessionStarted(false);
    setSessionEnded(false);
    setTerminated(false);
    setTimeUsed(0);
    setCurrentIndex(0);
    setDifficulty("medium");
    setQuestions(QUESTION_BANK);
    setCode("");
    setLanguage("python");
    setTerminalOutput("");
    setIsRunning(false);
    setCodeSubmissions([]);
    setMcqAnswers([]);
    setTabSwitchCount(0);
    setFaceViolationCount(0);
    setNoiseAlertCount(0);
    setIsAITyping(false);
    setGeminiHistory([]);
    setChatHistory([
      {
        role: "assistant",
        content:
          "Hi! I'm Alex, your interviewer today. Let's get started — I'll walk you through the questions one by one. Good luck! 🚀",
        timestamp: Date.now(),
      },
    ]);
    silenceInterviewerSpeech();
  }, []);

  const getSessionData = useCallback(
    () => ({
      chatHistory,
      codeSubmissions,
      mcqScore: mcqAnswers.filter((a) => a.correct).length,
      mcqTotal: mcqAnswers.length,
      tabSwitchCount,
      timeUsed,
      terminated,
      projects,
      difficulty,
      faceViolationCount,
      noiseAlertCount,
      candidateName,
      candidateEmail,
    }),
    [
      chatHistory,
      codeSubmissions,
      mcqAnswers,
      tabSwitchCount,
      timeUsed,
      terminated,
      projects,
      difficulty,
      faceViolationCount,
      noiseAlertCount,
      candidateName,
      candidateEmail,
    ],
  );

  const value: InterviewState = {
    isDark,
    toggleTheme,
    sessionStarted,
    sessionEnded,
    terminated,
    timeUsed,
    difficulty,
    setDifficulty,
    projects,
    setProjects,
    questions,
    setQuestions,
    currentIndex,
    setCurrentIndex,
    currentQuestion,
    goNextQuestion,
    chatHistory,
    geminiHistory,
    addUserMessage,
    addAIMessage,
    sendMessage,
    isAITyping,
    code,
    setCode,
    language,
    setLanguage,
    terminalOutput,
    isRunning,
    runCode: runCodeFn,
    submitCode,
    codeSubmissions,
    mcqAnswers,
    submitMCQ,
    tabSwitchCount,
    incrementTabSwitch,
    faceViolationCount,
    noiseAlertCount,
    incrementFaceViolation,
    incrementNoiseAlert,
    setTerminated,
    candidateName,
    candidateEmail,
    setCandidateIdentity,
    startSession,
    endSession,
    resetSession,
    getSessionData,
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
};

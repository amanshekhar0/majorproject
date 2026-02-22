import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Question, QUESTION_BANK } from '../data/questions';
import { Project, ChatMessage, executeCode, sendChatMessage } from '../lib/api';
import toast from 'react-hot-toast';

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

interface InterviewState {
    // Session
    sessionStarted: boolean;
    sessionEnded: boolean;
    terminated: boolean;
    timeUsed: number;

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

    // Anti-cheat
    tabSwitchCount: number;
    incrementTabSwitch: () => void;
    setTerminated: (v: boolean) => void;

    // Session control
    startSession: () => void;
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
    if (!ctx) throw new Error('useInterview must be used within InterviewProvider');
    return ctx;
};

export const InterviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDark, setIsDark] = useState(true);
    const [sessionStarted, setSessionStarted] = useState(false);
    const [sessionEnded, setSessionEnded] = useState(false);
    const [terminated, setTerminated] = useState(false);
    const [timeUsed, setTimeUsed] = useState(0);

    const [projects, setProjects] = useState<Project[]>([]);
    const [questions, setQuestions] = useState<Question[]>(QUESTION_BANK);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: "Hi! I'm Alex, your interviewer today. Let's get started — I'll walk you through the questions one by one. Good luck! 🚀",
            timestamp: Date.now(),
        },
    ]);
    const [geminiHistory, setGeminiHistory] = useState<Array<{ role: string; parts: Array<{ text: string }> }>>([]);
    const [isAITyping, setIsAITyping] = useState(false);

    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');
    const [terminalOutput, setTerminalOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [codeSubmissions, setCodeSubmissions] = useState<CodeSubmission[]>([]);

    const [mcqAnswers, setMcqAnswers] = useState<MCQAnswer[]>([]);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);

    const currentQuestion = questions[currentIndex] || null;

    const toggleTheme = useCallback(() => {
        setIsDark(prev => {
            const next = !prev;
            document.documentElement.classList.toggle('dark', next);
            return next;
        });
    }, []);

    const addUserMessage = useCallback((msg: string) => {
        setChatHistory(prev => [...prev, { role: 'user', content: msg, timestamp: Date.now() }]);
        setGeminiHistory(prev => [...prev, { role: 'user', parts: [{ text: msg }] }]);
    }, []);

    const addAIMessage = useCallback((msg: string) => {
        setChatHistory(prev => [...prev, { role: 'assistant', content: msg, timestamp: Date.now() }]);
        setGeminiHistory(prev => [...prev, { role: 'model', parts: [{ text: msg }] }]);
    }, []);

    const sendMessage = useCallback(async (msg: string, ctx?: object) => {
        addUserMessage(msg);
        setIsAITyping(true);
        try {
            const response = await sendChatMessage(msg, geminiHistory, {
                projects,
                ...(ctx || {}),
            });
            addAIMessage(response);
            // Speak the AI response
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(response);
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.volume = 0.9;
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(utterance);
            }
        } catch {
            const fallback = "I'm having a bit of connectivity trouble. Please continue — I'm still evaluating your answer.";
            addAIMessage(fallback);
        } finally {
            setIsAITyping(false);
        }
    }, [addUserMessage, addAIMessage, geminiHistory, projects]);

    const goNextQuestion = useCallback(() => {
        setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1));
        setCode('');
        setTerminalOutput('');
    }, [questions.length]);

    const runCodeFn = useCallback(async () => {
        if (!code.trim()) {
            toast.error('No code to run');
            return;
        }
        setIsRunning(true);
        setTerminalOutput('⏳ Running...');
        try {
            const result = await executeCode(code, language);
            let output = '';
            if (result.compile_output) output += `[Compiler]\n${result.compile_output}\n`;
            if (result.stdout) output += result.stdout;
            if (result.stderr) output += `\n[Error]\n${result.stderr}`;
            if (!output.trim()) output = '[No output]';
            setTerminalOutput(output);
        } catch (err: unknown) {
            setTerminalOutput(`[Network Error] Could not connect to execution service.\n${err instanceof Error ? err.message : ''}`);
        } finally {
            setIsRunning(false);
        }
    }, [code, language]);

    const submitCode = useCallback(async () => {
        if (!code.trim()) {
            toast.error('Write some code before submitting');
            return;
        }
        const submission = {
            language,
            code,
            question: currentQuestion?.question || '',
            timestamp: Date.now(),
        };
        setCodeSubmissions(prev => [...prev, submission]);
        toast.success('Code submitted! Asking for AI review...');

        await sendMessage(
            `I've submitted my solution. Here it is for review:\n\`\`\`${language}\n${code}\n\`\`\`\nWhat do you think? Any feedback on correctness, time complexity, or optimizations?`,
            { submittedCode: code, language }
        );
        goNextQuestion();
    }, [code, language, currentQuestion, sendMessage, goNextQuestion]);

    const submitMCQ = useCallback((answer: string): boolean => {
        if (!currentQuestion) return false;
        const correct = answer === currentQuestion.correctAnswer;
        setMcqAnswers(prev => [...prev, {
            questionId: currentQuestion.id,
            answer,
            correct,
        }]);
        return correct;
    }, [currentQuestion]);

    const incrementTabSwitch = useCallback(() => {
        setTabSwitchCount(prev => prev + 1);
    }, []);

    const startSession = useCallback(() => {
        setSessionStarted(true);
        setCurrentIndex(0);
        document.documentElement.classList.add('dark');
    }, []);

    const endSession = useCallback((term = false, timeSecs = 0) => {
        setSessionEnded(true);
        setTerminated(term);
        setTimeUsed(timeSecs);
        window.speechSynthesis?.cancel();
    }, []);

    const resetSession = useCallback(() => {
        setSessionStarted(false);
        setSessionEnded(false);
        setTerminated(false);
        setTimeUsed(0);
        setCurrentIndex(0);
        setQuestions(QUESTION_BANK);
        setCode('');
        setLanguage('python');
        setTerminalOutput('');
        setIsRunning(false);
        setCodeSubmissions([]);
        setMcqAnswers([]);
        setTabSwitchCount(0);
        setIsAITyping(false);
        setGeminiHistory([]);
        setChatHistory([{
            role: 'assistant',
            content: "Hi! I'm Alex, your interviewer today. Let's get started — I'll walk you through the questions one by one. Good luck! 🚀",
            timestamp: Date.now(),
        }]);
        window.speechSynthesis?.cancel();
    }, []);

    const getSessionData = useCallback(() => ({
        chatHistory,
        codeSubmissions,
        mcqScore: mcqAnswers.filter(a => a.correct).length,
        mcqTotal: mcqAnswers.length,
        tabSwitchCount,
        timeUsed,
        terminated,
        projects,
    }), [chatHistory, codeSubmissions, mcqAnswers, tabSwitchCount, timeUsed, terminated, projects]);

    const value: InterviewState = {
        isDark, toggleTheme,
        sessionStarted, sessionEnded, terminated, timeUsed,
        projects, setProjects,
        questions, setQuestions,
        currentIndex, setCurrentIndex, currentQuestion, goNextQuestion,
        chatHistory, geminiHistory, addUserMessage, addAIMessage, sendMessage, isAITyping,
        code, setCode, language, setLanguage,
        terminalOutput, isRunning, runCode: runCodeFn, submitCode,
        codeSubmissions,
        mcqAnswers, submitMCQ,
        tabSwitchCount, incrementTabSwitch, setTerminated,
        startSession, endSession, resetSession, getSessionData,
    };

    return (
        <InterviewContext.Provider value={value}>
            {children}
        </InterviewContext.Provider>
    );
};

import axios from 'axios';

const API = axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});

export interface Project {
    name: string;
    description: string;
    technologies: string[];
    highlights: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
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
    };
    recommendation: string;
    nextSteps: string;
}

// Resume API
export const uploadResume = async (file: File): Promise<{ projects: Project[]; resumeLength: number }> => {
    const formData = new FormData();
    formData.append('resume', file);
    const { data } = await axios.post('/api/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
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
    }
): Promise<string> => {
    const { data } = await API.post('/interview/chat', { message, history, context });
    return data.message;
};

// Generate resume questions
export const generateResumeQuestions = async (projects: Project[]) => {
    const { data } = await API.post('/interview/generate-questions', { projects });
    return data.questions;
};

// Code execution API
export const executeCode = async (
    code: string,
    language: string,
    stdin?: string
): Promise<CodeRunResult> => {
    const { data } = await API.post('/code/run', { code, language, stdin });
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
}): Promise<EvaluationResult> => {
    const { data } = await API.post('/results/evaluate', sessionData);
    return data.evaluation;
};

export default API;

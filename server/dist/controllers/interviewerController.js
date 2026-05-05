"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomQuestions = exports.generateQuestions = exports.chat = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const openai_1 = __importDefault(require("openai"));
const getClient = () => {
    const key = process.env.GROQ_API_KEY || process.env.XAI_API_KEY;
    if (!key)
        throw new Error("GROQ_API_KEY is not set in .env");
    return new openai_1.default({ apiKey: key, baseURL: "https://api.groq.com/openai/v1" });
};
const SYSTEM_PROMPT = `You are Alex, a senior technical interviewer + hiring manager teammate at a top-tier tech company. You are conducting a live, blended technical and behavioral mock interview.

CORE RULES — follow these without exception:
1. ALWAYS focus EXCLUSIVELY on the current question provided in [CURRENT QUESTION] below.
   - Do NOT introduce unrelated topics, concepts, or questions.
   - Do NOT ask generic questions like "tell me about yourself" unless the CURRENT QUESTION truly calls for it.
2. Your ONLY job is to assess the candidate's answer to the CURRENT QUESTION:
   - Ask clarifying follow-ups STRICTLY about that question/topic.
   - When the CURRENT QUESTION is technical (DSA, debugging, conceptual MCQ explanations, etc.), stay crisp and probing—edge cases, trade-offs, complexity, alternatives.
   - When the CURRENT QUESTION type is behavioral, guide with kindness and STAR structure—ask briefly for Situation, Task, Action, Result ONLY if gaps remain.
   - If they answer incorrectly on technical items, give a short hint and redirect back to the same question.
3. Rhythm: imagine you alternate between respectful behavioral coaching and disciplined technical dives—whatever the active question dictates.
4. When the question involves a project from the candidate's resume, ask specifically about that project's implementation details, trade-offs, and challenges — not generic questions.
5. When reviewing submitted code, give targeted feedback on that code only.
6. Keep ALL responses concise: 2-4 sentences max unless reviewing code.
7. Be professional, encouraging, empathetic (especially for behavioral prompts), yet direct when drilling technical depth.
8. If the candidate says "I don't know", "no", gives a one-word non-answer, or clearly irrelevant text:
   - Briefly explain the correct answer / ideal STAR angle in 2-3 sentences.
   - End with exactly: "Let's move on to the next question." and stop there.

Never reveal you are an AI. Stay in character as Alex throughout.`;
const chat = async (req, res) => {
    try {
        const { message, history, context } = req.body;
        if (!message) {
            res.status(400).json({ error: "Message is required" });
            return;
        }
        // Build context prefix — currentQuestion is the most important directive
        let contextPrefix = "";
        // ── MANDATORY: inject the current question as a strict directive ──────
        if (context?.currentQuestion) {
            const qType = context.questionType || "technical";
            contextPrefix += `[CURRENT QUESTION — you MUST focus ONLY on this]
Type: ${qType}
Question: ${context.currentQuestion}

Your job: assess the candidate's response to the above question. Ask follow-ups strictly about this topic. Do NOT change the subject.\n\n`;
        }
        if (context?.submittedCode) {
            contextPrefix += `[Candidate submitted ${context.language || "code"} for review]\n\`\`\`${context.language || ""}\n${context.submittedCode}\n\`\`\`\n\n`;
        }
        if (context?.projects?.length) {
            contextPrefix += `[Candidate resume projects for reference: ${context.projects.map((p) => p.name).join(", ")}]\n`;
        }
        // Convert history to OpenAI format
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...(history || []).map((h) => ({
                role: (h.role === "assistant" || h.role === "model"
                    ? "assistant"
                    : "user"),
                content: h.parts.map((p) => p.text).join(""),
            })),
            { role: "user", content: contextPrefix + message },
        ];
        const result = await getClient().chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages,
            max_tokens: 512,
            temperature: 0.7,
        });
        const responseText = result.choices[0]?.message?.content || "No response generated.";
        res.json({ success: true, message: responseText });
    }
    catch (err) {
        console.error("Interviewer chat error:", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: `AI interviewer error: ${message}` });
    }
};
exports.chat = chat;
const generateQuestions = async (req, res) => {
    try {
        const { projects } = req.body;
        const projectContext = projects?.length
            ? projects
                .map((p) => `${p.name}: ${p.description} (${p.technologies.join(", ")})`)
                .join("; ")
            : "No specific projects provided.";
        const prompt = `Generate 2 deep-dive technical interview questions about the candidate's projects.
Projects: ${projectContext}

Respond ONLY with valid JSON:
{
  "questions": [
    { "id": "resume_1", "type": "resume_deep", "question": "...", "project": "...", "followUp": "..." },
    { "id": "resume_2", "type": "resume_deep", "question": "...", "project": "...", "followUp": "..." }
  ]
}`;
        const result = await getClient().chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });
        const text = result.choices[0]?.message?.content || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            res.status(500).json({ error: "Failed to generate questions" });
            return;
        }
        const parsed = JSON.parse(jsonMatch[0]);
        res.json({ success: true, questions: parsed.questions });
    }
    catch (err) {
        console.error("Generate questions error:", err);
        res.status(500).json({ error: "Failed to generate resume questions" });
    }
};
exports.generateQuestions = generateQuestions;
const generateRandomQuestions = async (req, res) => {
    try {
        const { difficulty = "medium", projects = [] } = req.body;
        const projectContext = projects.length
            ? projects
                .map((p) => `${p.name}: ${p.description} (${(p.technologies || []).join(", ")})`)
                .join("; ")
            : "No resume projects provided.";
        const prompt = `Generate a realistic mock interview question set as valid JSON only.
Difficulty: ${difficulty}
Candidate projects: ${projectContext}

Rules:
- Return EXACTLY 10 questions.
- Include a balanced mix: 3 mcq, 2 output_guess/debugging, 2 dsa, 1 behavioral, 2 resume_deep (if no projects, make project-like technical deep dive prompts).
- Keep the questions practical and interview-grade.
- For mcq include options[4], correctAnswer, explanation.
- For output_guess/debugging include code, language (python|javascript|java|cpp), correctAnswer, explanation.
- For dsa include starterCode for python/java/cpp and explanation.
- Every item must include: id, type, difficulty, question, timeLimit.
- ids should be unique strings.

Return JSON:
{
  "questions": [
    {
      "id": "ai_1",
      "type": "mcq|output_guess|debugging|dsa|behavioral|resume_deep",
      "difficulty": "${difficulty}",
      "question": "...",
      "options": ["..."],
      "correctAnswer": "...",
      "explanation": "...",
      "code": "...",
      "language": "python",
      "starterCode": { "python": "...", "java": "...", "cpp": "..." },
      "followUp": "...",
      "timeLimit": 180
    }
  ]
}`;
        const result = await getClient().chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.8,
            max_tokens: 3000,
        });
        const text = result.choices[0]?.message?.content || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            res.status(500).json({ error: "Failed to generate AI question set" });
            return;
        }
        const parsed = JSON.parse(jsonMatch[0]);
        const questions = (parsed.questions || []).map((q, idx) => ({
            ...q,
            id: typeof q.id === "string" ? q.id : `ai_${difficulty}_${idx + 1}`,
            difficulty,
            timeLimit: typeof q.timeLimit === "number" && q.timeLimit > 0
                ? q.timeLimit
                : q.type === "dsa"
                    ? 1200
                    : q.type === "behavioral"
                        ? 300
                        : 180,
        }));
        if (!questions.length) {
            res.status(500).json({ error: "AI returned empty question set" });
            return;
        }
        res.json({ success: true, questions });
    }
    catch (err) {
        console.error("Generate random questions error:", err);
        res.status(500).json({ error: "Failed to generate random questions" });
    }
};
exports.generateRandomQuestions = generateRandomQuestions;

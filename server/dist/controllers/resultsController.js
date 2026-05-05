"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateSession = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const openai_1 = __importDefault(require("openai"));
const getGrok = () => {
    const key = process.env.GROQ_API_KEY || process.env.XAI_API_KEY;
    if (!key)
        throw new Error("GROQ_API_KEY is not set in .env");
    return new openai_1.default({ apiKey: key, baseURL: "https://api.groq.com/openai/v1" });
};
const evaluateSession = async (req, res) => {
    try {
        const sessionData = req.body;
        const prompt = `You are a senior technical hiring manager at a top tech company. Evaluate this interview session and provide a structured assessment.

SESSION DATA:
- MCQ Score: ${sessionData.mcqScore}/${sessionData.mcqTotal}
- Time Used: ${Math.floor(sessionData.timeUsed / 60)} minutes
- Tab Switches: ${sessionData.tabSwitchCount}
- Session Terminated Early: ${sessionData.terminated}
- Difficulty: ${sessionData.difficulty || "unknown"}
- Face presence check-ins logged: ${sessionData.faceViolationCount ?? 0}
- Sustained loud background noise events: ${sessionData.noiseAlertCount ?? 0}
- Projects: ${sessionData.projects?.map((p) => p.name).join(", ") || "None"}

CODE SUBMISSIONS:
${sessionData.codeSubmissions
            ?.map((s, i) => `
Submission ${i + 1} (${s.language}):
Question: ${s.question}
Code:
\`\`\`${s.language}
${s.code}
\`\`\`
`)
            .join("\n") || "No code submitted"}

CHAT HISTORY SUMMARY:
${sessionData.chatHistory
            ?.slice(-10)
            .map((h) => `${h.role}: ${h.content}`)
            .join("\n") || "No chat history"}

Provide a comprehensive evaluation. Respond ONLY with valid JSON:
{
  "overallScore": <number 0-100>,
  "grade": "<A+|A|B+|B|C+|C|D|F>",
  "summary": "<2-3 sentence overall assessment>",
  "strongPoints": [
    {"point": "<strength>", "evidence": "<specific evidence from session>"},
    {"point": "<strength>", "evidence": "<specific evidence>"},
    {"point": "<strength>", "evidence": "<specific evidence>"}
  ],
  "weakPoints": [
    {"point": "<weakness>", "suggestion": "<how to improve>"},
    {"point": "<weakness>", "suggestion": "<how to improve>"},
    {"point": "<weakness>", "suggestion": "<how to improve>"}
  ],
  "codeQuality": {
    "score": <0-100>,
    "correctness": <0-100>,
    "efficiency": <0-100>,
    "readability": <0-100>,
    "feedback": "<specific code feedback>"
  },
  "sectionScores": {
    "mcq": <0-100>,
    "coding": <0-100>,
    "communication": <0-100>,
    "resumeDepth": <0-100>,
    "behavioral": <0-100>
  },
  "recommendation": "<Strong Hire|Hire|Maybe|No Hire>",
  "nextSteps": "<What the candidate should study or practice>"
}`;
        const client = getGrok();
        const result = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
        });
        const text = result.choices[0]?.message?.content || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            res.status(500).json({ error: "Failed to generate evaluation report" });
            return;
        }
        const evaluation = JSON.parse(jsonMatch[0]);
        res.json({ success: true, evaluation });
    }
    catch (err) {
        console.error("Results evaluation error:", err);
        res.status(500).json({ error: "Failed to evaluate session" });
    }
};
exports.evaluateSession = evaluateSession;

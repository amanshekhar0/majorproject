import dotenv from 'dotenv';
dotenv.config();

import { Request, Response } from 'express';
import OpenAI from 'openai';

const getGrok = () => {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error('XAI_API_KEY is not set in .env');
  return new OpenAI({ apiKey: key, baseURL: 'https://api.groq.com/openai/v1' });
};

interface CodeSubmission {
  language: string;
  code: string;
  question: string;
}

interface SessionData {
  chatHistory: Array<{ role: string; content: string }>;
  codeSubmissions: CodeSubmission[];
  mcqScore: number;
  mcqTotal: number;
  tabSwitchCount: number;
  timeUsed: number;
  terminated: boolean;
  projects: Array<{ name: string; description: string }>;
}

export const evaluateSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionData = req.body as SessionData;

    const prompt = `You are a senior technical hiring manager at a top tech company. Evaluate this interview session and provide a structured assessment.

SESSION DATA:
- MCQ Score: ${sessionData.mcqScore}/${sessionData.mcqTotal}
- Time Used: ${Math.floor(sessionData.timeUsed / 60)} minutes
- Tab Switches: ${sessionData.tabSwitchCount}
- Session Terminated Early: ${sessionData.terminated}
- Projects: ${sessionData.projects?.map(p => p.name).join(', ') || 'None'}

CODE SUBMISSIONS:
${sessionData.codeSubmissions?.map((s, i) => `
Submission ${i + 1} (${s.language}):
Question: ${s.question}
Code:
\`\`\`${s.language}
${s.code}
\`\`\`
`).join('\n') || 'No code submitted'}

CHAT HISTORY SUMMARY:
${sessionData.chatHistory?.slice(-10).map(h => `${h.role}: ${h.content}`).join('\n') || 'No chat history'}

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
    "resumeDepth": <0-100>
  },
  "recommendation": "<Strong Hire|Hire|Maybe|No Hire>",
  "nextSteps": "<What the candidate should study or practice>"
}`;

    const client = getGrok();
    const result = await client.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const text = result.choices[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: 'Failed to generate evaluation report' });
      return;
    }

    const evaluation = JSON.parse(jsonMatch[0]);
    res.json({ success: true, evaluation });
  } catch (err: unknown) {
    console.error('Results evaluation error:', err);
    res.status(500).json({ error: 'Failed to evaluate session' });
  }
};

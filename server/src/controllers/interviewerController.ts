import dotenv from 'dotenv';
dotenv.config();

import { Request, Response } from 'express';
import OpenAI from 'openai';

const getClient = () => {
    const key = process.env.XAI_API_KEY;
    if (!key) throw new Error('XAI_API_KEY is not set in .env');
    return new OpenAI({ apiKey: key, baseURL: 'https://api.groq.com/openai/v1' });
};

const SYSTEM_PROMPT = `You are Alex, a senior technical interviewer at a top-tier tech company. You are conducting a live, structured technical interview.

CORE RULES — follow these without exception:
1. ALWAYS focus EXCLUSIVELY on the current question provided in [CURRENT QUESTION] below.
   - Do NOT introduce unrelated topics, concepts, or questions.
   - Do NOT ask generic questions like "tell me about yourself" or random DSA unless the current question is about DSA.
2. Your ONLY job is to assess the candidate's answer to the CURRENT QUESTION:
   - Ask clarifying follow-ups STRICTLY about that question/topic.
   - If they answer correctly, probe deeper on that same topic (edge cases, complexity, alternatives).
   - If they answer incorrectly, give a short hint and redirect back to the same question.
3. When the question involves a project from the candidate's resume, ask specifically about that project's implementation details, trade-offs, and challenges — not generic questions.
4. When reviewing submitted code, give targeted feedback on that code only.
5. Keep ALL responses concise: 2-4 sentences max unless reviewing code.
6. Be professional, encouraging, and direct.
7. If the candidate says "I don't know", "no", gives a one-word non-answer, or clearly irrelevant text:
   - Briefly explain the correct answer in 2-3 sentences.
   - End with exactly: "Let's move on to the next question." and stop there.

Never reveal you are an AI. Stay in character as Alex throughout.`;

export const chat = async (req: Request, res: Response): Promise<void> => {
    try {
        const { message, history, context } = req.body as {
            message: string;
            history: Array<{ role: string; parts: Array<{ text: string }> }>;
            context?: {
                projects?: Array<{ name: string; description: string; technologies: string[]; highlights: string }>;
                submittedCode?: string;
                language?: string;
                currentQuestion?: string;
                questionType?: string;
            };
        };

        if (!message) {
            res.status(400).json({ error: 'Message is required' });
            return;
        }

        // Build context prefix — currentQuestion is the most important directive
        let contextPrefix = '';

        // ── MANDATORY: inject the current question as a strict directive ──────
        if (context?.currentQuestion) {
            const qType = context.questionType || 'technical';
            contextPrefix += `[CURRENT QUESTION — you MUST focus ONLY on this]
Type: ${qType}
Question: ${context.currentQuestion}

Your job: assess the candidate's response to the above question. Ask follow-ups strictly about this topic. Do NOT change the subject.\n\n`;
        }

        if (context?.submittedCode) {
            contextPrefix += `[Candidate submitted ${context.language || 'code'} for review]\n\`\`\`${context.language || ''}\n${context.submittedCode}\n\`\`\`\n\n`;
        }
        if (context?.projects?.length) {
            contextPrefix += `[Candidate resume projects for reference: ${context.projects.map(p => p.name).join(', ')}]\n`;
        }

        // Convert history to OpenAI format
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...(history || []).map(h => ({
                role: (h.role === 'assistant' || h.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
                content: h.parts.map(p => p.text).join(''),
            })),
            { role: 'user', content: contextPrefix + message },
        ];

        const result = await getClient().chat.completions.create({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages,
            max_tokens: 512,
            temperature: 0.7,
        });

        const responseText = result.choices[0]?.message?.content || 'No response generated.';
        res.json({ success: true, message: responseText });
    } catch (err: unknown) {
        console.error('Interviewer chat error:', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ error: `AI interviewer error: ${message}` });
    }
};

export const generateQuestions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projects } = req.body as {
            projects: Array<{ name: string; description: string; technologies: string[]; highlights: string }>;
        };

        const projectContext = projects?.length
            ? projects.map(p => `${p.name}: ${p.description} (${p.technologies.join(', ')})`).join('; ')
            : 'No specific projects provided.';

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
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
        });

        const text = result.choices[0]?.message?.content || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            res.status(500).json({ error: 'Failed to generate questions' });
            return;
        }

        const parsed = JSON.parse(jsonMatch[0]);
        res.json({ success: true, questions: parsed.questions });
    } catch (err: unknown) {
        console.error('Generate questions error:', err);
        res.status(500).json({ error: 'Failed to generate resume questions' });
    }
};

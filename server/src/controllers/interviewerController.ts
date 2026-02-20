import dotenv from 'dotenv';
dotenv.config();

import { Request, Response } from 'express';
import OpenAI from 'openai';

const getClient = () => {
    const key = process.env.XAI_API_KEY;
    if (!key) throw new Error('XAI_API_KEY is not set in .env');
    return new OpenAI({ apiKey: key, baseURL: 'https://api.groq.com/openai/v1' });
};

const SYSTEM_PROMPT = `You are Alex, a senior technical interviewer at a top-tier tech company (like Google or Meta). You are conducting a live technical interview.

Your personality:
- Professional but friendly and encouraging
- Direct and concise in questions
- Give constructive feedback when asked
- Ask follow-up questions to dig deeper
- Acknowledge good answers positively

Your role:
1. Act as a knowledgeable technical interviewer
2. Review submitted code and give brief, targeted feedback
3. Ask about time/space complexity and optimizations
4. Relate questions to the candidate's resume projects when appropriate
5. Keep responses concise (2-4 sentences max unless reviewing code)

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
            };
        };

        if (!message) {
            res.status(400).json({ error: 'Message is required' });
            return;
        }

        // Build context prefix
        let contextPrefix = '';
        if (context?.submittedCode) {
            contextPrefix = `[Candidate submitted ${context.language || 'code'} for review]\n\`\`\`${context.language || ''}\n${context.submittedCode}\n\`\`\`\n\n`;
        }
        if (context?.projects?.length) {
            contextPrefix += `[Candidate projects: ${context.projects.map(p => p.name).join(', ')}]\n`;
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

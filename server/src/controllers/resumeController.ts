import dotenv from 'dotenv';
dotenv.config();

import { Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

const getGrok = () => {
    const key = process.env.GROQ_API_KEY || process.env.XAI_API_KEY;
    if (!key) throw new Error('GROQ_API_KEY is not set in .env');
    return new OpenAI({ apiKey: key, baseURL: 'https://api.groq.com/openai/v1' });
};

const storage = multer.memoryStorage();
export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
});

export const parseResume = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No PDF file uploaded' });
            return;
        }

        let pdfText = '';
        try {
            const pdfData = await pdfParse(req.file.buffer);
            pdfText = pdfData.text;
        } catch {
            res.status(400).json({ error: 'Failed to parse PDF. Please ensure it is a valid PDF file.' });
            return;
        }

        if (!pdfText || pdfText.trim().length < 50) {
            res.status(400).json({ error: 'PDF appears to be empty or unreadable.' });
            return;
        }

        const prompt = `You are a technical recruiter analyzing a resume. Extract the top 2 most significant technical projects from this resume.

For each project, provide:
1. Name: Project name
2. Description: Brief 1-2 sentence description
3. Technologies: Comma-separated list of technologies used
4. Highlights: 1-2 key technical achievements or challenges solved

Respond ONLY with valid JSON in this exact format:
{
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "technologies": ["tech1", "tech2"],
      "highlights": "Key achievement or challenge"
    },
    {
      "name": "Project Name 2",
      "description": "Brief description",
      "technologies": ["tech1", "tech2"],
      "highlights": "Key achievement or challenge"
    }
  ]
}

Resume text:
${pdfText.substring(0, 8000)}`;

        const client = getGrok();
        const result = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
        });

        const text = result.choices[0]?.message?.content || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            res.status(500).json({ error: 'Failed to extract project data from resume' });
            return;
        }

        const parsed = JSON.parse(jsonMatch[0]);
        // Normalize: AI sometimes returns technologies as a comma-separated string
        const projects = (parsed.projects || []).map((p: Record<string, unknown>) => ({
            ...p,
            technologies: Array.isArray(p.technologies)
                ? p.technologies
                : typeof p.technologies === 'string'
                    ? (p.technologies as string).split(',').map((s: string) => s.trim()).filter(Boolean)
                    : [],
        }));
        res.json({
            success: true,
            projects,
            resumeLength: pdfText.length,
        });
    } catch (err: unknown) {
        console.error('Resume parse error:', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ error: `Failed to process resume: ${message}` });
    }
};

import { Request, Response } from 'express';
import multer from 'multer';
import PDFParser from 'pdf2json';
import { createChatCompletion } from '../aiClient';

/**
 * Extract plain text from a PDF buffer using pdf2json (pure-JS, server-safe).
 * Replaces pdf-parse, whose bundled 2017-era pdf.js crashes under modern
 * Node/TS dev runtimes.
 */
function extractPdfText(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const parser = new PDFParser(null, true);
        parser.on('pdfParser_dataError', (errData: Error | { parserError: Error }) => {
            const err = errData instanceof Error ? errData : errData?.parserError;
            reject(err || new Error('PDF parsing failed'));
        });
        parser.on('pdfParser_dataReady', () => {
            try {
                resolve(parser.getRawTextContent());
            } catch (e) {
                reject(e);
            }
        });
        parser.parseBuffer(buffer);
    });
}

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

/**
 * Simple local fallback: extract project-like sections from resume text
 * when AI is unavailable (no credits, bad key, network down, etc.)
 */
function extractProjectsFallback(pdfText: string): Array<{
    name: string;
    description: string;
    technologies: string[];
    highlights: string;
}> {
    // Common tech keywords to detect
    const TECH_KEYWORDS = [
        'react', 'node', 'python', 'java', 'javascript', 'typescript', 'mongodb',
        'express', 'next.js', 'vue', 'angular', 'django', 'flask', 'spring',
        'aws', 'docker', 'kubernetes', 'redis', 'postgresql', 'mysql', 'firebase',
        'tailwind', 'html', 'css', 'git', 'graphql', 'rest', 'api', 'sql',
        'tensorflow', 'pytorch', 'machine learning', 'deep learning', 'c++',
        'go', 'rust', 'kotlin', 'swift', 'flutter', 'react native', 'redux',
        'socket.io', 'websocket', 'nginx', 'linux', 'ci/cd', 'jenkins',
        'openai', 'langchain', 'llm', 'rag', 'gpt', 'bert', 'transformer',
    ];

    const lines = pdfText.split('\n').map(l => l.trim()).filter(Boolean);

    // Try to find lines that look like project names (short, title-case, often followed by description)
    const projects: Array<{
        name: string;
        description: string;
        technologies: string[];
        highlights: string;
    }> = [];

    // Heuristic: scan for project-like sections
    const projectHeaderRegex = /^(?:project\s*[:\-–—]?\s*|•\s*)?([A-Z][A-Za-z0-9\s\-&/.]{2,50})$/;
    const textLower = pdfText.toLowerCase();

    // Detect technologies used in resume
    const detectedTechs = TECH_KEYWORDS.filter(t => textLower.includes(t.toLowerCase()));

    // Try regex-based extraction
    for (let i = 0; i < lines.length && projects.length < 2; i++) {
        const line = lines[i];
        const match = line.match(projectHeaderRegex);
        if (match && line.length < 60 && line.length > 3) {
            // Check if it's likely a section header (Education, Experience, etc.) - skip those
            const skipWords = ['education', 'experience', 'skills', 'summary', 'objective',
                'contact', 'certifications', 'awards', 'references', 'interests', 'hobbies',
                'languages', 'personal', 'declaration', 'address', 'phone', 'email'];
            if (skipWords.some(w => line.toLowerCase().includes(w))) continue;

            // Grab next 2-3 lines as description
            const descLines = lines.slice(i + 1, i + 4).filter(l => l.length > 10);
            const desc = descLines.join(' ').substring(0, 200);

            // Find techs mentioned near this project
            const nearbyText = lines.slice(Math.max(0, i - 1), i + 6).join(' ').toLowerCase();
            const nearbyTechs = TECH_KEYWORDS.filter(t => nearbyText.includes(t.toLowerCase()));

            projects.push({
                name: match[1].trim(),
                description: desc || 'Project from resume',
                technologies: nearbyTechs.length > 0
                    ? nearbyTechs.slice(0, 6)
                    : detectedTechs.slice(0, 4),
                highlights: 'Extracted from resume (AI analysis unavailable)',
            });
        }
    }

    // If we couldn't find projects with regex, create generic ones from detected tech
    if (projects.length === 0 && detectedTechs.length > 0) {
        projects.push({
            name: 'Technical Project',
            description: `Resume mentions expertise in ${detectedTechs.slice(0, 4).join(', ')}`,
            technologies: detectedTechs.slice(0, 6),
            highlights: 'Technologies detected from resume content',
        });
    }

    return projects;
}

export const parseResume = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No PDF file uploaded' });
            return;
        }

        let pdfText = '';
        try {
            pdfText = await extractPdfText(req.file.buffer);
        } catch (parseErr) {
            console.error('PDF parse failed:', (parseErr as Error)?.message || parseErr);
            res.status(400).json({ error: 'Failed to parse PDF. Please ensure it is a valid, text-based PDF.' });
            return;
        }

        if (!pdfText || pdfText.trim().length < 50) {
            res.status(400).json({ error: 'PDF appears to be empty or unreadable.' });
            return;
        }

        // Try AI extraction first, fall back to local extraction
        try {
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

            const text = await createChatCompletion({
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
            });
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('AI returned non-JSON response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
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
        } catch (aiErr: unknown) {
            // AI failed — use local fallback extraction
            console.warn('AI extraction failed, using local fallback:', (aiErr as Error).message || aiErr);
            const fallbackProjects = extractProjectsFallback(pdfText);
            res.json({
                success: true,
                projects: fallbackProjects,
                resumeLength: pdfText.length,
                note: 'Projects extracted locally (AI temporarily unavailable)',
            });
        }
    } catch (err: unknown) {
        console.error('Resume parse error:', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ error: `Failed to process resume: ${message}` });
    }
};

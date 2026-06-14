import { Request, Response } from 'express';
import axios from 'axios';
import { createChatCompletion } from '../aiClient';

// Judge0 language IDs – https://ce.judge0.com/languages
const LANGUAGE_ID_MAP: Record<string, number> = {
    python: 71,  // Python 3.8.1
    java: 62,  // Java (OpenJDK 13.0.1)
    cpp: 54,  // C++ (GCC 9.2.0)
    c: 50,  // C (GCC 9.2.0)
    javascript: 63,  // JavaScript (Node.js 12.14.0)
};

const getHeaders = () => ({
    'content-type': 'application/json',
    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
    'X-RapidAPI-Host': process.env.RAPIDAPI_HOST || 'judge0-ce.p.rapidapi.com',
});

const getBase = () =>
    `https://${process.env.RAPIDAPI_HOST || 'judge0-ce.p.rapidapi.com'}`;

async function pollResult(token: string, maxAttempts = 10): Promise<Record<string, unknown>> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, 1500));
        const { data } = await axios.get(
            `${getBase()}/submissions/${token}?base64_encoded=true&fields=*`,
            { headers: getHeaders(), timeout: 10000 }
        );
        if (data.status && data.status.id > 2) {
            return data;
        }
    }
    throw new Error('Code execution timed out after polling');
}

function normalizeJavaCode(code: string): string {
    const match = code.match(/public\s+class\s+(\w+)/);
    if (!match) return code;
    const className = match[1];
    if (className === 'Main') return code;

    return code
        .replace(new RegExp(`\\bpublic\\s+class\\s+${className}\\b`, 'g'), 'public class Main')
        .replace(new RegExp(`\\bnew\\s+${className}\\s*\\(`, 'g'), 'new Main(')
        .replace(new RegExp(`\\b${className}\\.`, 'g'), 'Main.');
}

/**
 * Fallback execution using AI.
 * Simulates code execution output and catches syntax errors.
 * Perfect for unsupported languages (like SQL) or when Judge0 API quota is exhausted.
 */
async function executeWithAI(code: string, language: string, stdin?: string) {
    const prompt = `You are a strict code execution engine simulator.
Language: ${language}
Source code:
\`\`\`${language}
${code}
\`\`\`
${stdin ? `Standard Input (stdin):\n${stdin}\n` : ''}

Evaluate this code strictly.
1. If it has syntax errors or would fail to compile, provide the compiler error in "compile_output", set "exit_code" to 1, and "status" to "Compilation Error".
2. If it has runtime errors, provide the stack trace in "stderr", set "exit_code" to 1, and "status" to "Runtime Error".
3. If it runs successfully, provide the exact stdout it would produce in "stdout", set "exit_code" to 0, and "status" to "Accepted".
4. If it's SQL, evaluate the query and simulate the resulting data table text output in "stdout". Assume standard schema based on the query if none provided.

Respond ONLY with valid JSON matching this schema exactly, with NO markdown formatting around it:
{
  "success": boolean,
  "stdout": "string",
  "stderr": "string",
  "compile_output": "string",
  "exit_code": number,
  "status": "string"
}`;

    const text = await createChatCompletion({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1, // Low temp for deterministic execution simulation
    });
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('AI execution simulation failed to return JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
        ...parsed,
        time: "0.1",
        memory: 1024,
    };
}

export const runCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, language, stdin } = req.body as {
            code: string;
            language: string;
            stdin?: string;
        };

        if (!code || !language) {
            res.status(400).json({ error: 'Code and language are required' });
            return;
        }

        const langId = LANGUAGE_ID_MAP[language.toLowerCase()];
        const apiKey = process.env.RAPIDAPI_KEY || '';

        // If unsupported language (like SQL) or no valid RapidAPI key, use AI simulation immediately
        if (!langId || !apiKey || apiKey.startsWith('your_')) {
            console.log(`[AI Simulator] Executing ${language} code via AI fallback`);
            const aiResult = await executeWithAI(code, language, stdin);
            res.json(aiResult);
            return;
        }

        try {
            const sourceCode = language.toLowerCase() === 'java' ? normalizeJavaCode(code) : code;
            
            const { data: submission } = await axios.post(
                `${getBase()}/submissions?base64_encoded=true&wait=false`,
                {
                    source_code: Buffer.from(sourceCode).toString('base64'),
                    language_id: langId,
                    stdin: stdin ? Buffer.from(stdin).toString('base64') : '',
                },
                { headers: getHeaders(), timeout: 15000 }
            );

            const token: string = submission.token;
            if (!token) {
                throw new Error('No token returned from Judge0');
            }

            const result = await pollResult(token);

            const b64decode = (v: unknown) =>
                typeof v === 'string' && v ? Buffer.from(v, 'base64').toString('utf8') : '';

            const stdout = b64decode(result.stdout);
            const stderr = b64decode(result.stderr);
            const compileOut = b64decode(result.compile_output);
            const exitCode = (result.exit_code as number) ?? 0;
            const statusDesc = (result.status as { description: string })?.description || '';

            console.log(`[Judge0] lang=${language} status="${statusDesc}" exit=${exitCode}`);

            res.json({
                success: exitCode === 0,
                stdout,
                stderr,
                compile_output: compileOut,
                exit_code: exitCode,
                status: statusDesc,
                time: result.time,
                memory: result.memory,
            });
        } catch (judge0Err: any) {
            // Fall back to AI simulation if RapidAPI Judge0 quota exhausted (403/429) or service unavailable (503)
            console.warn(`[Judge0] API Failed (${judge0Err.message}). Falling back to AI Simulator.`);
            const aiResult = await executeWithAI(code, language, stdin);
            res.json(aiResult);
        }
    } catch (err: unknown) {
        console.error('Code execution error:', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ error: `Failed to execute code: ${message}` });
    }
};

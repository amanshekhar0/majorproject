import { Request, Response } from 'express';
import axios from 'axios';

const PISTON_API = 'https://emkc.org/api/v2/piston/execute';

const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
    python: { language: 'python', version: '3.10.0' },
    java: { language: 'java', version: '15.0.2' },
    cpp: { language: 'c++', version: '10.2.0' },
    javascript: { language: 'javascript', version: '18.15.0' },
};

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

        const langConfig = LANGUAGE_MAP[language.toLowerCase()];
        if (!langConfig) {
            res.status(400).json({
                error: `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_MAP).join(', ')}`,
            });
            return;
        }

        const payload = {
            language: langConfig.language,
            version: langConfig.version,
            files: [{ content: code }],
            stdin: stdin || '',
            args: [],
            compile_timeout: 10000,
            run_timeout: 5000,
            compile_memory_limit: -1,
            run_memory_limit: -1,
        };

        const response = await axios.post(PISTON_API, payload, {
            timeout: 20000,
            headers: { 'Content-Type': 'application/json' },
        });

        const { run, compile } = response.data;

        res.json({
            success: true,
            stdout: run?.stdout || '',
            stderr: run?.stderr || '',
            compile_output: compile?.stderr || compile?.stdout || '',
            exit_code: run?.code ?? 0,
            cpu_time: run?.cpu_time,
            memory: run?.memory,
        });
    } catch (err: unknown) {
        console.error('Code execution error:', err);
        if (axios.isAxiosError(err)) {
            res.status(503).json({
                error: 'Code execution service unavailable. Please try again.',
                details: err.message,
            });
        } else {
            res.status(500).json({ error: 'Failed to execute code' });
        }
    }
};

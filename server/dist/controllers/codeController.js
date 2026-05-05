"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCode = void 0;
const axios_1 = __importDefault(require("axios"));
// Judge0 language IDs – https://ce.judge0.com/languages
const LANGUAGE_ID_MAP = {
    python: 71, // Python 3.8.1
    java: 62, // Java (OpenJDK 13.0.1)
    cpp: 54, // C++ (GCC 9.2.0)
    c: 50, // C (GCC 9.2.0)
    javascript: 63, // JavaScript (Node.js 12.14.0)
};
/** Read at request time so dotenv has already populated process.env */
const getHeaders = () => ({
    'content-type': 'application/json',
    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
    'X-RapidAPI-Host': process.env.RAPIDAPI_HOST || 'judge029.p.rapidapi.com',
});
const getBase = () => `https://${process.env.RAPIDAPI_HOST || 'judge029.p.rapidapi.com'}`;
/** Poll Judge0 until execution finishes (status.id > 2 = not queued/processing) */
async function pollResult(token, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, 1500));
        const { data } = await axios_1.default.get(`${getBase()}/submissions/${token}?base64_encoded=true&fields=*`, { headers: getHeaders(), timeout: 10000 });
        if (data.status && data.status.id > 2) {
            return data;
        }
    }
    throw new Error('Code execution timed out after polling');
}
/**
 * Judge0 saves Java files as "Main.java", so the public class MUST be named Main.
 * This function renames any `public class Foo` → `public class Main` automatically,
 * and also replaces `new Foo(` / `Foo.` references with `Main` so the code still compiles.
 */
function normalizeJavaCode(code) {
    // Find the name of the public class (if any)
    const match = code.match(/public\s+class\s+(\w+)/);
    if (!match)
        return code;
    const className = match[1];
    if (className === 'Main')
        return code; // already correct
    // Replace class declaration and all usages of that class name
    return code
        .replace(new RegExp(`\\bpublic\\s+class\\s+${className}\\b`, 'g'), 'public class Main')
        .replace(new RegExp(`\\bnew\\s+${className}\\s*\\(`, 'g'), 'new Main(')
        .replace(new RegExp(`\\b${className}\.`, 'g'), 'Main.');
}
const runCode = async (req, res) => {
    try {
        const { code, language, stdin } = req.body;
        if (!code || !language) {
            res.status(400).json({ error: 'Code and language are required' });
            return;
        }
        const langId = LANGUAGE_ID_MAP[language.toLowerCase()];
        if (!langId) {
            res.status(400).json({
                error: `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_ID_MAP).join(', ')}`,
            });
            return;
        }
        const apiKey = process.env.RAPIDAPI_KEY || '';
        if (!apiKey) {
            res.status(500).json({ error: 'RapidAPI key not configured on server' });
            return;
        }
        // For Java: Judge0 saves file as Main.java, so public class must be named Main
        const sourceCode = language.toLowerCase() === 'java' ? normalizeJavaCode(code) : code;
        // Submit with base64 encoding to handle all character sets
        const { data: submission } = await axios_1.default.post(`${getBase()}/submissions?base64_encoded=true&wait=false`, {
            source_code: Buffer.from(sourceCode).toString('base64'),
            language_id: langId,
            stdin: stdin ? Buffer.from(stdin).toString('base64') : '',
        }, { headers: getHeaders(), timeout: 15000 });
        const token = submission.token;
        if (!token) {
            res.status(502).json({ error: 'No token returned from Judge0' });
            return;
        }
        // Step 2 – Poll for result
        const result = await pollResult(token);
        // Decode base64 output fields
        const b64decode = (v) => typeof v === 'string' && v ? Buffer.from(v, 'base64').toString('utf8') : '';
        const stdout = b64decode(result.stdout);
        const stderr = b64decode(result.stderr);
        const compileOut = b64decode(result.compile_output);
        const exitCode = result.exit_code ?? 0;
        const statusDesc = result.status?.description || '';
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
    }
    catch (err) {
        console.error('Code execution error:', err);
        if (axios_1.default.isAxiosError(err)) {
            res.status(503).json({
                error: 'Code execution service unavailable. Please try again.',
                details: err.message,
            });
        }
        else {
            res.status(500).json({ error: 'Failed to execute code' });
        }
    }
};
exports.runCode = runCode;

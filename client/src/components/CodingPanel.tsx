import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, ChevronDown, Terminal as TerminalIcon, RefreshCw } from 'lucide-react';
import { useInterview } from '../context/InterviewContext';

const LANGUAGES = [
    { id: 'python', label: 'Python', monacoLang: 'python' },
    { id: 'java', label: 'Java', monacoLang: 'java' },
    { id: 'cpp', label: 'C++', monacoLang: 'cpp' },
    { id: 'javascript', label: 'JavaScript', monacoLang: 'javascript' },
];

const DEFAULT_CODE: Record<string, string> = {
    python: '# Write your solution here\n\n',
    java: '// Write your solution here\npublic class Solution {\n    \n}\n',
    cpp: '// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n',
    javascript: '// Write your solution here\n\nfunction solution() {\n    \n}\n',
};

const C = {
    toolbar: '#181818',
    border: '#2a2a2a',
    editor: '#1e1e1e',
    console: '#141414',
    text: '#e5e5e5',
    muted: '#777',
    blue: '#3b82f6',
    green: '#22c55e',
    red: '#ef4444',
    dropdown: '#222',
};

export default function CodingPanel() {
    const {
        code, setCode, language, setLanguage,
        terminalOutput, isRunning, runCode, submitCode,
        currentQuestion,
    } = useInterview();
    const [langDropdown, setLangDropdown] = useState(false);

    useEffect(() => {
        if (currentQuestion?.starterCode) {
            const starter = currentQuestion.starterCode[language] || currentQuestion.starterCode['python'] || '';
            setCode(starter);
        } else if (!code) {
            setCode(DEFAULT_CODE[language] || '');
        }
    }, [currentQuestion?.id, language]);

    const handleLanguageChange = (langId: string) => {
        setLanguage(langId);
        setLangDropdown(false);
        if (currentQuestion?.starterCode) {
            setCode(currentQuestion.starterCode[langId] || currentQuestion.starterCode['python'] || '');
        } else {
            setCode(DEFAULT_CODE[langId] || '');
        }
    };

    const currentLang = LANGUAGES.find(l => l.id === language) || LANGUAGES[0];

    return (
        <div className="flex flex-col h-full" style={{ background: C.editor }}>
            {/* Toolbar */}
            <div
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2"
                style={{ background: C.toolbar, borderBottom: `1px solid ${C.border}`, height: 44 }}
            >
                {/* Language selector */}
                <div className="relative">
                    <button
                        onClick={() => setLangDropdown(!langDropdown)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:opacity-80"
                        style={{ background: '#252525', color: C.text, border: `1px solid ${C.border}` }}
                    >
                        <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: C.blue }}
                        />
                        LANGUAGE: {currentLang.label}
                        <ChevronDown
                            size={11}
                            style={{
                                color: C.muted,
                                transform: langDropdown ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.15s',
                            }}
                        />
                    </button>
                    {langDropdown && (
                        <div
                            className="absolute top-full left-0 mt-1 w-40 rounded-md shadow-xl z-30 overflow-hidden"
                            style={{ background: C.dropdown, border: `1px solid ${C.border}` }}
                        >
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.id}
                                    onClick={() => handleLanguageChange(lang.id)}
                                    className="w-full text-left px-3 py-2 text-xs transition-colors hover:opacity-80"
                                    style={{
                                        color: lang.id === language ? C.blue : C.text,
                                        background: lang.id === language ? '#1e2a3a' : 'transparent',
                                        fontWeight: lang.id === language ? 600 : 400,
                                    }}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1" />

                {/* Reset */}
                <button
                    onClick={() => setCode(currentQuestion?.starterCode?.[language] || DEFAULT_CODE[language] || '')}
                    className="p-1.5 rounded-md transition-opacity hover:opacity-70"
                    style={{ color: C.muted }}
                    title="Reset to starter code"
                >
                    <RefreshCw size={13} />
                </button>

                {/* Run Code */}
                <button
                    onClick={runCode}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-opacity disabled:opacity-40 hover:opacity-80"
                    style={{ background: C.green, color: '#fff' }}
                >
                    {isRunning
                        ? <RefreshCw size={12} className="animate-spin" />
                        : <Play size={12} />
                    }
                    {isRunning ? 'Running...' : 'Run Code'}
                </button>

                {/* Submit */}
                <button
                    onClick={submitCode}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-opacity disabled:opacity-40 hover:opacity-80"
                    style={{ background: '#252525', color: C.text, border: `1px solid ${C.border}` }}
                >
                    <Send size={12} />
                    Submit
                </button>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
                <Editor
                    height="100%"
                    language={currentLang.monacoLang}
                    value={code}
                    onChange={(val) => setCode(val || '')}
                    theme="vs-dark"
                    options={{
                        fontSize: 13,
                        fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
                        fontLigatures: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        lineNumbers: 'on',
                        renderLineHighlight: 'line',
                        tabSize: 4,
                        wordWrap: 'on',
                        padding: { top: 14, bottom: 14 },
                        smoothScrolling: true,
                        cursorSmoothCaretAnimation: 'on',
                        formatOnPaste: true,
                        lineDecorationsWidth: 0,
                        overviewRulerBorder: false,
                    }}
                />
            </div>

            {/* Console */}
            <div
                className="flex-shrink-0 flex flex-col"
                style={{ height: '30%', borderTop: `1px solid ${C.border}`, background: C.console }}
            >
                {/* Console header */}
                <div
                    className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
                    style={{ borderBottom: `1px solid ${C.border}` }}
                >
                    <TerminalIcon size={11} style={{ color: C.green }} />
                    <span className="text-xs font-mono font-semibold" style={{ color: C.green }}>Console</span>
                    <div className="flex gap-1 ml-1">
                        {['#ef4444', '#f59e0b', '#22c55e'].map(c => (
                            <div key={c} className="w-2 h-2 rounded-full" style={{ background: c, opacity: 0.5 }} />
                        ))}
                    </div>
                </div>

                {/* Console output */}
                <div className="flex-1 p-3 overflow-y-auto font-mono text-xs leading-relaxed">
                    {terminalOutput ? (
                        <pre
                            className="whitespace-pre-wrap break-all"
                            style={{
                                color: terminalOutput.includes('[Error]') || terminalOutput.includes('[Network Error]')
                                    ? C.red
                                    : terminalOutput.includes('⏳')
                                        ? '#60a5fa'
                                        : '#86efac',
                            }}
                        >
                            {terminalOutput}
                        </pre>
                    ) : (
                        <span style={{ color: '#444' }}>Run code to see output...</span>
                    )}
                </div>
            </div>
        </div>
    );
}

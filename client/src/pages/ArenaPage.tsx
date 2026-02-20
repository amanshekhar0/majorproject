import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { useTimer } from '../hooks/useTimer';
import { useAntiCheat } from '../hooks/useAntiCheat';
import ChatPanel from '../components/ChatPanel';
import QuestionPanel from '../components/QuestionPanel';
import CodingPanel from '../components/CodingPanel';
import ProctorOverlay from '../components/ProctorOverlay';
import { Clock, AlertTriangle, Wifi } from 'lucide-react';

const INTERVIEW_DURATION = 60 * 60;

const C = {
    bg: '#111111',
    sidebar: '#1a1a1a',
    border: '#2a2a2a',
    header: '#141414',
    centerBg: '#1e1e1e',
    text: '#e5e5e5',
    muted: '#888888',
    blue: '#3b82f6',
    green: '#22c55e',
    red: '#ef4444',
    yellow: '#f59e0b',
};

export default function ArenaPage() {
    const navigate = useNavigate();
    const {
        currentQuestion, currentIndex, questions,
        sessionStarted, startSession, endSession, getSessionData,
        tabSwitchCount, incrementTabSwitch, setTerminated,
    } = useInterview();
    const videoRef = useRef<HTMLVideoElement>(null);
    const gazeInitRef = useRef(false);

    const handleExpire = () => endSession(false, INTERVIEW_DURATION);

    const { secondsLeft, start: startTimer, formatTime, urgency, getElapsedSeconds } = useTimer({
        initialSeconds: INTERVIEW_DURATION,
        onExpire: handleExpire,
    });

    const handleTerminate = () => {
        endSession(true, getElapsedSeconds());
        setTerminated(true);
        navigate('/results', { state: getSessionData() });
    };

    const { warningType, dismissWarning, initWebcam, initGazeDetection } = useAntiCheat({
        onTerminate: handleTerminate,
        onTabSwitch: incrementTabSwitch,
        enabled: sessionStarted,
        tabSwitchCount,
        MAX_TAB_SWITCHES: 5,
    });

    useEffect(() => {
        if (!sessionStarted) startSession();
        startTimer();
    }, []);

    useEffect(() => {
        if (videoRef.current && !gazeInitRef.current) {
            gazeInitRef.current = true;
            initWebcam(videoRef.current).then(() => {
                if (videoRef.current) initGazeDetection(videoRef.current);
            });
        }
    }, [initWebcam, initGazeDetection]);

    const handleFinish = () => {
        endSession(false, getElapsedSeconds());
        navigate('/results', { state: getSessionData() });
    };

    const timerColor =
        urgency === 'critical' ? C.red :
            urgency === 'warning' ? C.yellow :
                C.text;

    return (
        <div
            className="h-screen flex flex-col overflow-hidden"
            style={{ background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif" }}
        >
            {/* ── Header ── */}
            <header
                className="flex-shrink-0 flex items-center justify-between px-5 py-2.5"
                style={{ background: C.header, borderBottom: `1px solid ${C.border}`, height: 52 }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-7 h-7 rounded-md flex items-center justify-center"
                        style={{ background: C.blue }}
                    >
                        <span className="text-white text-xs font-black">AI</span>
                    </div>
                    <span className="font-semibold text-sm" style={{ color: C.text }}>InterviewMaster AI</span>
                    {tabSwitchCount > 0 && (
                        <span className="text-xs flex items-center gap-1 ml-2" style={{ color: C.red }}>
                            <AlertTriangle size={11} />
                            {tabSwitchCount}/5 tab switches
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 font-mono text-xl font-bold" style={{ color: timerColor }}>
                    {urgency !== 'normal' && <AlertTriangle size={16} className="animate-pulse" />}
                    <Clock size={16} style={{ opacity: 0.7 }} />
                    {formatTime(secondsLeft)}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: C.green }}>
                        <Wifi size={12} />
                        <span>Live</span>
                    </div>
                    <button
                        onClick={handleFinish}
                        className="text-xs px-4 py-1.5 rounded-md font-semibold hover:opacity-80 transition-opacity"
                        style={{ background: C.green, color: '#fff' }}
                    >
                        Submit Assessment
                    </button>
                    <button
                        onClick={handleTerminate}
                        className="text-xs px-3 py-1.5 rounded-md font-medium hover:opacity-80 transition-opacity"
                        style={{ background: '#1f1f1f', color: C.red, border: `1px solid #3a1a1a` }}
                    >
                        End
                    </button>
                </div>
            </header>

            {/* ── 3-panel body ── */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left sidebar: question list */}
                <aside
                    className="flex-shrink-0 flex flex-col overflow-y-auto"
                    style={{ width: 220, background: C.sidebar, borderRight: `1px solid ${C.border}` }}
                >
                    <QuestionPanel />
                </aside>

                {/* Center: question detail + AI chat */}
                <div
                    className="flex flex-col overflow-hidden"
                    style={{ flex: '0 0 400px', borderRight: `1px solid ${C.border}`, background: C.centerBg }}
                >
                    <div className="flex-1 overflow-y-auto" style={{ borderBottom: `1px solid ${C.border}` }}>
                        <QuestionDetail />
                    </div>
                    <div style={{ height: '42%' }} className="overflow-hidden flex flex-col">
                        <ChatPanel />
                    </div>
                </div>

                {/* Right: code editor + console */}
                <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#1e1e1e' }}>
                    <CodingPanel />
                </div>
            </div>

            <ProctorOverlay
                videoRef={videoRef}
                warningType={warningType}
                tabSwitchCount={tabSwitchCount}
                onDismiss={dismissWarning}
                onTerminate={handleTerminate}
            />
        </div>
    );
}

// ── Question Detail for center panel ─────────────────────────────────
function QuestionDetail() {
    const { currentQuestion, currentIndex, questions, sendMessage, goNextQuestion, submitMCQ } = useInterview();
    const [selectedMCQ, setSelectedMCQ] = useState<string | null>(null);
    const [mcqResult, setMcqResult] = useState<'correct' | 'incorrect' | null>(null);

    if (!currentQuestion) {
        return (
            <div className="p-6 text-sm" style={{ color: '#888' }}>
                All questions completed. Submit your assessment when ready.
            </div>
        );
    }

    const sendHint = (type: string) => {
        sendMessage(`${type} for this question: ${currentQuestion.question.substring(0, 100)}`);
    };

    const handleMCQSelect = (opt: string) => {
        if (mcqResult) return;
        setSelectedMCQ(opt);
    };

    const handleMCQSubmit = () => {
        if (!selectedMCQ) return;
        const correct = submitMCQ(selectedMCQ);
        setMcqResult(correct ? 'correct' : 'incorrect');
        const msg = correct
            ? `✅ Correct! ${currentQuestion.explanation || ''}`
            : `❌ The answer is "${currentQuestion.correctAnswer}". ${currentQuestion.explanation || ''}`;
        sendMessage(msg.substring(0, 200)).then(() => {
            setTimeout(() => {
                setSelectedMCQ(null);
                setMcqResult(null);
                goNextQuestion();
            }, 2000);
        });
    };

    const typeLabel: Record<string, string> = {
        mcq: 'Multiple Choice',
        output_guess: 'Guess the Output',
        debugging: 'Debug the Code',
        dsa: 'DSA Problem',
        resume_deep: 'Resume Deep-Dive',
    };

    // Render question text — parse markdown-ish bold and bullets
    const renderText = (text: string) =>
        text.split('\n').map((line, i) => {
            if (line.startsWith('**') && line.endsWith('**'))
                return <p key={i} className="font-bold text-sm mt-2" style={{ color: '#e5e5e5' }}>{line.replace(/\*\*/g, '')}</p>;
            if (line.startsWith('- '))
                return <li key={i} className="ml-3 list-disc text-xs" style={{ color: '#aaa' }}>{line.slice(2)}</li>;
            if (line.trim() === '')
                return <div key={i} className="h-1.5" />;
            return <p key={i} className="text-sm leading-relaxed" style={{ color: '#c9c9c9' }}>{line}</p>;
        });

    const [titleLine, ...bodyLines] = currentQuestion.question.split('\n');

    return (
        <div className="p-5 space-y-4">
            {/* Badge + title */}
            <div>
                <span
                    className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded mb-2 inline-block"
                    style={{ background: '#1e3a5a', color: '#60a5fa' }}
                >
                    {typeLabel[currentQuestion.type] || currentQuestion.type}
                </span>
                <h2 className="text-sm font-bold leading-snug" style={{ color: '#e5e5e5' }}>
                    {titleLine.replace(/\*\*/g, '')}
                </h2>
            </div>

            {/* Question body */}
            <div className="space-y-1">{renderText(bodyLines.join('\n'))}</div>

            {/* Code block */}
            {currentQuestion.code && (
                <div className="rounded-md overflow-hidden" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
                    <div className="px-3 py-2 flex items-center gap-1.5" style={{ borderBottom: '1px solid #2a2a2a' }}>
                        {['#ef4444', '#f59e0b', '#22c55e'].map(c => (
                            <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c, opacity: 0.7 }} />
                        ))}
                    </div>
                    <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap" style={{ color: '#7dd3fc' }}>
                        {currentQuestion.code}
                    </pre>
                </div>
            )}

            {/* MCQ options */}
            {currentQuestion.type === 'mcq' && currentQuestion.options && (
                <div className="space-y-2">
                    {currentQuestion.options.map((opt, i) => {
                        const isSelected = selectedMCQ === opt;
                        const isCorrect = !!(mcqResult && opt === currentQuestion.correctAnswer);
                        const isWrong = mcqResult === 'incorrect' && isSelected;
                        return (
                            <button
                                key={i}
                                onClick={() => handleMCQSelect(opt)}
                                className="w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center gap-2.5 transition-colors"
                                style={{
                                    background: isCorrect ? '#14321e' : isWrong ? '#3a1818' : isSelected ? '#1e2a3a' : '#1a1a1a',
                                    border: `1px solid ${isCorrect ? '#22c55e' : isWrong ? '#ef4444' : isSelected ? '#3b82f6' : '#2a2a2a'}`,
                                    color: isCorrect ? '#86efac' : isWrong ? '#fca5a5' : isSelected ? '#93c5fd' : '#ccc',
                                }}
                            >
                                <span
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                    style={{ background: isSelected ? '#3b82f6' : '#252525', color: isSelected ? '#fff' : '#777' }}
                                >
                                    {['A', 'B', 'C', 'D'][i]}
                                </span>
                                {opt}
                            </button>
                        );
                    })}
                    <button
                        onClick={handleMCQSubmit}
                        disabled={!selectedMCQ || !!mcqResult}
                        className="mt-1 w-full py-2 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-30"
                        style={{ background: '#3b82f6', color: '#fff' }}
                    >
                        {mcqResult === 'correct' ? '✅ Correct!' : mcqResult === 'incorrect' ? '❌ Incorrect' : 'Submit Answer'}
                    </button>
                </div>
            )}

            {/* Hint buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
                {[
                    { label: '⚡ Help with Mistake', hint: 'Help me identify the mistake' },
                    { label: '💡 Give Hint', hint: 'Give me a hint' },
                    { label: 'ℹ Explain Constraint', hint: 'Explain the constraint' },
                ].map(btn => (
                    <button
                        key={btn.hint}
                        onClick={() => sendHint(btn.hint)}
                        className="text-xs px-3 py-1.5 rounded-md hover:opacity-70 transition-opacity"
                        style={{ background: '#252525', color: '#aaa', border: '1px solid #333' }}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>

            {/* DSA note */}
            {currentQuestion.type === 'dsa' && (
                <div className="text-xs p-3 rounded-md" style={{ background: '#1a2535', border: '1px solid #1e3a5f', color: '#60a5fa' }}>
                    💡 Write your solution in the code editor on the right. Click <strong>Submit</strong> when ready.
                </div>
            )}

            {/* Follow-up (resume) */}
            {currentQuestion.followUp && (
                <div className="text-xs italic" style={{ color: '#666' }}>
                    Follow-up: {currentQuestion.followUp}
                </div>
            )}

            {/* Skip */}
            {currentIndex < questions.length - 1 && (
                <button
                    onClick={goNextQuestion}
                    className="text-xs hover:opacity-80 transition-opacity"
                    style={{ color: '#3b82f6' }}
                >
                    Skip to next →
                </button>
            )}
        </div>
    );
}

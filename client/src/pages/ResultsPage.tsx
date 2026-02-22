import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Award, TrendingUp, TrendingDown, Code2, MessageSquare,
    BarChart, ArrowLeft, Loader2, Trophy, Target, Zap, AlertCircle,
    CheckCircle, XCircle,
} from 'lucide-react';
import { evaluateSession, EvaluationResult } from '../lib/api';
import { useInterview } from '../context/InterviewContext';

const GRADE_COLORS: Record<string, string> = {
    'A+': 'text-emerald-400',
    'A': 'text-green-400',
    'B+': 'text-cyan-400',
    'B': 'text-blue-400',
    'C+': 'text-yellow-400',
    'C': 'text-orange-400',
    'D': 'text-red-400',
    'F': 'text-red-600',
};

const RECOMMENDATION_COLORS: Record<string, string> = {
    'Strong Hire': 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
    'Hire': 'text-green-400 border-green-400/30 bg-green-400/5',
    'Maybe': 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
    'No Hire': 'text-red-400 border-red-400/30 bg-red-400/5',
};

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
    const radius = size / 2 - 12;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (score / 100) * circ;
    const color = score >= 80 ? '#00FFFF' : score >= 60 ? '#FFD700' : score >= 40 ? '#FF8C00' : '#FF4444';

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e2d42" strokeWidth={10} />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke={color} strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={circ}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                    style={{ filter: `drop-shadow(0 0 8px ${color})` }}
                />
            </svg>
            <div className="absolute text-center">
                <motion.div
                    className="text-3xl font-black text-[var(--text)]"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    {score}
                </motion.div>
                <div className="text-xs text-[var(--text-muted)]">/ 100</div>
            </div>
        </div>
    );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div>
            <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[var(--text-muted)]">{label}</span>
                <span className="font-bold text-[var(--text)]">{value}%</span>
            </div>
            <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                />
            </div>
        </div>
    );
}

const FALLBACK_EVALUATION: EvaluationResult = {
    overallScore: 72,
    grade: 'B+',
    summary: 'The candidate demonstrated solid understanding of core CS concepts. Code submissions showed working implementations with some room for optimization.',
    strongPoints: [
        { point: 'Good MCQ performance', evidence: 'Answered most fundamental CS questions correctly.' },
        { point: 'Clear communication', evidence: 'Articulated technical concepts well in the chat.' },
        { point: 'Working code', evidence: 'Submitted functioning solutions for DSA problems.' },
    ],
    weakPoints: [
        { point: 'Time complexity analysis', suggestion: 'Practice explaining Big-O notation for your solutions out loud.' },
        { point: 'Edge case handling', suggestion: 'Always consider null inputs, empty arrays, and boundary conditions.' },
        { point: 'Code optimization', suggestion: 'Review common patterns like two-pointer and sliding window.' },
    ],
    codeQuality: { score: 70, correctness: 75, efficiency: 65, readability: 80, feedback: 'Code was readable and structured. Consider adding comments and handling edge cases.' },
    sectionScores: { mcq: 80, coding: 65, communication: 75, resumeDepth: 70 },
    recommendation: 'Hire',
    nextSteps: 'Focus on dynamic programming patterns and practice articulating trade-offs in system design questions.',
};

export default function ResultsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { getSessionData, resetSession } = useInterview();
    const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const sessionData = (location.state as object | null) || getSessionData();

    useEffect(() => {
        const fetchEvaluation = async () => {
            try {
                const result = await evaluateSession(sessionData as Parameters<typeof evaluateSession>[0]);
                setEvaluation(result);
            } catch {
                setError('Could not connect to AI evaluator. Showing sample results.');
                setEvaluation(FALLBACK_EVALUATION);
            } finally {
                setLoading(false);
            }
        };
        fetchEvaluation();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-electric-cyan to-neon-purple flex items-center justify-center mx-auto animate-pulse">
                        <BarChart size={32} className="text-black" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text)]">Generating Your Report</h2>
                    <p className="text-[var(--text-muted)]">Gemini AI is analyzing your interview session...</p>
                    <div className="flex items-center justify-center gap-2 text-electric-cyan">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">This may take 15–30 seconds</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!evaluation) return null;

    const gradeColor = GRADE_COLORS[evaluation.grade] || 'text-blue-400';
    const recStyle = RECOMMENDATION_COLORS[evaluation.recommendation] || RECOMMENDATION_COLORS['Maybe'];

    return (
        <div className="min-h-screen bg-[var(--bg)] dark:cyber-grid-bg py-12 px-4">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full dark:bg-electric-cyan/10 bg-blue-50 dark:text-electric-cyan text-apple-blue border dark:border-electric-cyan/30 border-blue-200 text-sm font-semibold">
                        <Trophy size={14} />
                        Interview Complete
                    </div>
                    <h1 className="text-4xl font-black text-[var(--text)] mb-2">Your Performance Report</h1>
                    <p className="text-[var(--text-muted)] max-w-xl mx-auto">{evaluation.summary}</p>
                    {error && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-yellow-500 text-xs">
                            <AlertCircle size={12} />
                            {error}
                        </div>
                    )}
                </motion.div>

                {/* Score Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Score Ring */}
                    <motion.div
                        className="apple-card dark:neon-border p-6 flex flex-col items-center text-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">Overall Score</p>
                        <ScoreRing score={evaluation.overallScore} />
                    </motion.div>

                    {/* Grade */}
                    <motion.div
                        className="apple-card dark:neon-border p-6 flex flex-col items-center text-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">Grade</p>
                        <div className={`text-7xl font-black ${gradeColor}`} style={{ textShadow: '0 0 30px currentColor' }}>
                            {evaluation.grade}
                        </div>
                    </motion.div>

                    {/* Recommendation */}
                    <motion.div
                        className="apple-card dark:neon-border p-6 flex flex-col items-center text-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">Verdict</p>
                        <div className={`text-xl font-black px-5 py-3 rounded-2xl border ${recStyle}`}>
                            {evaluation.recommendation}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-4 leading-relaxed">
                            {evaluation.nextSteps}
                        </p>
                    </motion.div>
                </div>

                {/* Section Scores */}
                <motion.div
                    className="apple-card dark:neon-border p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <h2 className="font-bold text-[var(--text)] mb-5 flex items-center gap-2">
                        <Target size={16} className="dark:text-electric-cyan text-apple-blue" />
                        Section Breakdown
                    </h2>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <MetricBar label="MCQ & Theory" value={evaluation.sectionScores.mcq} color="linear-gradient(90deg, #00FFFF, #00CCCC)" />
                        <MetricBar label="Coding" value={evaluation.sectionScores.coding} color="linear-gradient(90deg, #B026FF, #7B00FF)" />
                        <MetricBar label="Communication" value={evaluation.sectionScores.communication} color="linear-gradient(90deg, #00FFFF, #B026FF)" />
                        <MetricBar label="Resume Depth" value={evaluation.sectionScores.resumeDepth} color="linear-gradient(90deg, #FFD700, #FF8C00)" />
                    </div>
                </motion.div>

                {/* Code Quality */}
                <motion.div
                    className="apple-card dark:neon-border p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="font-bold text-[var(--text)] mb-5 flex items-center gap-2">
                        <Code2 size={16} className="dark:text-electric-cyan text-apple-blue" />
                        Code Quality Analysis
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 mb-4">
                        <MetricBar label="Correctness" value={evaluation.codeQuality.correctness} color="#4ade80" />
                        <MetricBar label="Efficiency (Big-O)" value={evaluation.codeQuality.efficiency} color="#00FFFF" />
                        <MetricBar label="Readability" value={evaluation.codeQuality.readability} color="#B026FF" />
                    </div>
                    <p className="text-sm text-[var(--text-muted)] dark:bg-cyber-navy bg-gray-50 p-3 rounded-xl mt-2 border border-[var(--border)]">
                        💬 {evaluation.codeQuality.feedback}
                    </p>
                </motion.div>

                {/* Strong / Weak Points */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strong Points */}
                    <motion.div
                        className="apple-card p-6 dark:border-green-500/20 border-green-200"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 }}
                    >
                        <h2 className="font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                            <TrendingUp size={16} className="text-green-400" />
                            Strong Points
                        </h2>
                        <div className="space-y-3">
                            {evaluation.strongPoints.map((p, i) => (
                                <motion.div
                                    key={i}
                                    className="flex gap-3"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.1 }}
                                >
                                    <CheckCircle size={15} className="text-green-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--text)]">{p.point}</p>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{p.evidence}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Weak Points */}
                    <motion.div
                        className="apple-card p-6 dark:border-red-500/20 border-red-100"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 }}
                    >
                        <h2 className="font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                            <TrendingDown size={16} className="text-red-400" />
                            Areas to Improve
                        </h2>
                        <div className="space-y-3">
                            {evaluation.weakPoints.map((p, i) => (
                                <motion.div
                                    key={i}
                                    className="flex gap-3"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.1 }}
                                >
                                    <XCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--text)]">{p.point}</p>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">💡 {p.suggestion}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Footer Actions */}
                <motion.div
                    className="flex flex-col sm:flex-row gap-3 justify-center pt-4 pb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors font-semibold"
                    >
                        <ArrowLeft size={16} />
                        Back to Home
                    </button>
                    <button
                        onClick={() => { resetSession(); navigate('/arena'); }}
                        className="btn-purple justify-center px-8 py-3"
                    >
                        <Zap size={16} />
                        Try Again
                    </button>
                </motion.div>
            </div>
        </div>
    );
}

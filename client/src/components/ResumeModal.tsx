import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useInterview } from '../context/InterviewContext';
import { uploadResume, Project } from '../lib/api';
import { generateResumeQuestions } from '../lib/api';
import { QUESTION_BANK } from '../data/questions';

interface ResumeModalProps {
    onClose: () => void;
    onStart: () => void;
}

export default function ResumeModal({ onClose, onStart }: ResumeModalProps) {
    const { setProjects, setQuestions, startSession, isDark } = useInterview();
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [extractedProjects, setExtractedProjects] = useState<Project[]>([]);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const bg = isDark ? '#111' : '#fff';
    const border = isDark ? '#222' : '#e5e5e5';
    const text = isDark ? '#f0f0f0' : '#111';
    const muted = isDark ? '#555' : '#999';
    const subtleBg = isDark ? '#181818' : '#f7f7f7';

    const handleFile = useCallback((f: File) => {
        if (f.type !== 'application/pdf') {
            setError('Please upload a PDF file.');
            return;
        }
        setFile(f);
        setError('');
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    }, [handleFile]);

    const handleUpload = async () => {
        if (!file) return;
        setStatus('uploading');
        setError('');
        try {
            const result = await uploadResume(file);
            setExtractedProjects(result.projects);
            setProjects(result.projects);
            setStatus('success');
            try {
                const dynamicQs = await generateResumeQuestions(result.projects);
                const baseQuestions = QUESTION_BANK.filter(q => q.type !== 'resume_deep');
                setQuestions([...baseQuestions, ...dynamicQs]);
            } catch {
                setQuestions(QUESTION_BANK);
            }
        } catch (err: unknown) {
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Failed to process resume. Please try again.');
        }
    };

    const handleSkip = () => {
        setProjects([]);
        setQuestions(QUESTION_BANK);
        startSession();
        onStart();
    };

    const handleStart = () => {
        startSession();
        onStart();
    };

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Backdrop */}
            <motion.div
                className="absolute inset-0 backdrop-blur-sm"
                style={{ background: 'rgba(0,0,0,0.6)' }}
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            />

            {/* Modal */}
            <motion.div
                style={{ background: bg, border: `1px solid ${border}`, color: text }}
                className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                initial={{ scale: 0.95, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            >
                <div className="p-7">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold" style={{ color: text }}>Upload Resume</h2>
                            <p className="text-sm mt-1" style={{ color: muted }}>
                                AI extracts your projects for personalised questions.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: muted }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Upload Zone */}
                    {status !== 'success' && (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-xl p-8 text-center cursor-pointer transition-all duration-150"
                            style={{
                                border: `2px dashed ${isDragging ? text : file ? border : border}`,
                                background: isDragging ? subtleBg : file ? subtleBg : 'transparent',
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                            />
                            {file ? (
                                <div className="flex flex-col items-center gap-2">
                                    <FileText size={36} style={{ color: text }} />
                                    <p className="font-medium text-sm" style={{ color: text }}>{file.name}</p>
                                    <p className="text-xs" style={{ color: muted }}>{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Upload size={32} style={{ color: muted }} />
                                    <p className="font-medium text-sm" style={{ color: text }}>Drop PDF here or click to browse</p>
                                    <span className="text-xs px-3 py-1 rounded-full" style={{ background: subtleBg, color: muted, border: `1px solid ${border}` }}>
                                        PDF · Max 10 MB
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-red-500">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    {/* Success — extracted projects */}
                    {status === 'success' && extractedProjects.length > 0 && (
                        <AnimatePresence>
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-3"
                            >
                                <div className="flex items-center gap-2 text-green-500 font-medium text-sm">
                                    <CheckCircle size={16} />
                                    Projects extracted successfully
                                </div>
                                {extractedProjects.map((p, i) => (
                                    <div
                                        key={i}
                                        className="p-4 rounded-xl"
                                        style={{ background: subtleBg, border: `1px solid ${border}` }}
                                    >
                                        <div className="font-semibold text-sm" style={{ color: text }}>{p.name}</div>
                                        <div className="text-sm mt-1" style={{ color: muted }}>{p.description}</div>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {p.technologies.map(t => (
                                                <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                                                    style={{ background: isDark ? '#222' : '#efefef', color: muted, border: `1px solid ${border}` }}>
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex flex-col gap-2">
                        {status === 'success' ? (
                            <button
                                onClick={handleStart}
                                className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-85"
                                style={{ background: text, color: bg }}
                            >
                                Begin Interview →
                            </button>
                        ) : (
                            <button
                                onClick={handleUpload}
                                disabled={!file || status === 'uploading'}
                                className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ background: text, color: bg }}
                            >
                                {status === 'uploading' ? (
                                    <><Loader2 size={16} className="animate-spin" /> Analysing Resume...</>
                                ) : (
                                    <><Upload size={16} /> Analyse Resume</>
                                )}
                            </button>
                        )}
                        <button
                            onClick={handleSkip}
                            className="text-xs text-center py-2 transition-colors"
                            style={{ color: muted }}
                        >
                            Skip — start without resume
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

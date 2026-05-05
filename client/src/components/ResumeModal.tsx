import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Zap,
  Target,
  Flame,
  Mail,
  User,
} from "lucide-react";
import { useInterview } from "../context/InterviewContext";
import type { Difficulty } from "../context/InterviewContext";
import { uploadResume, Project } from "../lib/api";
import { generateResumeQuestions } from "../lib/api";
import { generateRandomQuestions } from "../lib/api";
import { QUESTION_BANK_BY_DIFFICULTY } from "../data/questions";

interface ResumeModalProps {
  onClose: () => void;
  onStart: () => void;
}

export default function ResumeModal({ onClose, onStart }: ResumeModalProps) {
  const {
    setProjects,
    setQuestions,
    startSession,
    isDark,
    difficulty,
    setDifficulty,
    candidateName,
    candidateEmail,
    setCandidateIdentity,
  } = useInterview();
  const [step, setStep] = useState<"difficulty" | "profile" | "resume">(
    "difficulty",
  );
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [extractedProjects, setExtractedProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    setProfileName(candidateName);
    setProfileEmail(candidateEmail);
  }, [candidateName, candidateEmail]);
  const border = isDark ? "#222" : "#e5e5e5";
  const text = isDark ? "#f0f0f0" : "#111";
  const muted = isDark ? "#555" : "#999";
  const subtleBg = isDark ? "#181818" : "#f7f7f7";
  const bg = isDark ? "#111" : "#fff";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (f.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    setFile(f);
    setError("");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setError("");
    try {
      const result = await uploadResume(file);
      setExtractedProjects(result.projects);
      setProjects(result.projects);
      setStatus("success");
      try {
        const dynamicQs = await generateResumeQuestions(result.projects);
        const baseQuestions = QUESTION_BANK_BY_DIFFICULTY[difficulty].filter(
          (q) => q.type !== "resume_deep",
        );
        setQuestions([...baseQuestions, ...dynamicQs]);
      } catch {
        setQuestions(QUESTION_BANK_BY_DIFFICULTY[difficulty]);
      }
    } catch (err: unknown) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process resume. Please try again.",
      );
    }
  };

  const handleSkip = () => {
    const run = async () => {
      setProjects([]);
      let finalQuestions = QUESTION_BANK_BY_DIFFICULTY[difficulty];
      try {
        const aiQuestions = await generateRandomQuestions(difficulty, []);
        if (aiQuestions.length) finalQuestions = aiQuestions;
      } catch {
        // fallback to static bank
      }
      setQuestions(finalQuestions);
      startSession(finalQuestions);
      onStart();
    };
    void run();
  };

  const handleStart = () => {
    const run = async () => {
      let finalQuestions = QUESTION_BANK_BY_DIFFICULTY[difficulty];
      try {
        const aiQuestions = await generateRandomQuestions(
          difficulty,
          extractedProjects,
        );
        if (aiQuestions.length) {
          const resumeQs = aiQuestions.filter((q) => q.type === "resume_deep");
          const nonResumeQs = aiQuestions.filter(
            (q) => q.type !== "resume_deep",
          );
          if (extractedProjects.length > 0 && resumeQs.length < 2) {
            try {
              const dynamicQs =
                await generateResumeQuestions(extractedProjects);
              finalQuestions = [...nonResumeQs, ...dynamicQs];
            } catch {
              finalQuestions = aiQuestions;
            }
          } else {
            finalQuestions = aiQuestions;
          }
        }
      } catch {
        // fallback to static bank
      }
      setQuestions(finalQuestions);
      startSession(finalQuestions);
      onStart();
    };
    void run();
  };

  // ─── Difficulty config ─────────────────────────────────────────────────
  const DIFFICULTIES: {
    level: Difficulty;
    label: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
    qCount: number;
  }[] = [
    {
      level: "easy",
      label: "Easy",
      desc: "Basics, simple DSA, fundamentals",
      icon: <Target size={20} />,
      color: isDark ? "#4ade80" : "#16a34a",
      qCount: QUESTION_BANK_BY_DIFFICULTY.easy.length,
    },
    {
      level: "medium",
      label: "Medium",
      desc: "Standard coding interview style",
      icon: <Zap size={20} />,
      color: isDark ? "#facc15" : "#ca8a04",
      qCount: QUESTION_BANK_BY_DIFFICULTY.medium.length,
    },
    {
      level: "hard",
      label: "Hard",
      desc: "FAANG-level, advanced concepts",
      icon: <Flame size={20} />,
      color: isDark ? "#f87171" : "#dc2626",
      qCount: QUESTION_BANK_BY_DIFFICULTY.hard.length,
    },
  ];

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
        style={{ background: "rgba(0,0,0,0.6)" }}
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
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
      >
        <div className="p-7">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              {step === "difficulty" ? (
                <>
                  <h2 className="text-xl font-bold" style={{ color: text }}>
                    Choose Difficulty
                  </h2>
                  <p className="text-sm mt-1" style={{ color: muted }}>
                    Select your interview intensity level.
                  </p>
                </>
              ) : step === "profile" ? (
                <>
                  <h2 className="text-xl font-bold" style={{ color: text }}>
                    Your profile
                  </h2>
                  <p className="text-sm mt-1" style={{ color: muted }}>
                    Optional — add an email so we can plot your Dashboard
                    history in MongoDB.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold" style={{ color: text }}>
                    Upload Resume
                  </h2>
                  <p className="text-sm mt-1" style={{ color: muted }}>
                    AI extracts your projects for personalised questions.
                  </p>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: muted }}
            >
              <X size={16} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* ── Step 1: Difficulty Picker ── */}
            {step === "difficulty" && (
              <motion.div
                key="difficulty"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.22 }}
                className="space-y-3"
              >
                {DIFFICULTIES.map(
                  ({ level, label, desc, icon, color, qCount }) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-150 text-left"
                      style={{
                        border:
                          difficulty === level
                            ? `2px solid ${color}`
                            : `1px solid ${border}`,
                        background:
                          difficulty === level ? `${color}14` : subtleBg,
                      }}
                    >
                      <span style={{ color }}>{icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-semibold text-sm"
                            style={{ color: text }}
                          >
                            {label}
                          </span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ background: `${color}22`, color }}
                          >
                            {qCount} questions
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: muted }}>
                          {desc}
                        </p>
                      </div>
                      {difficulty === level && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ background: color }}
                        />
                      )}
                    </button>
                  ),
                )}

                <button
                  onClick={() => setStep("profile")}
                  className="w-full mt-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-85 flex items-center justify-center gap-2"
                  style={{ background: text, color: bg }}
                >
                  Continue <ChevronRight size={16} />
                </button>
              </motion.div>
            )}

            {/* ── Profile (optional analytics identity) ── */}
            {step === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label
                    className="flex items-center gap-1.5 text-xs font-semibold"
                    style={{ color: muted }}
                  >
                    <User size={12} /> Display name
                  </label>
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-colors border"
                    style={{
                      borderColor: border,
                      background: subtleBg,
                      color: text,
                      borderWidth: 1,
                    }}
                    autoCapitalize="words"
                    autoCorrect="off"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="flex items-center gap-1.5 text-xs font-semibold"
                    style={{ color: muted }}
                  >
                    <Mail size={12} /> Email for saving reports
                  </label>
                  <input
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="you@university.edu"
                    type="email"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-colors border"
                    style={{
                      borderColor: border,
                      background: subtleBg,
                      color: text,
                      borderWidth: 1,
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setStep("difficulty")}
                  className="text-xs"
                  style={{ color: muted }}
                >
                  ← Back to difficulty
                </button>
                <button
                  type="button"
                  onClick={() => setStep("resume")}
                  className="text-xs py-2 w-full rounded-lg transition-opacity hover:opacity-80 border"
                  style={{
                    borderColor: border,
                    color: muted,
                  }}
                >
                  Skip — anonymous session
                </button>
                <button
                  onClick={() => {
                    setCandidateIdentity({
                      name: profileName.trim(),
                      email: profileEmail.trim(),
                    });
                    setStep("resume");
                  }}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ background: text, color: bg }}
                >
                  Continue to resume <ChevronRight size={16} />
                </button>
              </motion.div>
            )}

            {/* ── Step 2: Resume Upload ── */}
            {step === "resume" && (
              <motion.div
                key="resume"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
              >
                <button
                  type="button"
                  onClick={() => setStep("profile")}
                  className="text-[11px] mb-4 font-medium underline-offset-2 hover:underline"
                  style={{ color: muted }}
                >
                  ← Back to profile & identity
                </button>
                {/* Upload Zone */}
                {status !== "success" && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl p-8 text-center cursor-pointer transition-all duration-150"
                    style={{
                      border: `2px dashed ${isDragging ? text : file ? border : border}`,
                      background: isDragging
                        ? subtleBg
                        : file
                          ? subtleBg
                          : "transparent",
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files?.[0] && handleFile(e.target.files[0])
                      }
                    />
                    {file ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={36} style={{ color: text }} />
                        <p
                          className="font-medium text-sm"
                          style={{ color: text }}
                        >
                          {file.name}
                        </p>
                        <p className="text-xs" style={{ color: muted }}>
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={32} style={{ color: muted }} />
                        <p
                          className="font-medium text-sm"
                          style={{ color: text }}
                        >
                          Drop PDF here or click to browse
                        </p>
                        <span
                          className="text-xs px-3 py-1 rounded-full"
                          style={{
                            background: subtleBg,
                            color: muted,
                            border: `1px solid ${border}`,
                          }}
                        >
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
                {status === "success" && extractedProjects.length > 0 && (
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
                          style={{
                            background: subtleBg,
                            border: `1px solid ${border}`,
                          }}
                        >
                          <div
                            className="font-semibold text-sm"
                            style={{ color: text }}
                          >
                            {p.name}
                          </div>
                          <div
                            className="text-sm mt-1"
                            style={{ color: muted }}
                          >
                            {p.description}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(Array.isArray(p.technologies)
                              ? p.technologies
                              : typeof p.technologies === "string"
                                ? (p.technologies as string)
                                    .split(",")
                                    .map((s) => s.trim())
                                : []
                            ).map((t) => (
                              <span
                                key={t}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  background: isDark ? "#222" : "#efefef",
                                  color: muted,
                                  border: `1px solid ${border}`,
                                }}
                              >
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
                  {status === "success" ? (
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
                      disabled={!file || status === "uploading"}
                      className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ background: text, color: bg }}
                    >
                      {status === "uploading" ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />{" "}
                          Analysing Resume...
                        </>
                      ) : (
                        <>
                          <Upload size={16} /> Analyse Resume
                        </>
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

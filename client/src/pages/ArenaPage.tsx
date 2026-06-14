import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useInterview } from "../context/InterviewContext";
import { useTimer } from "../hooks/useTimer";
import { useAntiCheat } from "../hooks/useAntiCheat";
import ChatPanel from "../components/ChatPanel";
import QuestionPanel from "../components/QuestionPanel";
import CodingPanel from "../components/CodingPanel";
import ProctorOverlay from "../components/ProctorOverlay";
import { Clock, AlertTriangle, Wifi, Waves } from "lucide-react";
import { speakInterviewerText } from "../utils/speechOut";

const INTERVIEW_DURATION = 60 * 60;

const C = {
  bg: "#050505",
  sidebar: "#0C0C0C",
  border: "#1F1F1F",
  header: "#0C0C0C",
  centerBg: "#050505",
  text: "#F5F5F5",
  muted: "#A3A3A3",
  blue: "#FFFFFF",
  green: "#10b981",
  red: "#ef4444",
  yellow: "#f59e0b",
};

export default function ArenaPage() {
  const navigate = useNavigate();
  const {
    currentQuestion,
    currentIndex,
    questions,
    sessionStarted,
    startSession,
    endSession,
    getSessionData,
    tabSwitchCount,
    incrementTabSwitch,
    setTerminated,
    incrementFaceViolation,
    incrementNoiseAlert,
    noiseAlertCount,
  } = useInterview();
  const videoRef = useRef<HTMLVideoElement>(null);
  const gazeInitRef = useRef(false);

  const handleExpire = () => endSession(false, INTERVIEW_DURATION);

  const {
    secondsLeft,
    start: startTimer,
    formatTime,
    urgency,
    getElapsedSeconds,
  } = useTimer({
    initialSeconds: INTERVIEW_DURATION,
    onExpire: handleExpire,
  });

  const handleTerminate = useCallback(() => {
    endSession(true, getElapsedSeconds());
    setTerminated(true);
    navigate("/results", { state: getSessionData() });
  }, [endSession, getElapsedSeconds, setTerminated, navigate, getSessionData]);

  const {
    warningType,
    presenceReason,
    cameraBlocked,
    dismissWarning,
    initWebcam,
    initGazeDetection,
  } = useAntiCheat({
    onTerminate: handleTerminate,
    onTabSwitch: incrementTabSwitch,
    onPresenceIssue: () => incrementFaceViolation(),
    onNoiseAlert: () => incrementNoiseAlert(),
    enabled: sessionStarted,
    tabSwitchCount,
    MAX_TAB_SWITCHES: 5,
  });

  useEffect(() => {
    if (!sessionStarted || !currentQuestion?.id) return;
    const line =
      currentQuestion.question.split("\n")[0]?.replace(/\*\*/g, "") ?? "";
    const prefix =
      currentQuestion.type === "behavioral"
        ? "Here's your behavioral prompt."
        : "Next question.";
    speakInterviewerText(`${prefix} ${line}`);
  }, [currentQuestion?.id, currentQuestion?.type, sessionStarted]);
  useEffect(() => {
    if (!sessionStarted) startSession();
    startTimer();
  }, []);

  useEffect(() => {
    if (!sessionStarted) return;

    let attempts = 0;
    let busy = false;
    const interval = setInterval(async () => {
      if (!videoRef.current || gazeInitRef.current || busy) return;
      busy = true;
      const ok = await initWebcam(videoRef.current);
      if (ok) {
        gazeInitRef.current = true;
        clearInterval(interval);
        if (videoRef.current) await initGazeDetection(videoRef.current);
      } else {
        attempts++;
        if (attempts > 20) clearInterval(interval); // Give up after 10s
      }
      busy = false;
    }, 500);

    return () => clearInterval(interval);
  }, [sessionStarted, initWebcam, initGazeDetection]);

  const handleFinish = () => {
    endSession(false, getElapsedSeconds());
    navigate("/results", { state: getSessionData() });
  };

  const timerColor =
    urgency === "critical" ? C.red : urgency === "warning" ? C.yellow : C.text;

  // Coding panel only shown for DSA questions
  const isCodingQuestion = currentQuestion?.type === "dsa";

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        background: C.bg,
        color: C.text,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Header ── */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-5 py-2.5"
        style={{
          background: C.header,
          borderBottom: `1px solid ${C.border}`,
          height: 52,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(100deg, #FFFFFF, #737373, #E5E5E5)" }}
          >
            <span className="text-xs font-black" style={{ color: "#050505" }}>AI</span>
          </div>
          <span className="font-semibold text-sm" style={{ color: C.text }}>
            InterviewAI
          </span>
          {tabSwitchCount > 0 && (
            <span
              className="text-xs flex items-center gap-1 ml-2"
              style={{ color: C.red }}
            >
              <AlertTriangle size={11} />
              {tabSwitchCount}/5 tab switches
            </span>
          )}
          {noiseAlertCount > 0 && (
            <span
              className="text-[10px] flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full"
              style={{ color: "#a3a3a3", border: `1px solid ${C.border}` }}
              title="We noticed sustained loud background noise. This is logged only to help reviewers understand conditions — not as a punishment."
            >
              <Waves size={11} aria-hidden />
              Ambient noted
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-2 font-mono text-xl font-bold"
          style={{ color: timerColor }}
        >
          {urgency !== "normal" && (
            <AlertTriangle size={16} className="animate-pulse" />
          )}
          <Clock size={16} style={{ opacity: 0.7 }} />
          {formatTime(secondsLeft)}
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 text-xs"
            style={{ color: C.green }}
          >
            <Wifi size={12} />
            <span>Live</span>
          </div>
          <button
            onClick={handleFinish}
            className="text-xs px-4 py-1.5 rounded-md font-bold hover:opacity-90 transition-opacity"
            style={{
              background: "#ffffff",
              color: "#050505",
            }}
          >
            Submit Assessment
          </button>
          <button
            onClick={handleTerminate}
            className="text-xs px-3 py-1.5 rounded-md font-medium hover:opacity-80 transition-opacity"
            style={{
              background: "#1f1f1f",
              color: C.red,
              border: `1px solid #3a1a1a`,
            }}
          >
            End
          </button>
        </div>
      </header>

      {/* Question progress */}
      <div className="flex-shrink-0 h-[3px] w-full" style={{ background: C.border }}>
        <div
          className="h-full transition-[width] duration-500"
          style={{
            width: `${((currentIndex + 1) / Math.max(questions.length, 1)) * 100}%`,
            backgroundImage: "linear-gradient(100deg,#FFFFFF,#737373,#E5E5E5)",
          }}
        />
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: question list */}
        <aside
          className="flex-shrink-0 flex flex-col overflow-y-auto"
          style={{
            width: isCodingQuestion ? 220 : 240,
            background: C.sidebar,
            borderRight: `1px solid ${C.border}`,
          }}
        >
          <QuestionPanel />
        </aside>

        {isCodingQuestion ? (
          /* ── DSA: original 3-column layout ── */
          <>
            {/* Center: question detail + AI chat */}
            <div
              className="flex flex-col overflow-hidden"
              style={{
                flex: "0 0 400px",
                borderRight: `1px solid ${C.border}`,
                background: C.centerBg,
              }}
            >
              <div
                className="flex-1 overflow-y-auto"
                style={{ borderBottom: `1px solid ${C.border}` }}
              >
                <QuestionDetail />
              </div>
              <div
                style={{ height: "42%" }}
                className="overflow-hidden flex flex-col"
              >
                <ChatPanel />
              </div>
            </div>

            {/* Right: code editor + console */}
            <div
              className="flex-1 flex flex-col overflow-hidden"
              style={{ background: "#0A0C12" }}
            >
              <CodingPanel />
            </div>
          </>
        ) : (
          /* ── Non-coding: Single column matching DSA center layout ── */
          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{ background: C.centerBg }}
          >
            <div
              className="flex-1 overflow-y-auto"
              style={{ borderBottom: `1px solid ${C.border}` }}
            >
              <div className="max-w-4xl mx-auto w-full h-full p-4">
                <QuestionDetail />
              </div>
            </div>
            <div
              style={{ height: "42%" }}
              className="overflow-hidden flex flex-col border-t border-[#1C2129] bg-[#0C0E15]"
            >
              <div className="max-w-4xl mx-auto w-full h-full border-x border-[#1C2129]">
                <ChatPanel />
              </div>
            </div>
          </div>
        )}
      </div>

      <ProctorOverlay
        videoRef={videoRef}
        warningType={warningType}
        presenceReason={presenceReason}
        cameraBlocked={cameraBlocked}
        tabSwitchCount={tabSwitchCount}
        onDismiss={dismissWarning}
        onTerminate={handleTerminate}
      />
    </div>
  );
}

// ── Question Detail for center panel ─────────────────────────────────
function QuestionDetail({ isCentered }: { isCentered?: boolean }) {
  const {
    currentQuestion,
    currentIndex,
    questions,
    sendMessage,
    goNextQuestion,
    submitMCQ,
  } = useInterview();
  const [selectedMCQ, setSelectedMCQ] = useState<string | null>(null);
  const [mcqResult, setMcqResult] = useState<"correct" | "incorrect" | null>(
    null,
  );
  const [textAnswer, setTextAnswer] = useState("");

  useEffect(() => {
    setTextAnswer("");
    setSelectedMCQ(null);
    setMcqResult(null);
  }, [currentQuestion?.id]);

  if (!currentQuestion) {
    return (
      <div className="p-6 text-sm text-center" style={{ color: "#888" }}>
        All questions completed. Submit your assessment when ready.
      </div>
    );
  }

  const sendHint = (type: string) => {
    sendMessage(
      `${type} for this question: ${currentQuestion.question.substring(0, 100)}`,
    );
  };

  const handleMCQSelect = (opt: string) => {
    if (mcqResult) return;
    setSelectedMCQ(opt);
  };

  const getProfessionalFeedback = (
    isCorrect: boolean,
    explanation?: string,
  ) => {
    if (isCorrect) {
      const praises = [
        "Excellent work. That is precisely correct.",
        "Impressive choice. You've clearly grasped the core concept here.",
        "Correct. Your reasoning aligns perfectly with industry best practices.",
        "That's exactly right. Well reasoned.",
      ];
      return `${praises[Math.floor(Math.random() * praises.length)]} ${explanation || ""}`;
    } else {
      const critiques = [
        "I'm afraid that's not quite right.",
        "Not exactly. In a production environment, this approach might lead to complications.",
        "That's incorrect. Let's look at why.",
        "I see your line of thinking, but it doesn't quite apply here.",
      ];
      const correctHint = currentQuestion.correctAnswer
        ? `The correct answer is "${currentQuestion.correctAnswer}".`
        : "";
      return `${critiques[Math.floor(Math.random() * critiques.length)]} ${correctHint} ${explanation || ""}`;
    }
  };

  const handleMCQSubmit = () => {
    if (!selectedMCQ) return;
    const correct = submitMCQ(selectedMCQ);
    setMcqResult(correct ? "correct" : "incorrect");

    const feedback = getProfessionalFeedback(
      correct,
      currentQuestion.explanation,
    );
    sendMessage(feedback.substring(0, 400)).then(() => {
      setTimeout(() => {
        setSelectedMCQ(null);
        setMcqResult(null);
        goNextQuestion();
      }, 3000);
    });
  };

  const handleBehavioralSubmit = async () => {
    if (!textAnswer.trim()) return;
    await sendMessage(`STAR-style reflection:\n${textAnswer}`, {
      currentQuestion: currentQuestion.question,
      questionType: "behavioral",
    });
    setTextAnswer("");
    goNextQuestion();
  };

  const handleTextSubmit = () => {
    if (!textAnswer.trim()) return;
    const isCorrect =
      textAnswer.trim().toLowerCase() ===
      (currentQuestion.correctAnswer || "").toLowerCase();
    setMcqResult(isCorrect ? "correct" : "incorrect");

    const feedback = getProfessionalFeedback(
      isCorrect,
      currentQuestion.explanation,
    );
    sendMessage(feedback.substring(0, 400)).then(() => {
      setTimeout(() => {
        setTextAnswer("");
        setMcqResult(null);
        goNextQuestion();
      }, 3500);
    });
  };

  const typeLabel: Record<string, string> = {
    mcq: "Multiple Choice",
    output_guess: "Guess the Output",
    debugging: "Debug the Code",
    dsa: "DSA Problem",
    resume_deep: "Resume Deep-Dive",
    behavioral: "Behavioral (STAR)",
  };

  // Render question text — parse markdown-ish bold and bullets
  const renderText = (text: string) =>
    text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**"))
        return (
          <p
            key={i}
            className="font-bold text-sm mt-2"
            style={{ color: "#e5e5e5" }}
          >
            {line.replace(/\*\*/g, "")}
          </p>
        );
      if (line.startsWith("- "))
        return (
          <li
            key={i}
            className="ml-3 list-disc text-xs"
            style={{ color: "#aaa" }}
          >
            {line.slice(2)}
          </li>
        );
      if (line.trim() === "") return <div key={i} className="h-1.5" />;
      return (
        <p
          key={i}
          className="text-sm leading-relaxed"
          style={{ color: "#c9c9c9" }}
        >
          {line}
        </p>
      );
    });

  const [titleLine, ...bodyLines] = currentQuestion.question.split("\n");

  return (
    <div
      className={`p-6 space-y-4 ${isCentered ? "max-h-[85vh] overflow-y-auto" : ""}`}
    >
      {/* Badge + title */}
      <div className={isCentered ? "text-center" : ""}>
        <span
          className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded mb-2 inline-block"
          style={{ background: "rgba(255, 255, 255, 0.08)", color: "#FFFFFF" }}
        >
          {typeLabel[currentQuestion.type] || currentQuestion.type}
        </span>
        <h2
          className="text-sm font-bold leading-snug"
          style={{ color: "#e5e5e5" }}
        >
          {titleLine.replace(/\*\*/g, "")}
        </h2>
      </div>

      {/* Question body */}
      <div className={`space-y-1 ${isCentered ? "text-center" : ""}`}>
        {renderText(bodyLines.join("\n"))}
      </div>

      {/* Code block */}
      {currentQuestion.code && (
        <div
          className="rounded-md overflow-hidden"
          style={{ background: "#0C0C0C", border: "1px solid #1F1F1F" }}
        >
          <div
            className="px-3 py-2 flex items-center gap-1.5"
            style={{ borderBottom: "1px solid #1F1F1F" }}
          >
            {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
              <div
                key={c}
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: c, opacity: 0.7 }}
              />
            ))}
          </div>
          <pre
            className="p-4 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap"
            style={{ color: "#E5E5E5" }}
          >
            {currentQuestion.code}
          </pre>
        </div>
      )}

      {/* MCQ options */}
      {currentQuestion.type === "mcq" && currentQuestion.options && (
        <div className="space-y-2">
          {currentQuestion.options.map((opt, i) => {
            const isSelected = selectedMCQ === opt;
            const isCorrect = !!(
              mcqResult && opt === currentQuestion.correctAnswer
            );
            const isWrong = mcqResult === "incorrect" && isSelected;
            return (
              <button
                key={i}
                onClick={() => handleMCQSelect(opt)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center gap-2.5 transition-colors"
                style={{
                  background: isCorrect
                    ? "rgba(16,185,129,0.1)"
                    : isWrong
                      ? "rgba(239,68,68,0.1)"
                      : isSelected
                        ? "rgba(255,255,255,0.06)"
                        : "#0C0C0C",
                  border: `1px solid ${isCorrect ? "#10b981" : isWrong ? "#ef4444" : isSelected ? "#FFFFFF" : "#1F1F1F"}`,
                  color: isCorrect
                    ? "#86efac"
                    : isWrong
                      ? "#fca5a5"
                      : isSelected
                        ? "#FFFFFF"
                        : "#F5F5F5",
                }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{
                    background: isSelected ? "#FFFFFF" : "#1F1F1F",
                    color: isSelected ? "#050505" : "#A3A3A3",
                  }}
                >
                  {["A", "B", "C", "D"][i]}
                </span>
                {opt}
              </button>
            );
          })}
          <button
            onClick={handleMCQSubmit}
            disabled={!selectedMCQ || !!mcqResult}
            className="mt-1 w-full py-2.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-30"
            style={{ background: "#FFFFFF", color: "#050505" }}
          >
            {mcqResult === "correct"
              ? "✅ Correct"
              : mcqResult === "incorrect"
                ? "❌ Incorrect"
                : "Submit Answer"}
          </button>
        </div>
      )}

      {currentQuestion.type === "behavioral" && (
        <div className="space-y-3">
          <p className="text-[11px] leading-snug" style={{ color: "#888" }}>
            Share a concise STAR story (Situation, Task, Action, Result). You
            can dictate into the mic in the chat bar or type below.
          </p>
          <textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder="Situation… Task… Action… Result…"
            className="w-full bg-[#0C0C0C] border border-[#1F1F1F] rounded-lg p-3 text-xs text-[#ccc] outline-none focus:border-[#FFFFFF] transition-colors resize-none"
            rows={5}
          />
          <button
            type="button"
            onClick={() => handleBehavioralSubmit()}
            disabled={!textAnswer.trim()}
            className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all shadow-lg active:scale-[0.98] disabled:opacity-30"
            style={{ background: "#FFFFFF", color: "#050505" }}
          >
            Share reflection & continue
          </button>
        </div>
      )}

      {/* Text input for Debug/Output guess */}
      {(currentQuestion.type === "output_guess" ||
        currentQuestion.type === "debugging") &&
        !currentQuestion.options && (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder={
                  currentQuestion.type === "output_guess"
                    ? "What will be the output?..."
                    : "Provide the fix or corrected code..."
                }
                className="w-full bg-[#0C0C0C] border border-[#1F1F1F] rounded-lg p-3 text-xs text-[#ccc] outline-none focus:border-[#FFFFFF] transition-colors resize-none"
                rows={3}
              />
            </div>
            <button
              onClick={handleTextSubmit}
              disabled={!textAnswer.trim() || !!mcqResult}
              className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all shadow-lg active:scale-[0.98] disabled:opacity-30"
              style={{ background: "#FFFFFF", color: "#050505" }}
            >
              {mcqResult === "correct"
                ? "✅ Correct"
                : mcqResult === "incorrect"
                  ? "❌ Incorrect"
                  : "Submit Answer"}
            </button>
          </div>
        )}

      {/* Hint buttons */}
      {currentQuestion.type !== "behavioral" && (
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            {
              label: "⚡ Help with Mistake",
              hint: "Help me identify the mistake",
            },
            { label: "💡 Give Hint", hint: "Give me a hint" },
            { label: "ℹ Explain Constraint", hint: "Explain the constraint" },
          ].map((btn) => (
            <button
              key={btn.hint}
              onClick={() => sendHint(btn.hint)}
              className="text-xs px-3 py-1.5 rounded-md hover:opacity-70 transition-opacity"
              style={{
                background: "#161A22",
                color: "#aaa",
                border: "1px solid #333",
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* DSA note */}
      {currentQuestion.type === "dsa" && (
        <div
          className="text-xs p-3 rounded-md"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "#A3A3A3",
          }}
        >
          💡 Write your solution in the code editor on the right. Click{" "}
          <strong>Submit</strong> when ready.
        </div>
      )}

      {/* Follow-up (resume) */}
      {currentQuestion.followUp && (
        <div className="text-xs italic" style={{ color: "#666" }}>
          Follow-up: {currentQuestion.followUp}
        </div>
      )}

      {/* Skip */}
      {currentIndex < questions.length - 1 && (
        <button
          onClick={goNextQuestion}
          className="text-xs hover:opacity-80 transition-opacity"
          style={{ color: "#FFFFFF" }}
        >
          Skip to next →
        </button>
      )}
    </div>
  );
}

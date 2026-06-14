import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, TabletSmartphone, ShieldX } from "lucide-react";
import { PresenceReason, WarningType } from "../hooks/useAntiCheat";

interface ProctorOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  warningType: WarningType;
  presenceReason: PresenceReason;
  cameraBlocked: boolean;
  tabSwitchCount: number;
  onDismiss: () => void;
  onTerminate: () => void;
}

export default function ProctorOverlay({
  videoRef,
  warningType,
  presenceReason,
  cameraBlocked,
  tabSwitchCount,
  onDismiss,
  onTerminate,
}: ProctorOverlayProps) {
  const MAX_SWITCHES = 5;
  const switchesLeft = MAX_SWITCHES - tabSwitchCount;

  return (
    <>
      {/* PIP Webcam Feed */}
      <div className="fixed bottom-4 right-4 z-[9999] group">
        <div className="w-40 h-28 rounded-2xl overflow-hidden border-2 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.08)] relative bg-black">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1] block"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "96px",
              minWidth: "96px",
            }}
          />
          {/* Proctoring indicator */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-full px-2 py-1 border border-white/10">
            <span
              className={`w-1.5 h-1.5 rounded-full ${tabSwitchCount > 0 ? "bg-red-500 animate-pulse" : "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"}`}
            />
            <span className="text-[10px] font-bold font-mono text-white/90">
              {tabSwitchCount > 0
                ? `⚠ ${tabSwitchCount}/${MAX_SWITCHES}`
                : "LIVE"}
            </span>
          </div>
          {/* Corner branding */}
          <div className="absolute bottom-1.5 right-2 text-[8px] font-black text-white/20 tracking-widest uppercase">
            Secure
          </div>
        </div>
        {cameraBlocked && (
          <p className="text-[10px] text-center text-amber-400 mt-1">
            Camera blocked. Allow webcam permission and refresh.
          </p>
        )}
        <p className="text-[10px] text-center text-[#888] mt-1.5 font-bold tracking-wide uppercase">
          AI Proctor Active
        </p>
      </div>

      {/* Warning Modals */}
      <AnimatePresence>
        {warningType === "presence" && presenceReason && (
          <PresenceCheckModal reason={presenceReason} onDismiss={onDismiss} />
        )}
        {warningType === "tab" && tabSwitchCount < MAX_SWITCHES && (
          <TabWarningModal
            switchCount={tabSwitchCount}
            switchesLeft={switchesLeft}
            onDismiss={onDismiss}
          />
        )}
        {tabSwitchCount >= MAX_SWITCHES && (
          <TerminateModal onTerminate={onTerminate} />
        )}
      </AnimatePresence>
    </>
  );
}

function PresenceCheckModal({
  reason,
  onDismiss,
}: {
  reason: "missing" | "multiple";
  onDismiss: () => void;
}) {
  const multiple = reason === "multiple";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
      <motion.div
        className={`relative z-10 max-w-md w-full mx-4 rounded-3xl border shadow-2xl p-8 text-center bg-[var(--card)] ${
          multiple
            ? "border-sky-400/35 shadow-sky-500/10"
            : "border-amber-300/40 shadow-amber-500/10"
        }`}
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        transition={{ type: "spring", damping: 22, stiffness: 320 }}
      >
        <div
          className={`w-14 h-14 rounded-full border flex items-center justify-center mx-auto mb-4 ${
            multiple
              ? "bg-sky-500/10 border-sky-400/40"
              : "bg-amber-400/10 border-amber-300/40"
          }`}
        >
          <Users
            size={26}
            className={multiple ? "text-sky-300" : "text-amber-200"}
          />
        </div>
        <h2 className="text-lg font-semibold text-[var(--text)] mb-2">
          Quick workspace check-in
        </h2>
        <p className="text-[var(--text-muted)] text-sm mb-6 leading-relaxed">
          {multiple
            ? "We briefly detected more than one person in frame — if someone walked by or you're mentoring, that's okay. We're just making sure we're evaluating the right person's focus."
            : "We're having trouble seeing you clearly — try centering yourself in the webcam view and easing any glare. This doesn't affect scoring on its own; it only helps reviewers understand session context."}
        </p>
        <button
          onClick={onDismiss}
          className={`w-full py-3 rounded-xl font-semibold transition-colors ${
            multiple
              ? "bg-sky-600 text-white hover:bg-sky-500"
              : "bg-amber-400/90 text-black hover:bg-amber-300"
          }`}
        >
          Okay — I'll adjust
        </button>
      </motion.div>
    </motion.div>
  );
}

function TabWarningModal({
  switchCount,
  switchesLeft,
  onDismiss,
}: {
  switchCount: number;
  switchesLeft: number;
  onDismiss: () => void;
}) {
  const isLastWarning = switchesLeft === 1;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onDismiss}
      />
      <motion.div
        className={`relative z-10 max-w-md w-full mx-4 bg-[var(--card)] rounded-3xl border-2 ${
          isLastWarning
            ? "border-red-500/60 shadow-red-500/15"
            : "border-orange-400/50 shadow-orange-400/10"
        } shadow-2xl p-8 text-center`}
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        <div
          className={`w-16 h-16 rounded-full ${isLastWarning ? "bg-red-500/10 border-red-500/40" : "bg-orange-400/10 border-orange-400/40"} border-2 flex items-center justify-center mx-auto mb-4`}
        >
          <TabletSmartphone
            size={28}
            className={isLastWarning ? "text-red-400" : "text-orange-400"}
          />
        </div>
        <h2 className="text-xl font-bold text-[var(--text)] mb-2">
          {isLastWarning
            ? "🚨 Final Warning!"
            : `Tab Switch Detected (${switchCount}/${5})`}
        </h2>
        <p className="text-[var(--text-muted)] text-sm mb-2">
          You switched tabs or left the interview window. This is being
          recorded.
        </p>
        {isLastWarning ? (
          <p className="text-xs text-red-400 mb-6 font-semibold">
            ⚠️ ONE MORE TAB SWITCH WILL AUTOMATICALLY TERMINATE YOUR INTERVIEW.
          </p>
        ) : (
          <p className="text-xs text-orange-400 mb-6">
            You have {switchesLeft} warning{switchesLeft !== 1 ? "s" : ""}{" "}
            remaining before forced termination.
          </p>
        )}
        <button
          onClick={onDismiss}
          className={`w-full py-3 rounded-xl font-bold transition-colors ${
            isLastWarning
              ? "bg-red-500 text-white hover:bg-red-400"
              : "bg-orange-400 text-black hover:bg-orange-300"
          }`}
        >
          I Understand — Return to Interview
        </button>
      </motion.div>
    </motion.div>
  );
}

function TerminateModal({ onTerminate }: { onTerminate: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onTerminate, 5000);
    return () => clearTimeout(timer);
  }, [onTerminate]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="max-w-lg w-full mx-4 text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center mx-auto mb-6">
          <ShieldX size={36} className="text-red-400" />
        </div>
        <h1 className="text-3xl font-black text-red-400 mb-3">
          Interview Terminated
        </h1>
        <p className="text-gray-400 mb-2">
          You exceeded the maximum allowed tab switches (5/5).
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Your session has been auto-submitted. You will be redirected to your
          results shortly.
        </p>
        <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-red-500 rounded-full"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 5, ease: "linear" }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Redirecting to results in 5 seconds...
        </p>
        <button
          onClick={onTerminate}
          className="mt-6 px-8 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors font-semibold text-sm"
        >
          Go to Results Now
        </button>
      </motion.div>
    </motion.div>
  );
}

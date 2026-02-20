import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Eye, TabletSmartphone, X, ShieldX } from 'lucide-react';
import { WarningType } from '../hooks/useAntiCheat';

interface ProctorOverlayProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    warningType: WarningType;
    tabSwitchCount: number;
    onDismiss: () => void;
    onTerminate: () => void;
}

export default function ProctorOverlay({
    videoRef,
    warningType,
    tabSwitchCount,
    onDismiss,
    onTerminate,
}: ProctorOverlayProps) {
    const MAX_SWITCHES = 5;
    const switchesLeft = MAX_SWITCHES - tabSwitchCount;

    return (
        <>
            {/* PIP Webcam Feed */}
            <div className="fixed bottom-4 right-4 z-40 group">
                <div className="w-36 h-24 rounded-2xl overflow-hidden border-2 dark:border-electric-cyan/40 border-apple-blue/40 shadow-xl dark:shadow-electric-cyan/10 relative bg-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover scale-x-[-1]"
                    />
                    {/* Proctoring indicator */}
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 rounded-full px-1.5 py-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${tabSwitchCount > 0 ? 'bg-red-400 animate-pulse' : 'bg-green-400 animate-pulse'}`} />
                        <span className="text-[9px] font-mono text-white/80">
                            {tabSwitchCount > 0 ? `⚠ ${tabSwitchCount}/${MAX_SWITCHES}` : 'LIVE'}
                        </span>
                    </div>
                    {/* Eye icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye size={20} className="text-white/70" />
                    </div>
                </div>
                <p className="text-[9px] text-center text-[var(--text-muted)] mt-1 font-mono">Proctored</p>
            </div>

            {/* Warning Modals */}
            <AnimatePresence>
                {warningType === 'gaze' && (
                    <GazeWarningModal onDismiss={onDismiss} />
                )}
                {warningType === 'tab' && tabSwitchCount < MAX_SWITCHES && (
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

function GazeWarningModal({ onDismiss }: { onDismiss: () => void }) {
    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onDismiss} />
            <motion.div
                className="relative z-10 max-w-md w-full mx-4 bg-[var(--card)] rounded-3xl border-2 border-yellow-400/50 shadow-2xl shadow-yellow-400/10 p-8 text-center"
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
                <div className="w-16 h-16 rounded-full bg-yellow-400/10 border-2 border-yellow-400/40 flex items-center justify-center mx-auto mb-4">
                    <Eye size={28} className="text-yellow-400" />
                </div>
                <h2 className="text-xl font-bold text-[var(--text)] mb-2">Please Look at the Screen</h2>
                <p className="text-[var(--text-muted)] text-sm mb-2">
                    Our proctoring system detected that you looked away from the screen for more than 5 seconds.
                </p>
                <p className="text-xs text-yellow-500 mb-6">
                    Repeated violations may result in automatic test termination.
                </p>
                <button
                    onClick={onDismiss}
                    className="w-full py-3 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors"
                >
                    I Understand — Resume Interview
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
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onDismiss} />
            <motion.div
                className={`relative z-10 max-w-md w-full mx-4 bg-[var(--card)] rounded-3xl border-2 ${isLastWarning ? 'border-red-500/60 shadow-red-500/15' : 'border-orange-400/50 shadow-orange-400/10'
                    } shadow-2xl p-8 text-center`}
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
                <div className={`w-16 h-16 rounded-full ${isLastWarning ? 'bg-red-500/10 border-red-500/40' : 'bg-orange-400/10 border-orange-400/40'} border-2 flex items-center justify-center mx-auto mb-4`}>
                    <TabletSmartphone size={28} className={isLastWarning ? 'text-red-400' : 'text-orange-400'} />
                </div>
                <h2 className="text-xl font-bold text-[var(--text)] mb-2">
                    {isLastWarning ? '🚨 Final Warning!' : `Tab Switch Detected (${switchCount}/${5})`}
                </h2>
                <p className="text-[var(--text-muted)] text-sm mb-2">
                    You switched tabs or left the interview window. This is being recorded.
                </p>
                {isLastWarning ? (
                    <p className="text-xs text-red-400 mb-6 font-semibold">
                        ⚠️ ONE MORE TAB SWITCH WILL AUTOMATICALLY TERMINATE YOUR INTERVIEW.
                    </p>
                ) : (
                    <p className="text-xs text-orange-400 mb-6">
                        You have {switchesLeft} warning{switchesLeft !== 1 ? 's' : ''} remaining before forced termination.
                    </p>
                )}
                <button
                    onClick={onDismiss}
                    className={`w-full py-3 rounded-xl font-bold transition-colors ${isLastWarning
                        ? 'bg-red-500 text-white hover:bg-red-400'
                        : 'bg-orange-400 text-black hover:bg-orange-300'
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
                <h1 className="text-3xl font-black text-red-400 mb-3">Interview Terminated</h1>
                <p className="text-gray-400 mb-2">
                    You exceeded the maximum allowed tab switches (5/5).
                </p>
                <p className="text-gray-500 text-sm mb-8">
                    Your session has been auto-submitted. You will be redirected to your results shortly.
                </p>
                <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                        className="h-full bg-red-500 rounded-full"
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 5, ease: 'linear' }}
                    />
                </div>
                <p className="text-xs text-gray-600 mt-2">Redirecting to results in 5 seconds...</p>
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

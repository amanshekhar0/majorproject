import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import ResumeModal from '../components/ResumeModal';

// ─── Trailing Cursor Orbs ────────────────────────────────────────────────────
const TRAIL_COUNT = 7;

function CursorTrail({ dark }: { dark: boolean }) {
    const trails = Array.from({ length: TRAIL_COUNT }, (_, i) => ({
        x: useMotionValue(-100),
        y: useMotionValue(-100),
        delay: i * 0.04,
    }));

    // Springs per orb — each one slightly looser than the last
    const springs = trails.map((t, i) => ({
        x: useSpring(t.x, { stiffness: 180 - i * 18, damping: 22 + i * 1.5, mass: 0.4 }),
        y: useSpring(t.y, { stiffness: 180 - i * 18, damping: 22 + i * 1.5, mass: 0.4 }),
        size: 10 - i * 0.9,
        opacity: 0.55 - i * 0.06,
    }));

    const handleMove = useCallback((e: MouseEvent) => {
        trails.forEach(t => { t.x.set(e.clientX); t.y.set(e.clientY); });
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, [handleMove]);

    return (
        <>
            {springs.map((s, i) => (
                <motion.div
                    key={i}
                    className="pointer-events-none fixed top-0 left-0 rounded-full z-[9999]"
                    style={{
                        x: s.x,
                        y: s.y,
                        width: s.size,
                        height: s.size,
                        translateX: `-50%`,
                        translateY: `-50%`,
                        // Dark mode: white dots with mix-blend-difference (inverts bg)
                        // Light mode: rich indigo dots — classy and clearly visible
                        background: dark ? '#fff' : '#4338ca',
                        mixBlendMode: dark ? 'difference' : 'normal',
                        opacity: dark ? s.opacity : (0.7 - i * 0.07),
                    }}
                />
            ))}
        </>
    );
}

// ─── Large spotlight glow ────────────────────────────────────────────────────
function SpotlightGlow({ dark }: { dark: boolean }) {
    const glowRef = useRef<HTMLDivElement>(null);
    const mouse = useRef({ x: -600, y: -600 });
    const cur = useRef({ x: -600, y: -600 });
    const raf = useRef<number>(0);

    useEffect(() => {
        const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
        window.addEventListener('mousemove', onMove);
        const tick = () => {
            cur.current.x += (mouse.current.x - cur.current.x) * 0.06;
            cur.current.y += (mouse.current.y - cur.current.y) * 0.06;
            if (glowRef.current) {
                glowRef.current.style.transform = `translate(${cur.current.x - 350}px, ${cur.current.y - 350}px)`;
            }
            raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf.current); };
    }, []);

    return (
        <div
            ref={glowRef}
            className="pointer-events-none fixed top-0 left-0 z-0 will-change-transform"
            style={{
                width: 700,
                height: 700,
                borderRadius: '50%',
                background: dark
                    ? 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 40%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(67,56,202,0.08) 0%, rgba(99,102,241,0.04) 45%, transparent 70%)',
            }}
        />
    );
}

// ─── Magnetic button ─────────────────────────────────────────────────────────
function MagneticButton({
    children, onClick, primary, dark, style: extStyle,
}: {
    children: React.ReactNode;
    onClick?: () => void;
    primary?: boolean;
    dark: boolean;
    style?: React.CSSProperties;
}) {
    const btnRef = useRef<HTMLButtonElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 200, damping: 18 });
    const sy = useSpring(y, { stiffness: 200, damping: 18 });

    const bg = dark ? '#fff' : '#000';
    const fg = dark ? '#000' : '#fff';
    const ghostBg = 'transparent';
    const ghostFg = dark ? '#666' : '#888';
    const border = dark ? '#333' : '#ddd';

    const onMove = (e: React.MouseEvent) => {
        const rect = btnRef.current!.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        x.set((e.clientX - cx) * 0.28);
        y.set((e.clientY - cy) * 0.28);
    };
    const onLeave = () => { x.set(0); y.set(0); };

    return (
        <motion.button
            ref={btnRef}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            onClick={onClick}
            whileTap={{ scale: 0.96 }}
            className="px-7 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-85 select-none"
            style={{
                x: sx, y: sy,
                background: primary ? bg : ghostBg,
                color: primary ? fg : ghostFg,
                border: primary ? 'none' : `1px solid ${border}`,
                cursor: 'none',
                ...extStyle,
            }}
        >
            {children}
        </motion.button>
    );
}

// ─── Stagger word reveal ─────────────────────────────────────────────────────
function StaggerHeadline({ text, dark }: { text: string; dark: boolean }) {
    const words = text.split(' ');
    return (
        <h1
            style={{ color: dark ? '#f5f5f5' : '#0a0a0a', letterSpacing: '-0.04em', lineHeight: 1.03 }}
            className="text-6xl md:text-8xl font-black mb-6 overflow-hidden"
        >
            {words.map((word, i) => (
                <span key={i} className="inline-block overflow-hidden mr-[0.22em]">
                    <motion.span
                        className="inline-block"
                        initial={{ y: '105%', opacity: 0 }}
                        animate={{ y: '0%', opacity: 1 }}
                        transition={{ delay: 0.12 + i * 0.07, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {word}
                    </motion.span>
                </span>
            ))}
        </h1>
    );
}

// ─── Dot grid ────────────────────────────────────────────────────────────────
function DotGrid({ dark }: { dark: boolean }) {
    const color = dark ? 'rgba(255,255,255,0.1)' : 'rgba(67,56,202,0.14)';
    return (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`, backgroundSize: '26px 26px' }}
        />
    );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function LandingPage() {
    const [showModal, setShowModal] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [dark, setDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });
    const navigate = useNavigate();

    useEffect(() => {
        const root = document.documentElement;
        dark ? root.classList.add('dark') : root.classList.remove('dark');
        localStorage.setItem('theme', dark ? 'dark' : 'light');
    }, [dark]);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 80);
        // Hide default cursor on the page
        document.body.style.cursor = 'none';
        return () => {
            clearTimeout(t);
            document.body.style.cursor = '';
        };
    }, []);

    const bg = dark ? '#0a0a0a' : '#f7f5f0';
    const border = dark ? '#1e1e1e' : '#e2dfd8';
    const muted = dark ? '#555' : '#6b6860';
    const navBg = dark ? 'rgba(10,10,10,0.8)' : 'rgba(247,245,240,0.82)';
    const text = dark ? '#f5f5f5' : '#111';

    return (
        <div style={{ background: bg, color: text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh', overflowX: 'hidden', cursor: 'none' }}>
            {/* Cursor effects */}
            <CursorTrail dark={dark} />
            <SpotlightGlow dark={dark} />

            {/* ── Nav ── */}
            <nav style={{ background: navBg, borderBottom: `1px solid ${border}` }}
                className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <motion.div
                        className="flex items-center gap-2.5"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                    >
                        <div style={{ background: text }} className="w-6 h-6 rounded flex items-center justify-center">
                            <span style={{ color: bg }} className="text-[10px] font-black">AI</span>
                        </div>
                        <span className="font-semibold text-sm tracking-tight" style={{ color: text }}>InterviewAI</span>
                    </motion.div>

                    <motion.div
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                    >
                        <button
                            onClick={() => setDark(d => !d)}
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ border: `1px solid ${border}`, color: muted, cursor: 'none' }}
                        >
                            {dark ? (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                </svg>
                            ) : (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            )}
                        </button>

                        <MagneticButton primary dark={dark} onClick={() => setShowModal(true)}>
                            Start Interview
                        </MagneticButton>
                    </motion.div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                <DotGrid dark={dark} />
                <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-10"
                    style={{ background: `linear-gradient(to bottom, transparent, ${bg})` }} />

                <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
                    <motion.p
                        style={{ color: muted, letterSpacing: '0.2em' }}
                        className="text-[11px] font-medium uppercase mb-8"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 10 }}
                        transition={{ delay: 0.05, duration: 0.5 }}
                    >
                        AI-Powered Technical Interviews
                    </motion.p>

                    {mounted && <StaggerHeadline text="Ace Your Tech Interview" dark={dark} />}

                    <motion.p
                        style={{ color: muted }}
                        className="text-lg mb-12 leading-relaxed"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                        60 minutes. Real questions. Instant AI feedback.
                    </motion.p>

                    <motion.div
                        className="flex flex-col sm:flex-row gap-3 justify-center items-center"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.68, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <MagneticButton primary dark={dark} onClick={() => setShowModal(true)}>
                            Start Mock Interview →
                        </MagneticButton>
                    </motion.div>


                </div>
            </section>



            {/* Resume Modal */}
            <AnimatePresence>
                {showModal && (
                    <ResumeModal
                        onClose={() => setShowModal(false)}
                        onStart={() => { setShowModal(false); navigate('/arena'); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

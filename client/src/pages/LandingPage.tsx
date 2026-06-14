import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Code2,
  Eye,
  FileText,
  Github,
  MessageSquare,
  Moon,
  Play,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import ResumeModal from "../components/ResumeModal";
import { useInterview } from "../context/InterviewContext";
import {
  ACCENT,
  AuroraBackground,
  auroraTokens,
  Counter,
  DISPLAY,
  GRADIENT,
  GlowBorder,
  GradientText,
  MagneticButton,
  MONO,
  rise,
  Spotlight,
  TiltCard,
} from "../components/aurora";

// ─── Typewriter ──────────────────────────────────────────────────────────────
function Typewriter({ text, cycle, speed = 34 }: { text: string; cycle: number; speed?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, cycle]);
  const done = n >= text.length;
  return (
    <>
      {text.slice(0, n)}
      <span className={`caret-blink ${done ? "opacity-0" : ""}`} style={{ color: ACCENT.cyan }}>
        ▍
      </span>
    </>
  );
}

const CODE_LINES: React.ReactNode[] = [
  <><span style={{ color: "#7DD3FC" }}>def</span> <span style={{ color: ACCENT.fuchsia }}>reverse</span>(head):</>,
  <>{"    "}prev = <span style={{ color: "#7DD3FC" }}>None</span></>,
  <>{"    "}<span style={{ color: "#7DD3FC" }}>while</span> head:</>,
  <>{"        "}nxt = head.next</>,
  <>{"        "}head.next = prev</>,
  <>{"        "}prev, head = head, nxt</>,
  <>{"    "}<span style={{ color: "#7DD3FC" }}>return</span> prev</>,
];

// floating glass chip
function Chip({
  children,
  dark,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  dark: boolean;
  className?: string;
  delay?: number;
}) {
  const t = auroraTokens(dark);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 16 }}
      className={`absolute z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold shadow-xl ${className || ""}`}
      style={{
        background: dark ? "rgba(14,14,24,0.85)" : "rgba(255,255,255,0.92)",
        border: `1px solid ${t.borderStrong}`,
        color: t.text,
        backdropFilter: "blur(10px)",
        fontFamily: MONO,
      }}
    >
      {children}
    </motion.div>
  );
}

function DemoCard({ dark }: { dark: boolean }) {
  const t = auroraTokens(dark);
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCycle((c) => c + 1), 9000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full animate-float-y"
    >
      {/* floating chips */}
      <Chip dark={dark} delay={1} className="-top-3 -left-3 md:-left-6">
        <Eye size={12} color={ACCENT.cyan} /> gaze tracked
      </Chip>
      <Chip dark={dark} delay={1.3} className="-bottom-3 -right-2 md:-right-5">
        <Sparkles size={12} color={ACCENT.fuchsia} /> +18 XP earned
      </Chip>

      <GlowBorder radius={22} bg={dark ? "rgba(10,10,18,0.92)" : "rgba(255,255,255,0.95)"}>
        <div className="rounded-[22px] overflow-hidden" style={{ borderRadius: 22 }}>
          {/* title bar */}
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${t.border}` }}>
            <div className="flex gap-1.5">
              {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
                <span key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <span className="ml-2 text-xs font-medium" style={{ color: t.muted, fontFamily: MONO }}>
              live-interview · session
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#28C840" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#28C840] animate-pulse" /> REC 28:14
            </span>
          </div>

          <div key={cycle} className="p-4 space-y-3">
            {/* interviewer bubble */}
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: GRADIENT }}>
                <Sparkles size={13} color="#06060C" />
              </div>
              <div
                className="text-[13px] leading-relaxed rounded-2xl rounded-tl-sm px-3.5 py-2.5 min-h-[44px]"
                style={{ background: t.panel, border: `1px solid ${t.border}`, color: t.text }}
              >
                <Typewriter cycle={cycle} text="Reverse a singly linked list. Walk me through your approach and the complexity." />
              </div>
            </div>

            {/* code editor */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 2.6 } } }}
              className="rounded-xl overflow-hidden"
              style={{ background: dark ? "#0C0C0C" : "#FFFFFF", border: `1px solid ${t.border}` }}
            >
              <div
                className="px-3 py-1.5 text-[11px] flex items-center gap-2"
                style={{ color: "#8b8b9e", borderBottom: "1px solid rgba(255,255,255,0.06)", fontFamily: MONO }}
              >
                <Code2 size={12} /> solution.py
              </div>
              <pre className="px-4 py-3 text-[12px] leading-[1.7]" style={{ fontFamily: MONO }}>
                {CODE_LINES.map((ln, i) => (
                  <motion.div
                    key={i}
                    variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                    style={{ color: "#D7DCE6" }}
                  >
                    {ln}
                  </motion.div>
                ))}
              </pre>
            </motion.div>

            {/* result + score */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 4.4, duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div
                className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold"
                style={{ background: "rgba(40,200,100,0.12)", border: "1px solid rgba(40,200,100,0.3)", color: "#4ADE80" }}
              >
                <span>✓ 12/12 tests passed</span>
                <span className="opacity-60" style={{ fontFamily: MONO }}>O(n) · O(1)</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: t.panel, border: `1px solid ${t.border}` }}>
                <div className="text-lg font-bold" style={{ fontFamily: DISPLAY, color: ACCENT.cyan }}>
                  <Counter to={86} duration={1.2} />
                </div>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>score</span>
              </div>
            </motion.div>
          </div>
        </div>
      </GlowBorder>
    </motion.div>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: MessageSquare,
    title: "Live AI Interviewer",
    desc: "A focused senior interviewer that reads your resume, reacts to your code in real time, and drills exactly where a real loop would. Voice in, voice out.",
    featured: true,
  },
  { icon: FileText, title: "Resume-Aware Questions", desc: "Drop your PDF. The AI extracts your real projects and grills you on what you actually shipped." },
  { icon: Code2, title: "In-Browser Code Runner", desc: "Write & run Python, Java, C++, C or JS on the spot — executed and graded instantly." },
  { icon: Brain, title: "Mixed Question Types", desc: "MCQs, output-prediction, debugging, DSA and behavioral — the full interview surface." },
  { icon: ShieldCheck, title: "Proctoring Layer", desc: "Webcam gaze tracking and tab-switch detection keep every session honest." },
  { icon: BarChart3, title: "Instant AI Report", desc: "Score, grade, strengths, gaps and a study plan the second you submit." },
];

const STEPS = [
  { n: "01", title: "Pick your intensity", desc: "Easy, medium, or FAANG-hard. The question bank reshapes itself to match." },
  { n: "02", title: "Drop your resume", desc: "Optional. We parse the PDF, pull your top projects, and write questions around them." },
  { n: "03", title: "Get interviewed", desc: "60 minutes of theory, live coding and behavioral. The AI reacts to every answer." },
  { n: "04", title: "Read the verdict", desc: "An instant graded report — overall score, hiring call, gaps, and curated resources." },
];

const STATS = [
  { value: 5, suffix: "", label: "Languages" },
  { value: 60, suffix: "", label: "Minute sessions" },
  { value: 6, suffix: "", label: "Question types" },
  { value: 100, suffix: "%", label: "AI-graded" },
];

const MARQUEE = [
  "DSA", "SYSTEM DESIGN", "BEHAVIORAL", "LIVE CODE EXECUTION", "AI FEEDBACK",
  "RESUME DEEP-DIVE", "DEBUGGING", "OUTPUT PREDICTION", "MCQ ROUNDS",
];

// ─── Page ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useInterview();
  const t = auroraTokens(isDark);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });

  const synced = useRef(false);
  useEffect(() => {
    if (synced.current) return;
    synced.current = true;
    const stored = localStorage.getItem("theme");
    const prefersDark = stored
      ? stored === "dark"
      : window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
    if (prefersDark !== isDark) toggleTheme();
  }, [isDark, toggleTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <div
      style={{
        background: t.bg,
        color: t.text,
        fontFamily: "Inter, system-ui, sans-serif",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      <AuroraBackground dark={isDark} />
      <Spotlight dark={isDark} />

      <motion.div className="fixed top-0 left-0 right-0 h-[3px] z-30 origin-left" style={{ scaleX, background: GRADIENT }} />

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 mt-3">
          <div
            className="flex items-center justify-between px-4 py-2.5 rounded-2xl"
            style={{
              background: isDark ? "rgba(10,10,18,0.6)" : "rgba(255,255,255,0.6)",
              border: `1px solid ${t.border}`,
              backdropFilter: "blur(14px)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center font-black rounded-xl" style={{ width: 34, height: 34, background: GRADIENT, color: "#06060C", fontFamily: DISPLAY }}>
                AI
              </div>
              <span className="font-bold text-[15px] tracking-tight" style={{ fontFamily: DISPLAY }}>
                Interview<GradientText>AI</GradientText>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="flex items-center justify-center rounded-full transition-colors"
                style={{ width: 38, height: 38, background: t.panel, border: `1px solid ${t.border}`, color: t.text }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isDark ? "sun" : "moon"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isDark ? <Sun size={16} /> : <Moon size={16} />}
                  </motion.span>
                </AnimatePresence>
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                style={{ background: t.panel, border: `1px solid ${t.border}`, color: t.text, fontFamily: DISPLAY }}
              >
                <BarChart3 size={15} /> Dashboard
              </button>
              <MagneticButton dark={isDark} onClick={() => setShowModal(true)}>
                Start <ArrowRight size={15} />
              </MagneticButton>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="relative z-10 max-w-6xl mx-auto px-5 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: t.panel, border: `1px solid ${t.border}`, color: t.text, backdropFilter: "blur(10px)" }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: ACCENT.cyan }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: ACCENT.cyan }} />
              </span>
              AI-Powered Technical Interviews
            </motion.div>

            <h1 className="font-bold" style={{ fontFamily: DISPLAY, lineHeight: 0.95, letterSpacing: "-0.03em", fontSize: "clamp(3rem, 7.5vw, 6rem)" }}>
              {["Ace your", "tech"].map((word, i) => (
                <motion.span
                  key={word}
                  className="block"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  {word}
                </motion.span>
              ))}
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <GradientText>interview.</GradientText>
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.35 }}
              className="mt-7 max-w-md text-base md:text-lg"
              style={{ color: t.muted }}
            >
              60 minutes. Real questions. A live AI interviewer that reads your resume, runs your code, and tells you exactly where you stand.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.45 }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <MagneticButton dark={isDark} big onClick={() => setShowModal(true)}>
                <Play size={17} /> Start Mock Interview
              </MagneticButton>
              <MagneticButton dark={isDark} big variant="ghost" onClick={() => navigate("/dashboard")}>
                <BarChart3 size={17} /> View Dashboard
              </MagneticButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium"
              style={{ color: t.muted, fontFamily: MONO }}
            >
              <span>★ No signup required</span>
              <span>★ 5 languages</span>
              <span>★ Instant grading</span>
            </motion.div>
          </div>

          <div className="relative">
            <DemoCard dark={isDark} />
          </div>
        </div>
      </header>

      {/* ── Marquee ── */}
      <div
        className="relative z-10 marquee-paused overflow-hidden marquee-fade"
        style={{ borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, background: t.panel }}
      >
        <div className="flex animate-marquee whitespace-nowrap py-3">
          {[...MARQUEE, ...MARQUEE].map((word, i) => (
            <span key={i} className="flex items-center text-xs font-bold uppercase tracking-[0.2em]" style={{ color: t.muted, fontFamily: DISPLAY }}>
              <Sparkles size={12} className="mx-5" style={{ color: ACCENT.violet }} />
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* ── Features (bento) ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-5 py-20 md:py-28">
        <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="mb-12">
          <span className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: ACCENT.cyan, fontFamily: MONO }}>
            What you get
          </span>
          <h2 className="mt-3 font-bold" style={{ fontFamily: DISPLAY, fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}>
            Everything a real loop
            <br />
            throws at you.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <TiltCard
                key={f.title}
                custom={i}
                className={`group relative p-6 rounded-2xl overflow-hidden ${f.featured ? "lg:col-span-2 lg:row-span-2 flex flex-col justify-between" : ""}`}
                style={{
                  background: t.panel,
                  border: `1px solid ${t.border}`,
                  minHeight: f.featured ? 280 : undefined,
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(420px circle at 50% 0%, ${ACCENT.violet}22, transparent 70%)` }}
                />
                <div className="relative" style={{ transform: "translateZ(40px)" }}>
                  <div
                    className="flex items-center justify-center rounded-xl mb-5"
                    style={{ width: f.featured ? 60 : 48, height: f.featured ? 60 : 48, background: GRADIENT, color: "#06060C" }}
                  >
                    <Icon size={f.featured ? 30 : 24} />
                  </div>
                  <h3 className={`font-bold mb-2 ${f.featured ? "text-2xl" : "text-lg"}`} style={{ fontFamily: DISPLAY }}>
                    {f.title}
                  </h3>
                  <p className={`leading-relaxed ${f.featured ? "text-base max-w-sm" : "text-sm"}`} style={{ color: t.muted }}>
                    {f.desc}
                  </p>
                </div>
                {f.featured && (
                  <div className="relative mt-6 flex items-center gap-2 text-sm font-semibold" style={{ color: ACCENT.cyan }}>
                    Reacts in real time <ArrowRight size={15} />
                  </div>
                )}
              </TiltCard>
            );
          })}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-5 py-16 md:py-24">
        <motion.h2
          variants={rise}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="font-bold mb-14"
          style={{ fontFamily: DISPLAY, fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1, letterSpacing: "-0.02em" }}
        >
          How it works.
        </motion.h2>

        <div className="relative pl-8 md:pl-0">
          <div
            className="absolute left-[15px] md:left-1/2 top-2 bottom-2 w-px md:-translate-x-1/2"
            style={{ background: `linear-gradient(${ACCENT.cyan}, ${ACCENT.violet}, ${ACCENT.fuchsia})`, opacity: 0.4 }}
            aria-hidden
          />
          <div className="space-y-6 md:space-y-0">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                custom={i}
                variants={rise}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className={`relative md:w-1/2 md:py-6 ${i % 2 === 1 ? "md:ml-auto md:pl-12" : "md:pr-12 md:text-right"}`}
              >
                <div
                  className={`absolute top-1 w-3.5 h-3.5 rounded-full -left-[26px] md:left-auto ${i % 2 === 1 ? "md:-left-[7px]" : "md:-right-[7px]"}`}
                  style={{ background: GRADIENT, boxShadow: `0 0 0 4px ${t.bg}` }}
                />
                <div className="p-5 rounded-2xl" style={{ background: t.panel, border: `1px solid ${t.border}` }}>
                  <div className="text-3xl font-bold mb-1" style={{ fontFamily: DISPLAY }}>
                    <GradientText>{s.n}</GradientText>
                  </div>
                  <h3 className="text-lg font-bold mb-1" style={{ fontFamily: DISPLAY }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: t.muted }}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-5 py-16 md:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-3xl overflow-hidden" style={{ background: t.border, border: `1px solid ${t.border}` }}>
          {STATS.map((s) => (
            <div key={s.label} className="p-7 md:p-9 text-center" style={{ background: t.bg }}>
              <div className="font-bold" style={{ fontFamily: DISPLAY, fontSize: "clamp(2.5rem,6vw,4rem)", lineHeight: 1 }}>
                <GradientText>
                  <Counter to={s.value} suffix={s.suffix} />
                </GradientText>
              </div>
              <div className="mt-2 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: t.muted, fontFamily: MONO }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Big CTA ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-5 pb-24">
        <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
          <GlowBorder radius={28} bg={isDark ? "rgba(10,10,18,0.85)" : "rgba(255,255,255,0.9)"}>
            <div className="relative overflow-hidden p-10 md:p-16 text-center" style={{ borderRadius: 28 }}>
              <div
                className="absolute -inset-40 opacity-30"
                style={{ background: `radial-gradient(circle at 50% 0%, ${ACCENT.violet}, transparent 60%)` }}
                aria-hidden
              />
              <h2 className="relative font-bold" style={{ fontFamily: DISPLAY, fontSize: "clamp(2.25rem, 6vw, 4.5rem)", lineHeight: 0.98, letterSpacing: "-0.02em" }}>
                Ready to get <GradientText>grilled?</GradientText>
              </h2>
              <p className="relative mt-5 text-base md:text-lg" style={{ color: t.muted }}>
                60 minutes between you and your next offer. No signup required.
              </p>
              <div className="relative mt-9 flex justify-center">
                <MagneticButton dark={isDark} big onClick={() => setShowModal(true)}>
                  <Play size={18} /> Start Mock Interview <ArrowRight size={18} />
                </MagneticButton>
              </div>
            </div>
          </GlowBorder>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10" style={{ borderTop: `1px solid ${t.border}`, background: t.panel }}>
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center font-black rounded-lg" style={{ width: 30, height: 30, background: GRADIENT, color: "#06060C", fontFamily: DISPLAY }}>
              AI
            </div>
            <span className="text-sm" style={{ color: t.muted }}>
              © 2026 InterviewAI — built for people who'd rather fail here first.
            </span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: t.text, fontFamily: MONO }}
          >
            <Github size={16} /> Source
          </a>
        </div>
      </footer>

      <AnimatePresence>
        {showModal && (
          <ResumeModal
            onClose={() => setShowModal(false)}
            onStart={() => {
              setShowModal(false);
              navigate("/arena");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

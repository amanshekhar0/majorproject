import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";

// ─── Design tokens ───────────────────────────────────────────────────────────
// Chromium & Obsidian Theme. Keys are kept generic (cyan/violet/blue/fuchsia)
// purely so existing references resolve; values are custom white/silver/gray.
export const ACCENT = {
  cyan: "#FFFFFF", // Platinum White — primary
  violet: "#E5E5E5", // Chrome Silver — secondary
  blue: "#737373", // Steel Gray — depth
  fuchsia: "#D4D4D8", // Titanium Silver — accent / gradient tail
};
export const GRADIENT = `linear-gradient(100deg, ${ACCENT.cyan}, ${ACCENT.blue}, ${ACCENT.violet}, ${ACCENT.cyan})`;
export const DISPLAY = "'Space Grotesk', system-ui, sans-serif";
export const MONO = "'JetBrains Mono', monospace";

export function auroraTokens(dark: boolean) {
  return dark
    ? {
        bg: "#050505",
        panel: "rgba(255,255,255,0.025)",
        panelStrong: "rgba(255,255,255,0.05)",
        border: "rgba(255,255,255,0.08)",
        borderStrong: "rgba(255,255,255,0.15)",
        text: "#F5F5F5",
        muted: "#A3A3A3",
        grid: "rgba(255,255,255,0.02)",
        cardBg: "rgba(10,10,10,0.85)",
      }
    : {
        bg: "#FAFAFA",
        panel: "rgba(0,0,0,0.015)",
        panelStrong: "rgba(0,0,0,0.03)",
        border: "rgba(0,0,0,0.06)",
        borderStrong: "rgba(0,0,0,0.12)",
        text: "#171717",
        muted: "#737373",
        grid: "rgba(0,0,0,0.03)",
        cardBg: "rgba(255,255,255,0.9)",
      };
}
export type AuroraTokens = ReturnType<typeof auroraTokens>;

// ─── Reveal variant ──────────────────────────────────────────────────────────
export const rise = {
  hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

// ─── Aurora background ───────────────────────────────────────────────────────
export function AuroraBackground({ dark }: { dark: boolean }) {
  const t = auroraTokens(dark);
  const blobs = [
    { c: "#FFFFFF", top: "-12%", left: "-8%", size: 520, delay: "0s", o: dark ? 0.12 : 0.08 },
    { c: "#E5E5E5", top: "4%", right: "-10%", size: 560, delay: "-3s", o: dark ? 0.1 : 0.06 },
    { c: "#737373", top: "46%", left: "30%", size: 480, delay: "-6s", o: dark ? 0.08 : 0.05 },
    { c: "#D4D4D8", top: "62%", left: "-6%", size: 460, delay: "-9s", o: dark ? 0.08 : 0.05 },
  ];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      {blobs.map((b, i) => (
        <div
          key={i}
          className="aurora-blob"
          style={{
            top: b.top,
            left: b.left,
            right: (b as { right?: string }).right,
            width: b.size,
            height: b.size,
            background: b.c,
            opacity: b.o,
            animation: `aurora-drift ${20 + i * 4}s ease-in-out infinite`,
            animationDelay: b.delay,
          }}
        />
      ))}
      <div
        className="aurora-grid absolute inset-0"
        style={{ color: t.grid, opacity: dark ? 0.22 : 0.35 }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: dark
            ? "radial-gradient(120% 80% at 50% -10%, transparent 40%, rgba(5,5,5,0.6) 100%)"
            : "radial-gradient(120% 80% at 50% -10%, transparent 50%, rgba(250,250,250,0.72) 100%)",
        }}
      />
    </div>
  );
}

// ─── Mouse-follow spotlight ──────────────────────────────────────────────────
export function Spotlight({ dark }: { dark: boolean }) {
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [mx, my]);
  const bg = useMotionTemplate`radial-gradient(560px circle at ${mx}px ${my}px, ${
    dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"
  }, transparent 72%)`;
  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-[1] hidden md:block"
      style={{ background: bg }}
    />
  );
}

// ─── Gradient (shimmer) text ─────────────────────────────────────────────────
export function GradientText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`text-shimmer ${className || ""}`} style={{ backgroundImage: GRADIENT }}>
      {children}
    </span>
  );
}

// ─── Count-up number ─────────────────────────────────────────────────────────
export function Counter({
  to,
  suffix = "",
  duration = 1.6,
  className,
  style,
}: {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return (
    <span ref={ref} className={className} style={style}>
      {Math.round(val)}
      {suffix}
    </span>
  );
}

// ─── Magnetic button ─────────────────────────────────────────────────────────
export function MagneticButton({
  children,
  onClick,
  variant = "primary",
  big,
  dark,
  full,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  big?: boolean;
  dark: boolean;
  full?: boolean;
  className?: string;
}) {
  const t = auroraTokens(dark);
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18 });
  const sy = useSpring(y, { stiffness: 250, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - (r.left + r.width / 2)) * 0.3);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.45);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const primary = variant === "primary";
  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={reset}
      whileTap={{ scale: 0.96 }}
      style={{
        x: sx,
        y: sy,
        backgroundImage: primary ? GRADIENT : undefined,
        backgroundColor: primary ? (dark ? "#FFFFFF" : "#171717") : t.panel,
        backgroundSize: primary ? "200% auto" : undefined,
        color: primary ? (dark ? "#050505" : "#FAFAFA") : t.text,
        border: primary ? "none" : `1px solid ${t.borderStrong}`,
        boxShadow: primary ? `0 10px 30px -8px rgba(255,255,255,0.15)` : "none",
        backdropFilter: primary ? undefined : "blur(10px)",
        fontFamily: DISPLAY,
      }}
      className={`relative inline-flex items-center justify-center gap-2 rounded-full font-bold tracking-tight transition-shadow ${big ? "px-7 py-3.5 text-[15px]" : "px-5 py-2.5 text-sm"
        } ${full ? "w-full" : ""} ${className || ""}`}
    >
      {children}
    </motion.button>
  );
}

// ─── 3D tilt card ────────────────────────────────────────────────────────────
export function TiltCard({
  children,
  className,
  style,
  custom = 0,
  max = 7,
  reveal = true,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  custom?: number;
  max?: number;
  reveal?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 18 });
  const sry = useSpring(ry, { stiffness: 200, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * max * 2);
    rx.set(-py * max * 2);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      custom={custom}
      variants={reveal ? rise : undefined}
      initial={reveal ? "hidden" : undefined}
      whileInView={reveal ? "show" : undefined}
      viewport={reveal ? { once: true, margin: "-50px" } : undefined}
      whileHover={{ scale: 1.015 }}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900, ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated gradient border wrapper ────────────────────────────────────────
export function GlowBorder({
  children,
  className,
  radius = 20,
  bg,
  spin = true,
}: {
  children: React.ReactNode;
  className?: string;
  radius?: number;
  bg: string;
  spin?: boolean;
}) {
  return (
    <div className={`relative ${className || ""}`} style={{ borderRadius: radius }}>
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ borderRadius: radius }}
        aria-hidden
      >
        <div
          className={`absolute left-1/2 top-1/2 ${spin ? "animate-spin-slow" : ""}`}
          style={{
            width: "180%",
            height: "180%",
            marginLeft: "-90%",
            marginTop: "-90%",
            background: `conic-gradient(from 0deg, transparent 0deg, ${ACCENT.cyan} 60deg, ${ACCENT.violet} 130deg, ${ACCENT.fuchsia} 200deg, transparent 280deg)`,
          }}
        />
      </div>
      <div
        className="absolute"
        style={{ inset: 1.5, borderRadius: radius - 1.5, background: bg }}
        aria-hidden
      />
      <div className="relative" style={{ borderRadius: radius }}>
        {children}
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  LayoutDashboard,
  LineChart as LineChartIconLucide,
  Loader2,
  Radar as RadarBadgeIcon,
  Search,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as SkillRadar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { fetchUserPerformance, UserPerformanceResponse } from "../lib/api";
import { useInterview } from "../context/InterviewContext";
import {
  ACCENT,
  AuroraBackground,
  auroraTokens,
  DISPLAY,
  GRADIENT,
  GradientText,
  MONO,
  Spotlight,
} from "../components/aurora";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isDark } = useInterview();
  const t = auroraTokens(isDark);
  const [email, setEmail] = useState(() => {
    try {
      const raw = localStorage.getItem("interview_candidate_profile");
      if (!raw) return "";
      const j = JSON.parse(raw) as { email?: string };
      return typeof j.email === "string" ? j.email : "";
    } catch {
      return "";
    }
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UserPerformanceResponse | null>(null);
  const [loadError, setLoadError] = useState("");

  const radarData = data?.radar?.map(({ dimension, value }) => ({
    skill: dimension,
    score: value,
  }));

  const hasTrendPoints = !!(data?.trend && data.trend.length >= 2);

  const safeMcqTrend = useMemo(
    () =>
      data?.mcqTrend?.length
        ? data.mcqTrend
        : data?.trend?.map((tr, i) => ({
          label: tr.label || `Session ${i + 1}`,
          pct: tr.score,
        })) || [],
    [data],
  );

  const handleLoad = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setLoadError("Please enter a valid email");
      setData(null);
      return;
    }
    setLoadError("");
    setLoading(true);
    try {
      const res = await fetchUserPerformance(trimmed);
      setData(res);
    } catch {
      setLoadError(
        "Could not fetch analytics yet. Confirm the backend is running with MongoDB connected.",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: t.panel,
    border: `1px solid ${t.border}`,
    backdropFilter: "blur(12px)",
    borderRadius: 20,
  };

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <AuroraBackground dark={isDark} />
      <Spotlight dark={isDark} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 space-y-8">
        <motion.div
          className="md:flex md:items-end md:justify-between gap-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] flex items-center gap-2" style={{ color: ACCENT.cyan, fontFamily: MONO }}>
              <LayoutDashboard size={14} />
              Candidate dashboard
            </p>
            <h1 className="font-bold tracking-tight" style={{ fontFamily: DISPLAY, fontSize: "clamp(2rem,5vw,3rem)", lineHeight: 1.02 }}>
              Progress &amp; <GradientText>Strengths</GradientText>
            </h1>
            <p className="text-sm max-w-xl" style={{ color: t.muted }}>
              Charts pull from your MongoDB-backed interview history. Saved sessions require the same email you enter before starting an interview.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-4 md:mt-0 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
            style={{ background: t.panel, border: `1px solid ${t.borderStrong}`, color: t.text, fontFamily: DISPLAY }}
          >
            <ArrowLeft size={14} />
            Back home
          </button>
        </motion.div>

        <motion.div className="p-6 space-y-4" style={cardStyle} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <label className="text-xs uppercase tracking-wide flex items-center gap-2 font-semibold" style={{ color: t.muted }}>
            <Activity size={12} /> Email lookup
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
              style={{ background: isDark ? "#050505" : "#fff", border: `1px solid ${t.border}`, color: t.text }}
              type="email"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              onBlur={() => {
                try {
                  const raw = localStorage.getItem("interview_candidate_profile");
                  const j = raw ? (JSON.parse(raw) as Record<string, string>) : {};
                  localStorage.setItem("interview_candidate_profile", JSON.stringify({ ...j, email: email.trim() }));
                } catch {
                  localStorage.setItem("interview_candidate_profile", JSON.stringify({ email: email.trim(), name: "" }));
                }
              }}
            />
            <button
              type="button"
              onClick={() => void handleLoad()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-50 transition-transform active:scale-95"
              style={{ background: isDark ? "#ffffff" : "#171717", color: isDark ? "#050505" : "#ffffff", fontFamily: DISPLAY }}
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />} Load charts
            </button>
          </div>
          {loadError && <p className="text-sm" style={{ color: "#fbbf24" }}>{loadError}</p>}
        </motion.div>

        {data?.user === null &&
          !loading &&
          email.trim() &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && (
            <p className="text-center text-sm" style={{ color: t.muted }}>
              No saved interviews yet. Finish a mock interview — we persist results automatically when your profile email matches.
            </p>
          )}

        {data?.user && (
          <motion.section className="grid grid-cols-1 lg:grid-cols-2 gap-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="p-6 flex flex-col min-h-[320px]" style={cardStyle}>
              <div className="flex items-center gap-2 mb-5">
                <LineChartIconLucide size={18} style={{ color: ACCENT.cyan }} />
                <div>
                  <h2 className="text-lg font-bold leading-tight" style={{ fontFamily: DISPLAY }}>Recent scores</h2>
                  <p className="text-xs" style={{ color: t.muted }}>Last handful of completions</p>
                </div>
              </div>
              <div className="flex-1 min-h-[220px]">
                {hasTrendPoints ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trend}>
                      <defs>
                        <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ACCENT.cyan} stopOpacity={0.5} />
                          <stop offset="100%" stopColor={ACCENT.cyan} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
                      <XAxis dataKey="label" stroke={t.muted} fontSize={12} />
                      <YAxis domain={[0, 100]} stroke={t.muted} width={48} fontSize={12} />
                      <Tooltip
                        contentStyle={{ background: isDark ? "#0C0C16" : "#fff", border: `1px solid ${t.border}`, borderRadius: 12 }}
                        formatter={(value) => [`${typeof value === "number" ? value : "—"}`, "Score"]}
                      />
                      <Area type="monotone" dataKey="score" stroke={ACCENT.cyan} fill="url(#scoreFill)" strokeWidth={3} dot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm" style={{ color: t.muted }}>
                    Finish at least two saved interviews with this email and you&apos;ll unlock the trend slope.
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 flex flex-col min-h-[320px]" style={cardStyle}>
              <div className="flex items-center gap-2 mb-5">
                <RadarBadgeIcon size={18} style={{ color: ACCENT.violet }} />
                <div>
                  <h2 className="text-lg font-bold leading-tight" style={{ fontFamily: DISPLAY }}>Skills radar</h2>
                  <p className="text-xs" style={{ color: t.muted }}>Averaged from recent evaluations</p>
                </div>
              </div>
              <div className="flex-1 min-h-[260px]">
                {radarData && radarData.length > 2 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="76%">
                      <PolarGrid stroke={isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1"} />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: t.muted, fontSize: 12 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <SkillRadar name="Score" dataKey="score" stroke={ACCENT.violet} strokeWidth={2} fill={ACCENT.violet} fillOpacity={0.38} dot />
                      <Tooltip
                        contentStyle={{ background: isDark ? "#0C0C16" : "#fff", border: `1px solid ${t.border}`, borderRadius: 12 }}
                        formatter={(value) => [`${typeof value === "number" ? value : "—"}%`, "Average"]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm" style={{ color: t.muted }}>
                    Need at least two saved sessions with graded rubrics — keep practicing!
                  </p>
                )}
              </div>
            </div>

            {(safeMcqTrend?.length ?? 0) >= 2 && (
              <div className="p-6 lg:col-span-2" style={cardStyle}>
                <h3 className="text-base font-semibold mb-4" style={{ fontFamily: DISPLAY }}>Theory hit rate trajectory</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={safeMcqTrend}>
                      <defs>
                        <linearGradient id="mcqPct" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ACCENT.fuchsia} stopOpacity={0.5} />
                          <stop offset="100%" stopColor={ACCENT.fuchsia} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
                      <XAxis dataKey="label" stroke={t.muted} fontSize={12} />
                      <YAxis domain={[0, 100]} stroke={t.muted} width={52} fontSize={12} />
                      <Tooltip
                        contentStyle={{ background: isDark ? "#0C0C16" : "#fff", border: `1px solid ${t.border}`, borderRadius: 12 }}
                        formatter={(value) => [`${typeof value === "number" ? value : "—"}%`, "MCQs"]}
                      />
                      <Area type="step" dataKey="pct" stroke={ACCENT.fuchsia} fill="url(#mcqPct)" strokeWidth={2} dot />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </motion.section>
        )}
      </div>
    </div>
  );
}

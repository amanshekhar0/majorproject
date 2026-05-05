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

export default function DashboardPage() {
  const navigate = useNavigate();
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
        : data?.trend?.map((t, i) => ({
            label: t.label || `Session ${i + 1}`,
            pct: t.score,
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

  return (
    <div className="min-h-screen bg-[var(--bg)] py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div
          className="text-center md:text-left md:flex md:items-end md:justify-between gap-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] flex items-center justify-center md:justify-start gap-2">
              <LayoutDashboard size={14} />
              Candidate dashboard
            </p>
            <h1 className="text-3xl font-black text-[var(--text)] tracking-tight">
              Progress & Strengths
            </h1>
            <p className="text-sm text-[var(--text-muted)] max-w-xl">
              Charts pull from MongoDB-backed interview history. Saved sessions
              require the same email you enter before starting an interview.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg-secondary)] text-sm font-semibold"
          >
            <ArrowLeft size={14} />
            Back home
          </button>
        </motion.div>

        <motion.div
          className="apple-card dark:neon-border p-6 space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <label className="text-xs uppercase tracking-wide text-[var(--text-muted)] flex items-center gap-2 font-semibold">
            <Activity size={12} /> Email lookup
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-emerald-500/70"
              type="email"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              onBlur={() => {
                try {
                  const raw = localStorage.getItem(
                    "interview_candidate_profile",
                  );
                  const j = raw
                    ? (JSON.parse(raw) as Record<string, string>)
                    : {};
                  localStorage.setItem(
                    "interview_candidate_profile",
                    JSON.stringify({ ...j, email: email.trim() }),
                  );
                } catch {
                  localStorage.setItem(
                    "interview_candidate_profile",
                    JSON.stringify({ email: email.trim(), name: "" }),
                  );
                }
              }}
            />
            <button
              type="button"
              onClick={() => void handleLoad()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Search size={16} />
              )}{" "}
              Load charts
            </button>
          </div>
          {loadError && <p className="text-sm text-yellow-600">{loadError}</p>}
        </motion.div>

        {data?.user === null &&
          !loading &&
          email.trim() &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && (
            <p className="text-center text-[var(--text-muted)] text-sm">
              No saved interviews yet. Finish a mock interview — we persist
              results automatically when your profile email matches.
            </p>
          )}

        {data?.user && (
          <motion.section
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="apple-card dark:neon-border p-6 flex flex-col min-h-[320px]">
              <div className="flex items-center gap-2 mb-5">
                <LineChartIconLucide size={18} className="text-emerald-400" />
                <div>
                  <h2 className="text-lg font-bold text-[var(--text)] leading-tight">
                    Recent scores
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Last handful of completions
                  </p>
                </div>
              </div>
              <div className="flex-1 min-h-[220px]">
                {hasTrendPoints ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trend}>
                      <defs>
                        <linearGradient
                          id="scoreFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#34d399"
                            stopOpacity={0.5}
                          />
                          <stop
                            offset="100%"
                            stopColor="#34d399"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        strokeOpacity={0.2}
                        vertical={false}
                      />
                      <XAxis dataKey="label" stroke="#94a3b8" />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" width={48} />
                      <Tooltip
                        formatter={(value) => [
                          `${typeof value === "number" ? value : "—"}`,
                          "Score",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#10b981"
                        fill="url(#scoreFill)"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">
                    Finish at least two saved interviews with this email and
                    you&apos;ll unlock the trend slope.
                  </p>
                )}
              </div>
            </div>

            <div className="apple-card dark:neon-border p-6 flex flex-col min-h-[320px]">
              <div className="flex items-center gap-2 mb-5">
                <RadarBadgeIcon size={18} className="text-purple-400" />
                <div>
                  <h2 className="text-lg font-bold text-[var(--text)] leading-tight">
                    Skills radar
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Averaged from recent evaluations
                  </p>
                </div>
              </div>
              <div className="flex-1 min-h-[260px]">
                {radarData && radarData.length > 2 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={radarData}
                      cx="50%"
                      cy="50%"
                      outerRadius="76%"
                    >
                      <PolarGrid stroke="#475569" />
                      <PolarAngleAxis
                        dataKey="skill"
                        tick={{ fill: "#cbd5e1", fontSize: 12 }}
                      />
                      <PolarRadiusAxis
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                      />
                      <SkillRadar
                        name="Score"
                        dataKey="score"
                        stroke="#a855f7"
                        strokeWidth={2}
                        fill="#a855f7"
                        fillOpacity={0.38}
                        dot
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${typeof value === "number" ? value : "—"}%`,
                          "Average",
                        ]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">
                    Need at least two saved sessions with graded rubrics — keep
                    practicing!
                  </p>
                )}
              </div>
            </div>

            {(safeMcqTrend?.length ?? 0) >= 2 && (
              <div className="apple-card dark:neon-border p-6 lg:col-span-2">
                <h3 className="text-base font-semibold text-[var(--text)] mb-4">
                  Theory hit rate trajectory
                </h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={safeMcqTrend}>
                      <defs>
                        <linearGradient id="mcqPct" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="#38bdf8"
                            stopOpacity={0.5}
                          />
                          <stop
                            offset="100%"
                            stopColor="#38bdf8"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        strokeOpacity={0.2}
                        vertical={false}
                      />
                      <XAxis dataKey="label" stroke="#94a3b8" />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" width={52} />
                      <Tooltip
                        formatter={(value) => [
                          `${typeof value === "number" ? value : "—"}%`,
                          "MCQs",
                        ]}
                      />
                      <Area
                        type="step"
                        dataKey="pct"
                        stroke="#38bdf8"
                        fill="url(#mcqPct)"
                        strokeWidth={2}
                        dot
                      />
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

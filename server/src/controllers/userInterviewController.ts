import { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../models/User";
import { InterviewSession } from "../models/InterviewSession";

interface SaveInterviewBody {
  email: string;
  name?: string;
  resumeUrl?: string;
  difficulty?: string;
  terminated?: boolean;
  timeUsed?: number;
  evaluation: Record<string, unknown>;
  sessionSnapshot?: Record<string, unknown>;
  proctoring?: {
    tabSwitchCount?: number;
    faceViolationCount?: number;
    noiseAlertCount?: number;
  };
}

export const saveInterview = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res
        .status(503)
        .json({
          error: "Database unavailable. Configure MONGODB_URI and retry.",
        });
      return;
    }

    const body = req.body as SaveInterviewBody;
    const email = (body.email || "").trim().toLowerCase();
    if (!email || !body.evaluation || typeof body.evaluation !== "object") {
      res
        .status(400)
        .json({ error: "email and evaluation object are required" });
      return;
    }

    const overallScore = Number(
      (body.evaluation as { overallScore?: number }).overallScore,
    );
    if (Number.isNaN(overallScore)) {
      res
        .status(400)
        .json({ error: "evaluation.overallScore is required as a number" });
      return;
    }

    const grade =
      typeof (body.evaluation as { grade?: string }).grade === "string"
        ? (body.evaluation as { grade?: string }).grade
        : undefined;
    const recommendation =
      typeof (body.evaluation as { recommendation?: string }).recommendation ===
      "string"
        ? (body.evaluation as { recommendation?: string }).recommendation
        : undefined;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name: body.name?.trim() || "Candidate",
        resumeUrl: body.resumeUrl?.trim(),
        totalInterviews: 0,
      });
    } else if (body.name?.trim()) {
      user.name = body.name.trim();
      if (body.resumeUrl?.trim()) user.resumeUrl = body.resumeUrl.trim();
      await user.save();
    }

    const session = await InterviewSession.create({
      userId: user._id,
      difficulty: body.difficulty ?? "medium",
      overallScore,
      grade,
      recommendation,
      evaluation: body.evaluation,
      sessionSnapshot: {
        ...(body.sessionSnapshot || {}),
        terminated: body.terminated ?? false,
        timeUsed: body.timeUsed ?? 0,
      },
      proctoring: {
        tabSwitchCount: body.proctoring?.tabSwitchCount ?? 0,
        faceViolationCount: body.proctoring?.faceViolationCount ?? 0,
        noiseAlertCount: body.proctoring?.noiseAlertCount ?? 0,
      },
      completedAt: new Date(),
    });

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { totalInterviews: 1 } },
      { new: true },
    );

    res.json({
      success: true,
      sessionId: session._id,
      totalInterviews: updatedUser?.totalInterviews ?? 1,
    });
  } catch (err: unknown) {
    console.error("saveInterview error:", err);
    res.status(500).json({ error: "Failed to save interview session" });
  }
};

export const getUserPerformance = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ error: "Database unavailable." });
      return;
    }

    const email = String(req.query.email || "")
      .trim()
      .toLowerCase();
    if (!email) {
      res.status(400).json({ error: "Query parameter email is required" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.json({
        success: true,
        user: null,
        trend: [],
        mcqTrend: [],
        radar: null,
        recentSessions: [],
      });
      return;
    }

    const sessions = await InterviewSession.find({ userId: user._id })
      .sort({ completedAt: -1 })
      .limit(10)
      .lean();

    const lastFive = [...sessions].slice(0, 5).reverse();

    const trend = lastFive.map((s) => ({
      label: new Date(s.completedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      score: s.overallScore,
      date: s.completedAt,
    }));

    const mcqTrend = lastFive.map((s) => {
      const snap = s.sessionSnapshot as
        | { mcqScore?: number; mcqTotal?: number }
        | undefined;
      const total = snap?.mcqTotal || 0;
      const pct =
        total > 0 ? Math.round(((snap?.mcqScore || 0) / total) * 100) : 0;
      return {
        label: new Date(s.completedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        pct,
      };
    });

    const accumulateRadar = (): {
      theory: number;
      coding: number;
      communication: number;
      behavioral: number;
    } | null => {
      if (!lastFive.length) return null;
      const keys = ["mcq", "coding", "communication", "behavioral"] as const;
      const sums = { theory: 0, coding: 0, communication: 0, behavioral: 0 };
      let n = 0;
      for (const s of lastFive) {
        const ev = s.evaluation as { sectionScores?: Record<string, number> };
        const sec = ev.sectionScores;
        if (!sec) continue;
        n += 1;
        sums.theory += sec.mcq ?? 0;
        sums.coding += sec.coding ?? 0;
        sums.communication += sec.communication ?? 0;
        sums.behavioral += sec.behavioral ?? sec.resumeDepth ?? 0;
      }
      if (!n) return null;
      return {
        theory: Math.round(sums.theory / n),
        coding: Math.round(sums.coding / n),
        communication: Math.round(sums.communication / n),
        behavioral: Math.round(sums.behavioral / n),
      };
    };

    const radarAvg = accumulateRadar();

    const problemSolving = radarAvg
      ? Math.round((radarAvg.coding + radarAvg.theory) / 2)
      : 0;

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        totalInterviews: user.totalInterviews,
        resumeUrl: user.resumeUrl,
      },
      trend,
      mcqTrend,
      radar: radarAvg
        ? [
            { dimension: "Theory", value: radarAvg.theory, fullMark: 100 },
            { dimension: "Coding", value: radarAvg.coding, fullMark: 100 },
            {
              dimension: "Communication",
              value: radarAvg.communication,
              fullMark: 100,
            },
            {
              dimension: "Behavioral",
              value: radarAvg.behavioral,
              fullMark: 100,
            },
            {
              dimension: "Problem solving",
              value: problemSolving,
              fullMark: 100,
            },
          ]
        : null,
      recentSessions: sessions.slice(0, 5).map((s) => ({
        id: s._id,
        completedAt: s.completedAt,
        overallScore: s.overallScore,
        grade: s.grade,
        difficulty: s.difficulty,
        proctoring: s.proctoring,
      })),
    });
  } catch (err: unknown) {
    console.error("getUserPerformance error:", err);
    res.status(500).json({ error: "Failed to load performance analytics" });
  }
};

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import resumeRoutes from "./routes/resume";
import interviewRoutes from "./routes/interview";
import codeRoutes from "./routes/code";
import resultsRoutes from "./routes/results";
import userRoutes from "./routes/user";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many requests, please try again later." },
});

// Allowed CORS origins: localhost dev defaults plus any comma-separated
// list supplied via CORS_ORIGINS (e.g. a deployed frontend URL).
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  ...(process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
    : []),
];

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api", limiter);

// Routes
app.use("/api/resume", resumeRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/code", codeRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/user", userRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    dbConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString(),
  });
});

// 404 for unknown API routes
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler (e.g. multer file-type/size rejections)
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  },
);

// MongoDB connection — fail fast so the API still boots when the DB is down.
const connectDB = async () => {
  try {
    const uri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/ai-interview";
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    // Continue without DB - interview flow works in-memory; only analytics need it
  }
};

// Start listening only when not in a serverless environment (e.g., Vercel)
let server: any = null;
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV}`);
  });
} else {
  console.log("ℹ️ Server running in serverless environment");
}
connectDB();

// Release the port promptly on reload/shutdown so dev-watch restarts
// (tsx) don't hit EADDRINUSE.
const shutdown = () => {
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
  setTimeout(() => process.exit(0), 1500).unref();
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default app;

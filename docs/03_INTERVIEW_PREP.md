# Interview Preparation Guide — AI Interview Platform

> 100+ project-specific questions with detailed, interview-ready answers, grouped by area. Each major question includes likely **follow-ups** and ideal answers. Everything is grounded in the actual implementation.

---

## Part A — Project Overview

### A1. Explain the project in detail.
**Answer:** It's a full-stack AI-powered mock technical interview platform. A candidate picks a difficulty (easy/medium/hard), optionally uploads a PDF resume, and then goes through a timed 60-minute interview containing mixed question types — MCQs, "guess the output," debugging, DSA coding problems, behavioral (STAR), and resume deep-dives. During the session an AI interviewer ("Alex") chats with them, pinned to the current question; DSA questions get an in-browser Monaco editor whose code is executed via Judge0. A lightweight proctoring layer watches tab switches (webcam + MediaPipe face detection + ambient-noise detection). At the end, the full session is sent to an LLM that returns a structured rubric — overall score, grade, strengths/weaknesses, code-quality breakdown, section scores, and a hiring recommendation — rendered as a report with curated learning resources. Results optionally persist to MongoDB so a dashboard can chart progress over time.

**Architecture in one line:** a thick React/Vite client owns the interview experience; a thin Express/TypeScript server is a secure orchestrator for LLM calls (Groq/Llama-3.3-70B), code execution (Judge0), and persistence (MongoDB).

- *Follow-up: Why "thick client, thin server"?* → The session UX (timer, proctoring, editor, navigation) must feel instant and is purely presentational state, so it belongs client-side. The server only does what needs a secret key or a sandbox. That keeps the server stateless and horizontally scalable.

### A2. What problem does it solve?
**Answer:** Interview prep is usually fragmented — LeetCode for DSA, separate flashcards for theory, no behavioral practice, and no realistic "someone is watching and asking follow-ups" pressure. This unifies all of that into one timed, proctored, resume-aware mock that gives structured, actionable feedback — which is closer to a real on-site loop than any single tool.

- *Follow-up: Who's the user?* → Students and early-career devs prepping for SDE roles; also educators/recruiters running practice loops.

### A3. Why these technologies?
**Answer:**
- **React + Vite + TS** — component model fits a multi-panel live UI; Vite gives fast HMR; TS catches shape errors across the client/server boundary.
- **Express + TS** — minimal, well-understood orchestration layer; same language as the client lowers context-switching.
- **Groq (Llama-3.3-70B via OpenAI SDK)** — Groq's inference is extremely fast (low latency matters in a live interview) and the OpenAI-compatible SDK means I can swap providers by changing a `baseURL`.
- **Judge0/RapidAPI** — never run untrusted user code on my own server; Judge0 sandboxes 60+ languages.
- **MongoDB/Mongoose** — the AI evaluation is a nested, evolving JSON document; a document store avoids rigid migrations.
- **MediaPipe** — on-device face detection (no video leaves the browser → privacy + no server cost).
- **Monaco** — the VS Code editor engine, so the coding UX feels native.

- *Follow-up: Why not Gemini/OpenAI directly?* → Groq's speed-per-dollar for a 70B open model is excellent for interactive use, and the OpenAI-compatible endpoint means zero lock-in.

---

## Part B — Frontend (React / TypeScript / Vite)

### B1. How is global state managed and why Context over Redux?
**Answer:** A single `InterviewContext` holds the entire session — flags, questions, chat, editor, scoring, proctoring counters, identity. I chose Context because the app has *one* cohesive store consumed by a few routes, with no complex cross-slice updates that would justify Redux's boilerplate or middleware. All mutators are `useCallback`-memoized so the provider value stays stable.
- *Follow-up: Doesn't Context cause re-renders?* → Yes, any consumer re-renders on value change. It's acceptable here because the session is inherently a single fast-changing object and the consumer tree is small. If it grew, I'd split into multiple contexts (e.g. a stable "actions" context vs. a volatile "state" context) or move to Zustand for selector-based subscriptions.
- *Follow-up: How do you avoid stale closures?* → For values that change every tick but shouldn't re-subscribe effects (like the timer's `onExpire`), I store them in a ref updated each render and read `ref.current` inside the interval.

### B2. Walk me through the dual chat-history design.
**Answer:** I keep two parallel arrays: `chatHistory` (`{role, content, timestamp}`) for rendering bubbles, and `geminiHistory` (`{role, parts:[{text}]}`) in the LLM's expected shape. `addUserMessage`/`addAIMessage` append to both atomically. This separates presentation from the provider contract so I can change the UI without touching the API payload and vice-versa.
- *Follow-up: Why not derive one from the other?* → I could map at call time, but keeping the provider-shaped copy avoids re-mapping on every request and makes the "what we actually send" explicit.

### B3. How does the Results page survive a session reset?
**Answer:** On finish I call `navigate("/results", { state: getSessionData() })`, passing an **immutable snapshot** via router state. The Results page reads `location.state` first and only falls back to live context. So even after "Try Again" calls `resetSession()`, the displayed report is intact because it was rendered from the captured snapshot, not live state.

### B4. Explain the conditional layout in ArenaPage.
**Answer:** `isCodingQuestion = currentQuestion?.type === "dsa"`. DSA renders a 3-column IDE layout (question+chat center, Monaco+console right); all other types render a centered single column with the question and chat. One page handles every question type via this branch plus a per-type strategy inside `QuestionDetail`.

### B5. How does the Monaco editor get the right starter code?
**Answer:** `CodingPanel` has a `useEffect` keyed on `[currentQuestion?.id, language]`. If the question carries `starterCode[language]`, it loads that; else it falls back to `starterCode.python` or a per-language `DEFAULT_CODE` template. Changing language re-seeds appropriately.
- *Follow-up: Edge case if AI omits a language?* → It falls back to python starter, so the editor is never empty — a deliberate graceful default.

### B6. How is speech-to-text implemented?
**Answer:** `useSpeech` wraps the Web Speech API (`webkitSpeechRecognition || SpeechRecognition`). It's `continuous:false, interimResults:true`, accumulates only `isFinal` results, and feeds them to a callback that appends to the chat input. `isSupported` gates the mic button so unsupported browsers degrade cleanly.

### B7. How is text-to-speech for the interviewer done?
**Answer:** `speechOut.ts` uses `SpeechSynthesis`. It strips markdown, truncates to ~420 chars, picks a natural English voice (`preferVoice`), and handles the async `voiceschanged` event (voices load lazily in Chrome). `silenceInterviewerSpeech()` cancels on session end.

### B8. What animation library and why?
**Answer:** Framer Motion — declarative `initial/animate/exit` with `AnimatePresence` for modal mount/unmount, spring transitions, and the landing page's magnetic buttons / cursor trail using `useMotionValue` + `useSpring`. It keeps animation logic colocated and physics-based rather than hand-rolled CSS keyframes.

### B9. How do charts work on the dashboard?
**Answer:** Recharts. An `AreaChart` for the score trend, a `RadarChart` for skill dimensions (theory/coding/communication/behavioral/problem-solving), and a stepped area for MCQ hit-rate. The data comes from `GET /api/user/performance`, which aggregates the last 5 sessions server-side. The UI guards on `>= 2` points before showing a trend.

### B10. How does theming work?
**Answer:** A `dark` class on `document.documentElement` plus CSS variables (`--bg`, `--text`, `--card`, `--border`). Landing page reads/writes `localStorage.theme` and respects `prefers-color-scheme`. The arena forces dark for focus.

**More frontend Q (rapid):**
- *B11 Why Vite over CRA?* Faster cold start/HMR via native ESM + esbuild; smaller config; first-class TS.
- *B12 What's the Vite proxy for?* Dev-time `/api` → `:5000` so the client uses a relative base URL identical to prod.
- *B13 Why a custom MediaPipe sourcemap plugin in vite.config?* The npm package references a `.map` that doesn't ship; the plugin strips the broken `sourceMappingURL` to silence build warnings, and `optimizeDeps.exclude` keeps esbuild from pre-bundling the wasm.
- *B14 How are toasts handled?* `react-hot-toast` `<Toaster>` mounted once in `main.tsx`; `toast.success/error` from context actions.
- *B15 Why `useMemo` for `sessionData` in ResultsPage?* To freeze the snapshot once on mount and avoid re-evaluating effects on every render.
- *B16 How do you prevent double-persisting the interview?* A `didPersistInterview` ref guards the POST; it's only attempted when a real (non-fallback) evaluation exists and the email is valid.

---

## Part C — Backend (Express / Node / TypeScript)

### C1. Walk through the request pipeline.
**Answer:** `cors(allowedOrigins)` → `express.json({limit:'10mb'})`/`urlencoded` → `rateLimit` on `/api` → domain routers (`resume/interview/code/results/user`) → `/health` → `/api` 404 catch-all → global 4-arg error handler. Routers are thin; all logic and external calls live in controllers, which are the only place that read secrets from `process.env`.

### C2. Why controllers vs. routes separation?
**Answer:** Single-responsibility and testability. Routers only map HTTP verbs/paths to handlers; controllers own validation, orchestration, and external I/O. I can unit-test a controller without an HTTP server, and swap routing without touching logic.

### C3. How are LLM calls made and why the OpenAI SDK against Groq?
**Answer:** `new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" })`. Groq is OpenAI-API-compatible, so the same SDK and message format work. Provider swap = change `baseURL` + model name. The client is built lazily in `getClient()/getGrok()` so dotenv has populated env first, and so a missing key throws a clear error.

### C4. Explain the resume parsing flow.
**Answer:** `POST /api/resume/upload` with multer (`memoryStorage`, 10MB, PDF-only filter). `pdf-parse` extracts text; if <50 chars I reject as empty/scanned. The first 8000 chars go to the LLM with a strict prompt to return the top-2 projects as JSON. I extract the JSON via `text.match(/\{[\s\S]*\}/)`, parse it, and **normalize** `technologies` (the model sometimes returns a comma-string instead of an array).
- *Follow-up: Why memory storage not disk?* → The file is small, single-use, and immediately streamed to `pdf-parse`; memory avoids disk cleanup and is stateless-friendly.
- *Follow-up: Why only 8000 chars?* → Token/cost control; the relevant project info is near the top of most resumes and the prompt is tightly scoped.

### C5. How does code execution work against Judge0?
**Answer:** `runCode` maps the language to a Judge0 `language_id`, base64-encodes the source/stdin, POSTs to `/submissions?base64_encoded=true&wait=false` to get a **token**, then `pollResult` polls `/submissions/{token}` every 1.5s (max 10 attempts) until `status.id > 2` (past queued/processing). It decodes base64 stdout/stderr/compile_output and returns a normalized result. Axios errors map to 503, others to 500.
- *Follow-up: Why poll instead of `wait=true`?* → Synchronous `wait=true` can time out or be disabled on the free tier; async submit + poll is more reliable and lets me bound total wait.
- *Follow-up: Why base64?* → Source can contain arbitrary bytes/quotes/unicode; base64 guarantees safe transport through JSON and the API.

### C6. Explain the Java "Main class" normalization.
**Answer:** Judge0 writes the file as `Main.java`, so the public class must be `Main`. `normalizeJavaCode` finds `public class X`, and if `X !== Main` rewrites the declaration plus `new X(` and `X.` references to `Main`. **Audit note:** I fixed a regex bug where the member-access pattern `\bX.` left `.` unescaped (it could match `Xy`); it's now `\bX\.` so only `X.` is rewritten.

### C7. How is the final evaluation generated and parsed?
**Answer:** `evaluateSession` builds a prompt from session data (MCQ score, time, tab switches, last 10 chat turns, code submissions, proctoring counts) and asks for a strict JSON rubric at `temperature 0.3` (low for consistency). I extract `{…}` and `JSON.parse`. I added `max_tokens: 2000` so the large JSON can't truncate mid-object.
- *Follow-up: What if the model returns invalid JSON?* → The regex-extract + try/catch returns a 500, and the **client falls back** to `FALLBACK_EVALUATION` so the user always sees a report.

### C8. How does persistence + analytics work?
**Answer:** `POST /api/user/interviews` checks `mongoose.connection.readyState === 1`, validates email + numeric `overallScore`, **upserts** the `User` by email, inserts an `InterviewSession`, and `$inc`s `totalInterviews`. `GET /api/user/performance` finds the last 10 (sorted by `completedAt`), takes the last 5, and computes the score trend, MCQ-percentage trend, and an averaged skill radar (mapping `sectionScores` → dimensions).
- *Follow-up: Why upsert by email?* → No auth; email is the natural correlation key. Find-or-create keeps it idempotent across repeat sessions.

### C9. How does the app behave when the DB is down?
**Answer:** It still runs. Mongo connection failure is caught and logged; the API listens regardless (I moved `app.listen` ahead of `connectDB` and added a 5s `serverSelectionTimeoutMS`). The interview flow is fully in-memory client-side, so only analytics endpoints return 503, and `/health` reports `dbConnected:false`.

### C10. How are secrets and config handled?
**Answer:** `dotenv` loads `server/.env`; secrets are read at request time inside controllers. `.env.example` documents required vars. Only the server holds keys — the browser never sees them. **Audit note:** a real `.env` was historically committed; remediation is credential rotation + optional history scrub.

**More backend Q (rapid):**
- *C11 Why `express.json({limit:'10mb'})`?* Resume metadata + long chat/code payloads in `/evaluate` can be large; default 100kb would 413.
- *C12 Why rate-limit at 100/15min?* Sensible MVP guard against abuse of the expensive LLM/Judge0 routes; I'd add a stricter per-route limiter for `/code/run` in prod.
- *C13 How do you handle CORS for deploy?* Localhost defaults plus a comma-separated `CORS_ORIGINS` env var merged into the allow-list.
- *C14 Why is `evaluation` `Schema.Types.Mixed`?* The AI rubric shape can evolve; Mixed avoids migrations while indexes cover the queried scalar fields.
- *C15 What status codes do you return?* 400 (validation), 404 (unknown api), 500 (logic/parse), 502 (no Judge0 token), 503 (DB down / execution service unavailable).

---

## Part D — Database (MongoDB / Mongoose)

### D1. Describe the schema and relationships.
**Answer:** Two collections. `User` (unique lowercased indexed `email`, `name`, `resumeUrl?`, `totalInterviews`) and `InterviewSession` (`userId` ref, `difficulty`, `overallScore` indexed, `grade?`, `recommendation?`, Mixed `evaluation` + `sessionSnapshot`, embedded `proctoring {tab,face,noise}`, `completedAt` indexed). One user → many sessions via reference.

### D2. Why reference instead of embed sessions in the user?
**Answer:** Sessions are unbounded (a user could do hundreds) and queried independently (sorted by date, ranged). Embedding would grow the user document without bound and force loading all sessions to read one. Referencing keeps documents bounded and queries targeted.

### D3. Why embed `proctoring` but reference sessions?
**Answer:** `proctoring` is a small, fixed-shape value object that's always read with its session and never queried alone — a textbook embed. Sessions are a growing 1-N relationship — a textbook reference.

### D4. What indexes exist and why?
**Answer:** `email` (unique) for O(log n) user lookup; `userId` for per-user session fetch; `overallScore` and `completedAt` to support sorted analytics. These match the only two access patterns (find user by email, fetch & sort that user's recent sessions).

### D5. How would you evolve the schema safely?
**Answer:** New fields are additive (Mongo is schemaless at the storage layer). For required structural changes I'd version evaluations (`evaluationVersion`) and write a backfill script; reads tolerate both shapes (the UI already does, e.g. `behavioral ?? resumeDepth`).

- *Follow-up: How do you compute the radar safely across sessions with different rubric keys?* → `accumulateRadar` skips sessions lacking `sectionScores`, averages present keys, and falls back (`behavioral ?? resumeDepth ?? 0`) so partial data still yields a chart.

---

## Part E — AI / LLM integration

### E1. How do you keep the AI interviewer on-topic?
**Answer:** A strong system prompt defines persona "Alex" with non-negotiable rules to focus exclusively on `[CURRENT QUESTION]`, plus a per-message **context prefix** that injects the current question (marked "you MUST focus ONLY on this"), any submitted code, and resume project names. The current question is the highest-priority directive.
- *Follow-up: How do you inject submitted code?* → `submitCode` sends a review message with the code fenced, and passes `{submittedCode, language}` in context so the prompt prefix includes it for targeted feedback.

### E2. How do you get reliable JSON out of an LLM?
**Answer:** Three layers: (1) prompt says "Respond ONLY with valid JSON" with an exact schema; (2) `text.match(/\{[\s\S]*\}/)` extracts the first JSON object even if the model adds prose; (3) `try/catch` around `JSON.parse` with a fallback path. Plus low `temperature` (0.3) for evaluation and bounded `max_tokens` to avoid truncation.
- *Follow-up: How would you make this bulletproof?* → Use the provider's JSON/structured-output mode or function-calling with a schema, and validate with Zod; retry once on parse failure.

### E3. What temperatures do you use and why?
**Answer:** Evaluation/resume-extraction at 0.3 (deterministic, consistent scoring), chat at 0.7 (natural conversation), random question generation at 0.8 (variety). Lower = more repeatable; higher = more creative.

### E4. How do you control cost/latency?
**Answer:** Truncate resume to 8k chars, bound `max_tokens`, send only the last 10 chat turns to the evaluator and last 40 to persistence, and keep a static question bank as a free fallback so the LLM isn't on the critical path for basic flows.

---

## Part F — Proctoring / Anti-cheat

### F1. How does tab-switch detection work?
**Answer:** `useAntiCheat` listens to `window blur` and `document visibilitychange`. Each focus loss calls `onTabSwitch` (increments a counter) and shows a warning. At `MAX_TAB_SWITCHES = 5` it triggers `onTerminate`, which ends the session and routes to results with the snapshot.

### F2. How does face presence detection work without a server?
**Answer:** MediaPipe `FaceDetector` (BlazeFace short-range, CPU delegate) runs in a `requestAnimationFrame` loop on the webcam `<video>`. Zero faces for ≥3s fires a "missing" presence issue; >1 face for ≥3s fires "multiple." A 55s cooldown prevents alert spam. All inference is on-device — no video leaves the browser.
- *Follow-up: Why on-device?* → Privacy (no video upload), zero server cost, and low latency.

### F3. How does noise detection work?
**Answer:** A WebAudio `AnalyserNode` computes RMS of the mic's time-domain data each frame; sustained RMS over threshold for 7s logs a noise alert (45s cooldown). It's framed to the user as *context, not punishment*.

### F4. How are these monitors cleaned up?
**Answer:** Each effect returns a cleanup that cancels `requestAnimationFrame`, stops all `MediaStream` tracks, and closes the `AudioContext`, preventing the camera/mic light from staying on after the session.

- *Follow-up: How robust is this proctoring really?* → Deliberately "interview-discipline," not exam-grade. It's browser-dependent and defeatable (second device, external monitor). I documented it as a lightweight deterrent, and the production path would add server-side event logging and possibly a secure proctoring vendor.

---

## Part G — Security

### G1. Biggest security issues you found auditing this?
**Answer:** (1) `node_modules`/`dist` and a real `.env` were committed to git — the `.env` in history means any keys it held are leaked and must be rotated; (2) no authentication, so analytics are email-spoofable. I fixed the tracking and `.gitignore`, documented credential rotation, and specced an auth upgrade path.

### G2. How do you safely run untrusted user code?
**Answer:** I never execute it on my server — it goes to Judge0, an isolated sandbox with CPU/memory/time limits, over base64. The app server only proxies.

### G3. How is file upload secured?
**Answer:** multer memory storage, 10MB cap, and a `fileFilter` that rejects anything but `application/pdf`. The global error handler now surfaces multer rejections cleanly.

### G4. What would you add for production security?
**Answer:** Auth (magic-link/OTP → JWT/HTTP-only cookie), per-route rate limits on LLM/exec endpoints, Helmet for security headers, request schema validation (Zod), secret rotation + a secrets manager, and audit logging.

---

## Part H — Deployment / DevOps / Build

### H1. How do you build and deploy?
**Answer:** Client `vite build` → static `dist/` on a CDN/static host (Vercel/Netlify). Server `tsc` → `node dist/index.js` on a Node host (Render/Railway/Fly). Set `CORS_ORIGINS` to the SPA URL and provide the env keys. `/health` (with `dbConnected`) backs liveness/readiness probes.

### H2. How does the client find the API in prod vs dev?
**Answer:** The client always calls a relative `/api`. In dev, Vite proxies to `:5000`; in prod, the SPA is served behind a reverse proxy that routes `/api` to the Node service (or the base URL is set to the API origin and CORS allows it).

### H3. What's your env strategy?
**Answer:** `.env` is gitignored; `.env.example` is the documented contract; secrets live only on the server host's env. Optional `CORS_ORIGINS` and dual `GROQ_API_KEY`/`XAI_API_KEY` support.

---

## Part I — Testing & Quality

### I1. The project has no tests — what would you add first?
**Answer:** Pure-logic units first (highest ROI, no mocks): `normalizeJavaCode`, the JSON-extraction helper, and the analytics math in `getUserPerformance`. Then controller tests with mocked Groq/Judge0/Mongoose, then a Playwright E2E for the happy path (start → answer → submit code → results).

### I2. How would you test the LLM-dependent endpoints deterministically?
**Answer:** Inject the OpenAI client (dependency injection) so tests pass a stub returning canned JSON; assert parsing, normalization, and error/fallback paths — never hit the real API in unit tests.

---

## Part J — TypeScript / Code Quality

### J1. How is type safety maintained across the boundary?
**Answer:** Shared shapes are declared in `lib/api.ts` (`Project`, `ChatMessage`, `EvaluationResult`, etc.) and mirrored by server interfaces. Both `tsconfig`s use `strict`. Errors are typed `unknown` and narrowed (`err instanceof Error`, `axios.isAxiosError`).

### J2. Where do you use refs to avoid re-renders/stale closures?
**Answer:** `useTimer.onExpireRef` (so the interval doesn't resubscribe each tick — a bug I fixed), and `useAntiCheat`'s callback refs (`onTerminateRef` etc.) plus timing refs (`absenceStartRef`, `noiseHighSinceRef`) that must persist across frames without causing renders.

---

*(Continued in [04_SYSTEM_DESIGN.md](04_SYSTEM_DESIGN.md) for scaling/system-design questions and [06_CHEAT_SHEET.md](06_CHEAT_SHEET.md) for one-line rapid recall.)*

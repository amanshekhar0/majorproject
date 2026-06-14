# System Architecture Documentation

**Project:** AI Interview Platform
**Stack:** React 18 + Vite + TypeScript (client) · Node + Express + TypeScript (server) · MongoDB/Mongoose · Groq (Llama-3.3-70B) · Judge0/RapidAPI · MediaPipe

---

## 1. High-level architecture

```
                         ┌───────────────────────────────────────────────┐
                         │                  BROWSER (SPA)                 │
                         │  React 18 + Vite + Tailwind + Framer Motion    │
                         │                                                │
                         │  Pages: Landing · Arena · Results · Dashboard  │
                         │  State: InterviewContext (React Context)       │
                         │  Media: MediaPipe FaceDetector, WebAudio,      │
                         │         Web Speech (STT/TTS), Monaco editor     │
                         └───────────────┬───────────────────────────────┘
                                         │  axios  (baseURL "/api")
                                         │  Vite dev proxy → :5000
                                         ▼
                         ┌───────────────────────────────────────────────┐
                         │             EXPRESS API  (port 5000)           │
                         │  cors · json(10mb) · express-rate-limit        │
                         │                                                │
                         │  /api/resume      → parse PDF + extract        │
                         │  /api/interview   → chat / generate questions  │
                         │  /api/code        → run code                   │
                         │  /api/results     → evaluate session           │
                         │  /api/user        → save / analytics           │
                         └───┬───────────────┬───────────────┬────────────┘
                             │               │               │
              ┌──────────────▼───┐   ┌───────▼────────┐  ┌───▼─────────────┐
              │   Groq LLM API   │   │ Judge0 (Rapid) │  │   MongoDB Atlas  │
              │ llama-3.3-70b    │   │ code execution │  │ Users, Sessions  │
              │ (OpenAI SDK,     │   │ base64 submit  │  │ (Mongoose ODM)   │
              │  Groq baseURL)   │   │ + poll token   │  │                  │
              └──────────────────┘   └────────────────┘  └──────────────────┘
```

**Design stance:** a "thick client, thin orchestrating server." The interview *experience* (timer, proctoring, question navigation, chat UI, editor) lives entirely in the browser for responsiveness; the server is a **secure proxy + orchestrator** for everything that needs a secret key or sandboxing (LLM calls, code execution) plus optional persistence.

---

## 2. Frontend architecture

```
client/src
├── main.tsx                 # ReactDOM root, BrowserRouter, Toaster
├── App.tsx                  # Routes + InterviewProvider wrapper
├── context/
│   └── InterviewContext.tsx # SINGLE source of truth for a session
├── pages/
│   ├── LandingPage.tsx      # marketing hero + ResumeModal launcher
│   ├── ArenaPage.tsx        # the live interview (layout + orchestration)
│   ├── ResultsPage.tsx      # AI report + persistence + resources
│   └── DashboardPage.tsx    # historical analytics (recharts)
├── components/
│   ├── ResumeModal.tsx      # difficulty → profile → resume wizard
│   ├── QuestionPanel.tsx    # left rail question list
│   ├── ChatPanel.tsx        # AI interviewer chat + mic
│   ├── CodingPanel.tsx      # Monaco editor + console
│   └── ProctorOverlay.tsx   # PIP webcam + warning/terminate modals
├── hooks/
│   ├── useTimer.ts          # 60-min countdown, urgency, elapsed
│   ├── useAntiCheat.ts      # tab/visibility + face + noise monitors
│   └── useSpeech.ts         # Web Speech STT (and a speak helper)
├── lib/api.ts               # typed axios client (all endpoints)
├── data/
│   ├── questions.ts         # static question bank by difficulty
│   └── resources.ts         # GFG/YouTube learning links
└── utils/speechOut.ts       # interviewer TTS (voice selection)
```

**Component composition (Arena):**

```
ArenaPage
├── Header (timer, tab-switch badge, submit/end)
├── QuestionPanel        (sidebar)
├── QuestionDetail       (center — MCQ / behavioral / text / DSA prompt)
├── ChatPanel            (AI interviewer)
├── CodingPanel          (only when currentQuestion.type === "dsa")
└── ProctorOverlay       (webcam PIP + modals)
```

**Rendering rule:** the layout branches on `currentQuestion.type === "dsa"` — DSA shows a 3-column IDE layout; everything else shows a centered single column. This keeps a single page responsible for all question types.

---

## 3. Backend architecture

```
server/src
├── index.ts                 # app bootstrap, middleware, routes, DB, error handling
├── routes/                  # thin routers, one per domain
│   ├── resume.ts            # POST /upload  (multer single 'resume')
│   ├── interview.ts         # POST /chat, /generate-questions, /generate-random
│   ├── code.ts              # POST /run
│   ├── results.ts           # POST /evaluate
│   └── user.ts              # POST /interviews, GET /performance
├── controllers/             # all business logic + external calls
│   ├── resumeController.ts        # pdf-parse → LLM project extraction
│   ├── interviewerController.ts   # chat + question generation
│   ├── codeController.ts          # Judge0 submit/poll + Java normalize
│   ├── resultsController.ts       # rubric evaluation
│   └── userInterviewController.ts # persistence + analytics aggregation
└── models/                  # Mongoose schemas
    ├── User.ts
    └── InterviewSession.ts
```

**Layering:** `route → controller → (external API | Mongoose model)`. Controllers are the only place that touch `process.env` secrets and external services. Routers carry no logic. This is a classic **MVC-without-views** REST design.

**Cross-cutting middleware (order matters):**
1. `cors(allowedOrigins)`
2. `express.json({ limit: "10mb" })` / `urlencoded`
3. `rateLimit` mounted on `/api`
4. domain routers
5. `/health`
6. `/api` 404 catch-all
7. global error handler (4-arg)

---

## 4. Database design & relationships

```
┌────────────────────────┐         ┌───────────────────────────────────┐
│         User           │ 1     N │        InterviewSession           │
├────────────────────────┤◄────────┤───────────────────────────────────┤
│ _id            ObjectId│ userId  │ _id              ObjectId         │
│ name           String  │         │ userId  (ref User, indexed)       │
│ email  (uniq,  String) │         │ difficulty       String           │
│        lowercase, idx) │         │ overallScore     Number (indexed) │
│ resumeUrl      String? │         │ grade            String?          │
│ totalInterviews Number │         │ recommendation   String?          │
│ timestamps             │         │ evaluation       Mixed            │
└────────────────────────┘         │ sessionSnapshot  Mixed            │
                                   │ proctoring       {tab,face,noise} │
                                   │ completedAt      Date (indexed)   │
                                   │ timestamps                        │
                                   └───────────────────────────────────┘
```

- **Cardinality:** one user → many sessions (`userId` reference, not embedding — sessions are unbounded and queried independently).
- **Index strategy:** `email` (unique lookup), `userId` (per-user session fetch), `overallScore` & `completedAt` (sorting trends).
- **Why MongoDB:** the AI `evaluation` payload is a nested, evolving JSON rubric — a document store avoids rigid migrations. Analytics only need "last N sessions for this user," a simple indexed range query.

---

## 5. Authentication & authorization flow

This MVP uses **lightweight identity, not authentication.**

```
ResumeModal (profile step)
   └─ user types name + email  ──►  InterviewContext.setCandidateIdentity
                                        └─ persisted to localStorage
ResultsPage (after evaluation)
   └─ if email matches /…@…\.…/  ──►  POST /api/user/interviews
                                        └─ server upserts User by email
DashboardPage
   └─ user re-enters email      ──►  GET /api/user/performance?email=…
```

- **No password / token.** The email is a *correlation key*, not a verified credential.
- **Authorization:** none — anyone who knows an email can read that email's analytics. Documented as a deliberate MVP trade-off.
- **Production upgrade path:** magic-link or OTP email verification → issue a signed JWT/HTTP-only session cookie → middleware guards `/api/user/*` and derives `email` from the token instead of the query string.

---

## 6. API communication flow

All client calls go through `lib/api.ts` (typed axios). Two axios instances exist: a shared `API` (baseURL `/api`, 30s timeout) and ad-hoc calls for multipart upload (60s). The Vite dev server proxies `/api` to `:5000`.

| Concern | Mechanism |
|---------|-----------|
| Transport | HTTPS/JSON (multipart for resume) |
| Base URL | relative `/api` → same-origin in prod, proxied in dev |
| Timeouts | 30s default, 60s upload |
| Errors | controllers return typed `{ error }` with proper status codes; client catches → toasts / fallbacks |
| Auth | none (email in body/query) |

---

## 7. State management approach

**React Context (`InterviewContext`) as a single session store** — deliberately chosen over Redux/Zustand because the state is **one cohesive session object** with no cross-route fan-out beyond it.

State buckets: session flags (`sessionStarted/Ended/terminated/timeUsed`), config (`difficulty`), content (`projects`, `questions`, `currentIndex`), chat (`chatHistory` for UI + `geminiHistory` in LLM format), editor (`code/language/terminalOutput`), scoring (`mcqAnswers`, `codeSubmissions`), proctoring counters (`tabSwitchCount/faceViolationCount/noiseAlertCount`), and identity.

Key patterns:
- **Dual chat history:** human-readable `chatHistory` (for bubbles) and provider-shaped `geminiHistory` (`{role, parts:[{text}]}`) kept in sync by `addUserMessage`/`addAIMessage`.
- **Snapshot hand-off:** `getSessionData()` is passed via `navigate("/results", { state })` so the report renders from an immutable snapshot even after `resetSession()`.
- **Persistence:** identity mirrored to `localStorage` via `useEffect`.
- **Callbacks memoized** with `useCallback` to keep context value stable.

---

## 8. Design patterns used

| Pattern | Where |
|---------|-------|
| **MVC (no views)** | routes (controller mapping) → controllers → models |
| **Provider / Context** | `InterviewProvider` exposing a typed hook `useInterview()` |
| **Custom hooks (behavior encapsulation)** | `useTimer`, `useAntiCheat`, `useSpeech` |
| **Adapter / Anti-corruption layer** | server wraps Groq + Judge0 so the client sees one clean API shape |
| **Strategy (by question type)** | `QuestionDetail` renders different UIs per `type` |
| **Façade** | `lib/api.ts` hides axios/transport details behind typed functions |
| **Polling** | `pollResult` for Judge0 async tokens |
| **Graceful degradation / Fallback** | static question bank, `FALLBACK_EVALUATION`, DB-optional flow |
| **Singleton-ish client factory** | `getClient()/getGrok()` build the OpenAI client at call time |
| **Ref-as-latest-value** | `onExpireRef`, callback refs in `useAntiCheat` |

---

## 9. Scalability considerations

- **Stateless API** — no in-memory session on the server; horizontally scalable behind a load balancer.
- **Offloaded heavy work** — LLM inference (Groq) and code execution (Judge0) are external, so the Node process stays light and I/O-bound.
- **Client-held session** — interview state lives in the browser, so the server does no per-user memory work during a session.
- **Bottlenecks today:** LLM latency/cost (evaluation, question gen) and Judge0 throughput/quota. Both are mitigated with caching, queues, and backoff (see System Design doc).
- **DB:** read-light, append-mostly; indexed for the only two access patterns. Scales to sharding by `userId` if ever needed.

---

## 10. Security measures implemented

- **Secrets server-side only** — no API key ever reaches the browser; the client talks to `/api`.
- **Sandboxed execution** — user code runs in Judge0, never on the app server.
- **Upload hardening** — multer memory storage, 10MB cap, PDF-only `fileFilter`.
- **Rate limiting** — 100 req / 15 min per IP on `/api`.
- **Input validation** — email format, required fields, numeric score checks before DB writes.
- **CORS allow-list** — explicit origins (now env-extensible).
- **Base64 transport to Judge0** — safe handling of arbitrary source bytes.
- **Body size limit** — 10mb JSON/urlencoded cap.

*Known gaps (documented):* no auth, secrets were historically committed (rotate), no per-route LLM rate limit. See audit report.

---

## 11. Deployment architecture

```
        ┌────────────────────────────────────────────────────────┐
        │                       Internet                         │
        └───────────────┬───────────────────────┬────────────────┘
                        │ static SPA             │ /api/*
                        ▼                        ▼
        ┌───────────────────────┐   ┌─────────────────────────────┐
        │  Static host / CDN    │   │  Node host (Render/Railway/ │
        │  (Vercel/Netlify)     │   │  Fly/EC2) — Express :5000   │
        │  client `dist/`       │   │  env: GROQ/RAPIDAPI/MONGO   │
        └───────────────────────┘   └───────────────┬─────────────┘
                                                     │
                                ┌────────────────────┼───────────────────┐
                                ▼                    ▼                   ▼
                        Groq LLM API         Judge0 / RapidAPI     MongoDB Atlas
```

- **Build:** `client` → `vite build` → static `dist/`; `server` → `tsc` → `dist/` → `node dist/index.js`.
- **Config:** set `CORS_ORIGINS` to the deployed SPA URL; point the SPA's `/api` to the API origin (reverse proxy or absolute base URL).
- **Health:** `/health` exposes `dbConnected` for liveness/readiness probes.

---

## 12. Request lifecycle — "Run my code" (end to end)

```
1. User clicks "Run Code" in CodingPanel
2. InterviewContext.runCodeFn() → setIsRunning(true), terminal "⏳ Running..."
3. lib/api.executeCode(code, language) → axios POST /api/code/run
4. Vite proxy → Express :5000 → rateLimit → code router → codeController.runCode
5. Validate code+language → map to Judge0 language_id → (Java) normalizeJavaCode
6. POST Judge0 /submissions?base64_encoded=true&wait=false  → receive {token}
7. pollResult(token): GET /submissions/{token} every 1.5s until status.id > 2
8. Decode base64 stdout/stderr/compile_output → respond {success, stdout, …}
9. Client formats terminal output (compiler / stdout / stderr) → setTerminalOutput
10. setIsRunning(false) → UI shows result
```

And the **full interview lifecycle**:

```
Landing → ResumeModal(difficulty→profile→resume)
   → [upload? parse PDF + extract projects + generate resume Qs]
   → startSession(questions) → navigate /arena
Arena: useTimer starts · useAntiCheat starts (webcam+face+noise+tab)
   per question: answer MCQ/text/behavioral OR write+run+submit code
   chat with AI interviewer (context-pinned to current question)
   proctoring violations increment counters; 5 tab switches → terminate
Submit/Expire/Terminate → endSession → navigate /results with snapshot
Results: POST /evaluate → render report; if email valid → POST /user/interviews
Dashboard: GET /user/performance?email → trend + radar + MCQ charts
```

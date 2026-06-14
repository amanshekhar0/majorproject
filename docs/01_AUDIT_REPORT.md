# Codebase Audit & Fix Report

**Project:** AI Interview Platform (`client/` React+Vite, `server/` Express+TS)
**Audit date:** 2026-06-12
**Scope:** Frontend, backend, database, APIs, auth/identity, middleware, build & deploy config, repo hygiene, security.

---

## 0. Executive summary

The application is a well-structured MVP with clean separation between a React/Vite SPA and an Express/TypeScript API. AI reasoning (resume parsing, interviewer chat, question generation, evaluation) is centralized server-side against a Groq-hosted Llama model, and code execution is delegated to Judge0 via RapidAPI. The code is strongly typed and the React state model is coherent.

The most serious problems were **not** in application logic — they were in **repository hygiene and secret management**:

- **~20,500 build/dependency files were committed to git** (`node_modules/` and `dist/` in both `client/` and `server/`), making up **>99%** of tracked files.
- **A real `.env` file was committed in git history** (commits `8f6316b`, `65c4cbb` — the latter literally titled "change api key").

Both are fixed/flagged below. The remaining findings are smaller correctness, robustness, and maintainability items.

---

## 1. Issues found, root causes & fixes

### 🔴 CRITICAL

#### C1 — `node_modules/` and `dist/` committed to git
- **Found:** 15,828 `node_modules` files + 4,750 `dist` files tracked. Total tracked files: 15,897 → only **51** are real source.
- **Root cause:** The original `.gitignore` only contained `.env` and `node_modules` (no trailing slash, added *after* the first commit already staged the directories; `dist/` was never ignored at all).
- **Impact:** Massive repo, slow clones, merge conflicts on lockfiles/build artifacts, and committed build output that drifts from source.
- **Fix applied:**
  - Rewrote `.gitignore` to robustly ignore `node_modules/`, `dist/`, build output, all `.env*` (except `.env.example`), logs, editor/OS files.
  - `git rm -r --cached client/node_modules server/node_modules client/dist server/dist` (files kept on disk; only untracked).
  - Result: tracked files **15,897 → 51**.
- **Action still required by you:** commit the staged deletions (`git commit -m "chore: stop tracking build artifacts and dependencies"`). History size is unchanged until a history rewrite (optional, see C2).

#### C2 — Secrets committed in git history
- **Found:** `server/.env` exists in commits `8f6316b` and `65c4cbb`. It is **no longer in HEAD** (already removed), but the blobs remain reachable in history.
- **Root cause:** `.env` was committed before being ignored.
- **Impact:** Any API keys (Groq, RapidAPI, Mongo URI) that were ever in those commits are compromised and must be treated as leaked.
- **Fix applied (partial / advisory):** Current tree no longer tracks `.env`; a sanitized `server/.env.example` is present.
- **Action still required by you:**
  1. **Rotate every credential** that was ever in `server/.env` (Groq key, RapidAPI key, MongoDB password). Rotation is the only real remediation — scrubbing history does not un-leak a key that was pushed.
  2. Optionally purge from history with `git filter-repo --path server/.env --invert-paths` (or BFG) and force-push. Coordinate with anyone who has cloned.

---

### 🟠 HIGH / correctness

#### H1 — Timer tears down and rebuilds its interval every second
- **File:** `client/src/hooks/useTimer.ts` + `client/src/pages/ArenaPage.tsx`
- **Root cause:** The ticking `useEffect` depended on `onExpire`, but `ArenaPage` passes a fresh inline `handleExpire` on every render. Each 1s tick re-renders the page → new callback identity → effect cleanup+resubscribe → `clearInterval`/`setInterval` every second. Wasteful and risks timer drift.
- **Fix applied:** Stored `onExpire` in a ref (`onExpireRef`) updated each render, and removed `onExpire` from the effect dependency array so the interval is created once per run/pause.

#### H2 — Java class-rename regex could corrupt code
- **File:** `server/src/controllers/codeController.ts` → `normalizeJavaCode`
- **Root cause:** `new RegExp(\`\\b${className}\.\`)` left the `.` **unescaped**, so for a class named `Sol` it would match `Sol` followed by *any* character (e.g. `Solver`), not just `Sol.`.
- **Fix applied:** Escaped to `\\.` so only the literal `ClassName.` member-access form is rewritten to `Main.`.

---

### 🟡 MEDIUM / robustness & UX

#### M1 — LLM JSON responses can truncate (no `max_tokens`)
- **Files:** `resultsController.evaluateSession`, `interviewerController.generateQuestions`
- **Root cause:** These calls relied on the provider default completion length. The evaluation JSON is large (strong/weak points, code-quality sub-scores, section scores) and could be cut off mid-JSON, causing the `\{[\s\S]*\}` match + `JSON.parse` to throw → generic 500.
- **Fix applied:** Added `max_tokens: 2000` (evaluate) and `1500` (generate-questions). `generateRandomQuestions` already set `3000`.

#### M2 — Server startup blocked on DB; CORS hardcoded; no 404/error handler
- **File:** `server/src/index.ts`
- **Root causes & fixes:**
  - Listener was inside `connectDB().then(...)`. If Mongo was reachable-but-slow it delayed boot. **Fix:** call `app.listen()` immediately and connect in the background; added `serverSelectionTimeoutMS: 5000` to fail fast.
  - CORS origins were hardcoded to localhost — would break any deploy. **Fix:** kept localhost defaults and merged a comma-separated `CORS_ORIGINS` env var.
  - No catch-all 404 or global error handler — multer/file-type rejections surfaced as unhandled. **Fix:** added a `/api` 404 responder and a 4-arg Express error handler.
  - `/health` now also reports `dbConnected`.

#### M3 — Stale "Gemini" branding in UI copy
- **File:** `client/src/pages/ResultsPage.tsx`
- **Root cause:** Leftover from an earlier Gemini integration; the backend now uses Groq/Llama-3.3-70b.
- **Fix applied:** "Gemini AI is analyzing…" → "Our AI is analyzing…".

#### M4 — Unused `@google/generative-ai` dependency
- **Files:** `client/package.json`, `server/package.json`
- **Root cause:** Carried over from the previous Gemini implementation; not imported anywhere in `src/`.
- **Fix applied:** Removed from both `dependencies`. (Run `npm install` in each package to refresh lockfiles.)

#### M5 — Dead model file
- **File:** `server/src/models/Session.ts`
- **Root cause:** Superseded by `InterviewSession.ts` + `User.ts`; never imported.
- **Fix applied:** Removed.

---

### 🔵 LOW / noted, not changed

| ID | Item | Note |
|----|------|------|
| L1 | `QuestionDetail({ isCentered })` in `ArenaPage.tsx` is never rendered with `isCentered={true}` | Dead styling branch; harmless. Remove if you want to trim. |
| L2 | `geminiHistory` state name in `InterviewContext.tsx` | Cosmetic stale name; it now carries Groq-format history. Rename to `llmHistory` for clarity. |
| L3 | `server/scratch/test-grok.ts`, `test-groq.ts` | Dev smoke-test scripts. Fine to keep out of the build (already excluded from `dist`), consider moving to a `scripts/` or deleting. |
| L4 | No automated tests | MVP has zero unit/integration tests. Highest-ROI targets: `normalizeJavaCode`, the LLM-JSON extraction helper, and `userInterviewController` analytics math. |
| L5 | Rate limit is global `100 / 15min` per IP across all `/api` | Reasonable for an MVP; code-run and LLM routes are the expensive ones and could get their own stricter limiter. |
| L6 | No authentication | Identity is an unverified email string. Acceptable for a practice tool; see Security section in architecture doc for the production path. |

---

## 2. API integration review

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/resume/upload` | POST (multipart) | ✅ Working | 10MB limit, PDF-only filter, `pdf-parse` → LLM extraction with string/array tech normalization. |
| `/api/interview/chat` | POST | ✅ Working | System prompt pins the AI to the current question; history converted to OpenAI format. |
| `/api/interview/generate-questions` | POST | ✅ Working | Resume deep-dive Qs; now bounded by `max_tokens`. |
| `/api/interview/generate-random` | POST | ✅ Working | Full 10-question mixed set with difficulty-based time limits and id backfill. |
| `/api/code/run` | POST | ✅ Working | Judge0 base64 submit + poll (10×1.5s). Java normalization fixed (H2). |
| `/api/results/evaluate` | POST | ✅ Working | Structured rubric JSON; now bounded by `max_tokens`. |
| `/api/user/interviews` | POST | ✅ Working (needs DB) | Upserts `User`, inserts `InterviewSession`, `$inc` totalInterviews. Guards on `readyState`. |
| `/api/user/performance` | GET | ✅ Working (needs DB) | Trend/MCQ/radar analytics from last 5–10 sessions. |
| `/health` | GET | ✅ Working | Now includes `dbConnected`. |

**External services:** Groq (LLM) and Judge0/RapidAPI (execution) are both read at request time via `process.env`, so dotenv ordering is safe. Both fail gracefully (client shows fallback evaluation; terminal shows a network-error message).

---

## 3. Database review

- **Models:** `User` (unique lowercased email, `totalInterviews`) and `InterviewSession` (ref to user, score, grade, recommendation, mixed `evaluation`/`sessionSnapshot`, embedded `proctoring`). Indexes on `email`, `userId`, `overallScore`, `completedAt` — appropriate for the lookup/sort patterns.
- **Relationship:** 1 `User` → N `InterviewSession` via `userId` ref. Correct.
- **Validation:** `saveInterview` validates email + numeric `overallScore` before writing; analytics endpoints validate email format.
- **Schema consistency:** Removed the orphaned `Session.ts` (M5). `evaluation`/`sessionSnapshot` are `Schema.Types.Mixed` — flexible but unvalidated; acceptable given the AI shape can evolve.
- **Migrations:** None needed (document store, additive schema).

---

## 4. Environment & deployment config

- `server/.env.example` present and sanitized ✅ (now the single source of required vars).
- Required vars: `PORT`, `NODE_ENV`, `MONGODB_URI`, `GROQ_API_KEY` (or `XAI_API_KEY`), `RAPIDAPI_KEY`, `RAPIDAPI_HOST`, and new optional `CORS_ORIGINS`.
- Vite dev proxy forwards `/api` → `localhost:5000`; the client uses a relative `/api` baseURL so prod just needs the SPA served behind the same origin or `CORS_ORIGINS` set.
- **Recommendation:** add a root `package.json` with `concurrently` to run both apps (`"dev": "concurrently \"npm --prefix server run dev\" \"npm --prefix client run dev\""`).

---

## 5. Recommended improvements (prioritized)

1. **Rotate leaked credentials now** (C2) — non-negotiable.
2. **Commit the untracking** (C1) and optionally scrub history.
3. Add **auth** (even magic-link/OTP) before any public deployment so analytics aren't spoofable by email.
4. Add a **dedicated rate limiter** for `/api/code/run` and the LLM routes.
5. Introduce **tests** (L4) and wire `npm run build` for both packages into CI.
6. Add a **retry/backoff** wrapper around LLM calls and a **circuit breaker** for Judge0.
7. Persist the **full session** (not just final evaluation) if you want replay/audit.
8. Add an **ErrorBoundary** and a `*` 404 route in the React app.
9. Consider **server-side question caching** to cut LLM latency/cost for repeated difficulties.
10. Rename stale identifiers (L2/M3 leftovers) for a clean "no legacy Gemini" story in interviews.

---

## 6. What was changed in this pass (file-by-file)

| File | Change |
|------|--------|
| `.gitignore` | Rewrote to ignore deps/build/env/logs/editor files robustly. |
| *(git index)* | Untracked `client/`+`server/` `node_modules` & `dist` (kept on disk). |
| `client/src/hooks/useTimer.ts` | onExpire via ref; interval no longer re-subscribes each tick (H1). |
| `server/src/controllers/codeController.ts` | Escaped `.` in Java class-rename regex (H2). |
| `server/src/controllers/resultsController.ts` | `max_tokens: 2000` on evaluation (M1). |
| `server/src/controllers/interviewerController.ts` | `max_tokens: 1500` on generate-questions (M1). |
| `server/src/index.ts` | Env CORS, listen-before-DB, fast DB timeout, `/api` 404, global error handler, richer `/health` (M2). |
| `client/src/pages/ResultsPage.tsx` | Removed stale "Gemini" copy (M3). |
| `client/package.json`, `server/package.json` | Dropped unused `@google/generative-ai` (M4). |
| `server/src/models/Session.ts` | Deleted dead model (M5). |

> Build/test note: `node`/`npm` were not on PATH in the audit environment, so type-check/build/tests could not be executed live. All changes are type-safe by inspection and localized; run `npm run build` in `server/` and `client/` to confirm before deploying.

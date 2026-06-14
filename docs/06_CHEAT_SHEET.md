# Interview Cheat Sheet — AI Interview Platform

> One-page rapid recall. Skim this 10 minutes before the interview.

---

## The 10-second description
Full-stack AI mock-interview platform: timed, proctored, resume-aware interviews with a live AI interviewer, in-browser sandboxed code execution, and an AI-generated scored report. **Thick React client, thin stateless Express server.**

## Stack (memorize)
| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind, Framer Motion, Monaco, Recharts, MediaPipe |
| Backend | Node, Express, TypeScript, Mongoose, Multer, express-rate-limit |
| AI | Groq → Llama-3.3-70B via **OpenAI SDK** (baseURL swap) |
| Execution | Judge0 via RapidAPI |
| DB | MongoDB (User 1-N InterviewSession) |

## The 3 things that make it interesting (lead with these)
1. **LLM orchestration** — one model, 4 jobs (resume parse, interviewer chat, question gen, scoring); strict JSON + fallback; temp 0.3 scoring / 0.7 chat / 0.8 gen.
2. **Security** — untrusted code → Judge0 sandbox (base64, submit+poll); proctoring on-device (no video uploaded); secrets server-only.
3. **Resilience & scale** — stateless server (session lives in browser); graceful degradation (DB down → still works; AI down → static bank + fallback report).

## Architecture one-liner
> CDN-served React SPA holds session state → stateless Express API orchestrates Groq (LLM), Judge0 (exec), MongoDB (persist). Horizontally scalable; external services do the heavy compute.

## Request lifecycle (code run)
`CodingPanel → context.runCode → api.executeCode → POST /api/code/run → map lang_id → (java) normalize → Judge0 base64 submit → poll token (1.5s×10) → decode → terminal`

## Data model
- **User**: `email`(unique idx), name, resumeUrl, totalInterviews
- **InterviewSession**: `userId`(ref), difficulty, `overallScore`(idx), grade, recommendation, evaluation(Mixed), sessionSnapshot(Mixed), proctoring{tab,face,noise}, `completedAt`(idx)
- Reference (not embed) sessions: unbounded + queried independently. Embed proctoring: small fixed value object.

## State management
Single `InterviewContext`; dual chat history (UI `chatHistory` + LLM-shaped `geminiHistory`); snapshot passed via router `state` to Results so it survives `resetSession`.

## Proctoring
Tab/visibility (5 strikes → terminate) · MediaPipe face (0 faces 3s = missing, >1 = multiple, 55s cooldown) · WebAudio RMS noise (7s hold, 45s cooldown). All on-device.

## Top bugs I fixed in the audit (great "tell me about a bug" stories)
1. **Timer re-subscribed its interval every second** — `useEffect` depended on a non-memoized `onExpire`; fixed with a value ref + removed it from deps.
2. **Java rename regex** `\bX.` had an **unescaped dot** (matched `Xy`); fixed to `\bX\.`.
3. **LLM JSON truncation** — added `max_tokens` to evaluation/question-gen.
4. **Repo hygiene** — `node_modules`+`dist`+`.env` committed; untracked 15.8k files (→51), rewrote `.gitignore`, flagged secret rotation.
5. **Server hardening** — env CORS, listen-before-DB + 5s DB timeout, `/api` 404 + global error handler.

## Trade-offs (have a one-liner for each)
- Context > Redux: one cohesive store, small tree.
- In-memory session: instant UX + stateless server; cost = no server-side resume.
- Email identity, no auth: MVP practice tool; JWT/magic-link is the upgrade.
- Mixed evaluation schema: AI shape evolves; indexes cover scalars.
- On-device proctoring: privacy + zero cost; defeatable, it's a deterrent.
- Judge0: never run untrusted code yourself.

## Scale story (1M users)
Stateless API autoscales behind LB; **LLM tokens are the real bottleneck** → cache question gen in Redis, async evaluation via queue, multiple keys/providers. Self-host Judge0 pool. Mongo replica set (read from secondaries) + shard by `userId`. Circuit-break to fallbacks under load.

## Security upgrades (production)
Auth (magic-link/OTP → JWT HTTP-only cookie) · rotate leaked secrets + secrets manager · Helmet · Zod validation · per-route rate limits · keep media on-device.

## If asked "what would you do next?"
Auth → tests (start with `normalizeJavaCode`, JSON extractor, analytics math) → async eval queue + Redis cache → stream LLM tokens for perceived speed → self-host Judge0.

## Numbers to drop
- 6 question types · 5 execution languages · 60-min session · 5 tab-switch limit
- Repo: 15,897 → 51 tracked files (~99% cut)
- LLM context trimming: last-10 turns to evaluator, last-40 persisted

## Don't get caught out
- It's **Groq/Llama**, not Gemini (old code had stale "Gemini" copy — I removed it).
- The server is **stateless**; the **browser** holds the session.
- Proctoring is **on-device** (MediaPipe) — emphasize privacy.
- There's **no auth yet** — say so plainly and give the upgrade path.

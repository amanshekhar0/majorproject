# ATS & Resume Content — AI Interview Platform

> Copy-paste-ready, ATS-optimized descriptions, STAR framing, and timed pitches. Pick metrics you can defend; placeholders in `[brackets]` should be replaced with your real numbers.

---

## 1. Resume bullet points (ATS-optimized)

**Project title line:**
> **AI Interview Platform** — React, TypeScript, Node.js, Express, MongoDB, LLM (Groq/Llama-3.3-70B), Judge0

**Bullets (pick 3–4, strong verbs + keywords ATS scans for):**

- Built a **full-stack AI mock-interview platform** (React 18, TypeScript, Vite, Node.js, Express, MongoDB) delivering timed, proctored technical interviews with **6 question types** (MCQ, output-prediction, debugging, DSA, behavioral/STAR, resume deep-dive).
- Integrated a **Groq-hosted Llama-3.3-70B LLM** via the OpenAI SDK to power resume parsing, a context-pinned AI interviewer, dynamic question generation, and a structured scoring rubric, achieving **provider-agnostic** design through an OpenAI-compatible endpoint.
- Engineered **secure in-browser code execution** for 5 languages by orchestrating the **Judge0 API** (async submit-and-poll, base64 transport, language normalization), keeping untrusted code fully sandboxed off the application server.
- Implemented a **privacy-first proctoring layer** using **MediaPipe** on-device face detection, WebAudio noise analysis, and tab-visibility monitoring — zero video leaves the browser.
- Designed a **stateless REST API** with rate limiting, CORS allow-listing, multipart upload hardening, and graceful degradation (DB-optional flow, static-bank and fallback-evaluation safety nets).
- Modeled **MongoDB schemas** (User 1-N InterviewSession) with targeted indexes and server-side analytics aggregation powering trend, skill-radar, and accuracy dashboards (Recharts).
- Reduced repository footprint by **~99%** (15,897 → 51 tracked files) and remediated committed secrets during a full security/code audit.

---

## 2. One-line resume version
> **AI Interview Platform** (React/TS, Node/Express, MongoDB, LLM, Judge0): full-stack proctored mock-interview app with an AI interviewer, in-browser multi-language code execution, and AI-generated scored performance reports.

---

## 3. LinkedIn "Projects" / post version

> 🚀 **AI Interview Platform** — I built a full-stack app that runs realistic, timed technical interviews end-to-end.
>
> A candidate picks a difficulty, optionally uploads a resume (parsed by an LLM to personalize questions), then works through a 60-minute mixed interview — MCQs, debugging, "guess the output," DSA coding, and behavioral STAR rounds — while chatting with an **AI interviewer** that stays pinned to the current question. DSA problems run in an in-browser **Monaco editor** executed safely via **Judge0**. A lightweight **on-device proctoring** layer (MediaPipe face detection + noise + tab monitoring) keeps things honest without sending any video off the device. At the end, an LLM returns a structured report — score, grade, strengths/weaknesses, code-quality breakdown, and a hire recommendation — plus curated learning resources, and progress is charted on a dashboard.
>
> **Stack:** React 18 · TypeScript · Vite · Tailwind · Framer Motion · Node.js · Express · MongoDB/Mongoose · Groq (Llama-3.3-70B) · Judge0 · MediaPipe
>
> Key engineering: provider-agnostic LLM orchestration with strict JSON output + fallbacks, a stateless horizontally-scalable API, secure sandboxed code execution, and privacy-first proctoring.
>
> #React #TypeScript #NodeJS #MongoDB #AI #LLM #FullStack #SoftwareEngineering

---

## 4. STAR-based explanation (for "tell me about a project")

**Situation:** Interview prep is fragmented — separate tools for DSA, theory, and behavioral, none of which simulate the pressure of a live interviewer asking follow-ups, and none giving structured feedback.

**Task:** Build one platform that runs a realistic, timed, proctored technical interview across all those question types and returns actionable, scored feedback — while keeping untrusted code safe and API keys secure.

**Action:**
- Designed a **thick-client / thin-server** architecture: a React SPA owns the live experience (timer, proctoring, editor, navigation) via a single `InterviewContext`, while a stateless Express API acts as a secure orchestrator.
- Integrated a **Groq/Llama-3.3-70B** LLM through the OpenAI-compatible SDK for resume extraction, a context-pinned interviewer, question generation, and a strict-JSON scoring rubric — with regex extraction + fallbacks for resilience.
- Built **sandboxed code execution** via Judge0 using async submit-and-poll and base64 transport, plus a Java class-normalization step.
- Added **on-device proctoring** (MediaPipe face detection, WebAudio RMS noise detection, tab-visibility) so no media leaves the browser.
- Ran a **full audit**: fixed a timer re-subscription bug, a Java regex bug, hardened the server (env CORS, fail-fast DB, 404/error handlers, bounded LLM tokens), removed dead code/deps, and cut tracked files ~99% while remediating committed secrets.

**Result:** A working, resilient platform that degrades gracefully (functions even with the DB or external AI down), is horizontally scalable by design, and produces a structured performance report candidates can act on. *(Add your real metrics: users tested, latency, etc.)*

---

## 5. Elevator pitches

### 30-second pitch
> I built a full-stack AI interview platform. Candidates take a timed, proctored mock interview with mixed question types — coding, MCQs, debugging, behavioral — while an AI interviewer asks follow-ups, and they write and run real code in the browser via a sandboxed execution service. At the end an LLM produces a scored report with strengths, weaknesses, and a hire recommendation. It's React and TypeScript on the front, Node/Express and MongoDB on the back, with a Groq-hosted Llama model and Judge0 for code execution. The architecture is stateless and degrades gracefully — it keeps working even if the database or AI service is down.

### 1-minute pitch
> *(30s version, then:)* The interesting engineering is in three places. First, LLM orchestration: I keep the AI interviewer pinned to the current question with a strong system prompt and a per-message context injection, and I force structured JSON out of the model for scoring with regex extraction and a fallback report so the user always gets a result. Second, security: untrusted code never touches my server — it goes to Judge0, base64-encoded, with an async submit-and-poll flow — and all proctoring runs on-device with MediaPipe so no video is ever uploaded. Third, resilience and scale: the server is stateless because the whole session lives in the browser, so it scales horizontally, and every external dependency has a graceful-degradation path. I also did a full audit that fixed real bugs and cut the repo from sixteen thousand tracked files down to fifty.

### 3-minute pitch
> *(1-minute version, then expand each pillar.)*
>
> **The problem.** Prep tools are siloed and none simulate a real interviewer. I wanted one timed, proctored, resume-aware mock that gives structured feedback.
>
> **Architecture.** I deliberately chose a thick client, thin server. The React SPA owns everything that has to feel instant — the 60-minute timer, the proctoring loops, the Monaco editor, question navigation — all in a single typed React Context that's the one source of truth for a session. The Express server only does what needs a secret key or a sandbox: LLM calls, code execution, and optional persistence. That keeps the server completely stateless, which is what makes it horizontally scalable.
>
> **AI layer.** One LLM, four jobs: it parses an uploaded resume into the candidate's top projects, drives a context-pinned interviewer persona, generates a balanced 10-question set by difficulty, and produces the final scoring rubric. I use low temperature for scoring and higher for conversation, bound the token budget so the JSON can't truncate, and I extract and validate the JSON with a fallback evaluation if the model misbehaves. Because I went through the OpenAI-compatible endpoint, swapping providers is a one-line change.
>
> **Execution & proctoring.** Code runs in Judge0, never on my box — async submit, poll the token, decode base64 output. Proctoring is privacy-first: MediaPipe face detection and WebAudio noise analysis run entirely on-device, plus tab-switch monitoring that terminates after five violations.
>
> **Engineering rigor.** I ran a full audit: found and fixed a timer bug that was tearing down its interval every second, a Java normalization regex bug, hardened the server with env-based CORS, fail-fast DB connection, 404 and global error handlers, removed an unused AI SDK and dead code, and remediated a security problem where dependencies and a real `.env` had been committed — cutting tracked files by about ninety-nine percent.
>
> **Result.** A resilient, scalable platform that never hard-fails — it falls back to a static question bank and a sample report if the AI or database is unavailable — and gives candidates a genuinely useful, structured assessment.

---

## 6. Keyword bank (sprinkle naturally for ATS)
`Full-Stack` · `React` · `TypeScript` · `JavaScript` · `Node.js` · `Express` · `REST API` · `MongoDB` · `Mongoose` · `LLM` · `Generative AI` · `Prompt Engineering` · `OpenAI SDK` · `Vite` · `Tailwind CSS` · `WebSockets`-ready · `Sandboxing` · `Judge0` · `CI/CD`-ready · `Rate Limiting` · `CORS` · `Authentication` (path) · `Indexing` · `Caching` · `Scalability` · `Microservice`-friendly · `MediaPipe` · `Computer Vision` · `WebAudio` · `Monaco Editor` · `Recharts` · `Git`

> **Honesty note:** only claim what you can defend in the room. Every keyword above maps to something actually in this codebase or its documented upgrade path — be ready to point at the file.

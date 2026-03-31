# AI Interview Platform — Complete Codebase Explanation

> **Project:** Full-stack AI-powered technical interview simulation platform  
> **Stack:** React + TypeScript (Vite) on the frontend · Express + TypeScript + MongoDB on the backend  
> **AI Models:** Groq (Llama-4-Scout) for interviewer, resume parsing, and evaluation · Judge0 (via RapidAPI) for code execution · MediaPipe for proctoring

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [High-Level Program Flow](#high-level-program-flow)
3. [Backend — Server](#backend--server)
   - [index.ts](#indexts-entry-point)
   - [Models — Session.ts](#models--sessionts)
   - [Routes](#routes)
   - [Controllers](#controllers)
4. [Frontend — Client](#frontend--client)
   - [Entry Points](#entry-points-maintsx--apptsx)
   - [Data — questions.ts](#data--questionsts)
   - [API Layer — lib/api.ts](#api-layer--libapiuts)
   - [Context — InterviewContext.tsx](#context--interviewcontexttsx)
   - [Hooks](#hooks)
   - [Pages](#pages)
   - [Components](#components)
5. [Control Flow — Detailed Walkthrough](#control-flow--detailed-walkthrough)
6. [Environment Variables](#environment-variables)

---

## Project Structure

```
mvp/
├── client/                     ← React frontend (Vite + TypeScript)
│   └── src/
│       ├── main.tsx            ← App bootstrap
│       ├── App.tsx             ← Router + Provider wrapper
│       ├── index.css           ← Global design system
│       ├── data/
│       │   └── questions.ts    ← Static question bank
│       ├── lib/
│       │   └── api.ts          ← HTTP client (axios wrappers)
│       ├── context/
│       │   └── InterviewContext.tsx  ← Global state of the interview session
│       ├── hooks/
│       │   ├── useTimer.ts     ← Countdown timer logic
│       │   ├── useSpeech.ts    ← Speech recognition + synthesis
│       │   └── useAntiCheat.ts ← Tab-switch detection + MediaPipe gaze tracking
│       ├── pages/
│       │   ├── LandingPage.tsx ← Entry page (hero, resume modal launcher)
│       │   ├── ArenaPage.tsx   ← Main interview arena (3-panel layout)
│       │   └── ResultsPage.tsx ← AI-generated evaluation report
│       └── components/
│           ├── ResumeModal.tsx     ← PDF upload + project extraction
│           ├── QuestionPanel.tsx   ← Left sidebar question list
│           ├── ChatPanel.tsx       ← AI interviewer chat
│           ├── CodingPanel.tsx     ← Monaco editor + console
│           └── ProctorOverlay.tsx  ← Webcam PIP + warning modals
└── server/                     ← Express backend (TypeScript)
    └── src/
        ├── index.ts            ← Express app bootstrap
        ├── models/
        │   └── Session.ts      ← Mongoose schema (session persistence)
        └── routes/ + controllers/
            ├── resume.*        ← PDF upload → project extraction
            ├── interview.*     ← AI chat + question generation
            ├── code.*          ← Code execution via Judge0
            └── results.*       ← Post-session AI evaluation
```

---

## High-Level Program Flow

```
User visits /
  └─► LandingPage renders
        └─► Click "Start Interview"
              └─► ResumeModal opens
                    ├─► Upload PDF  →  POST /api/resume/upload
                    │     └─► AI extracts projects → POST /api/interview/generate-questions
                    │           └─► Questions set in context
                    └─► Skip (uses QUESTION_BANK directly)
                          └─► startSession() called → navigate to /arena

/arena (ArenaPage)
  ├─► Timer starts (60 min countdown)
  ├─► Webcam + MediaPipe gaze detection initialized
  ├─► Anti-cheat tab-switch listener active
  ├─► QuestionPanel (left) → shows question list
  ├─► QuestionDetail (center) → shows current question + handles MCQ
  ├─► ChatPanel (center-bottom) → AI interviewer conversation
  │     └─► sendMessage()  →  POST /api/interview/chat  →  Groq AI response
  └─► CodingPanel (right) → Monaco editor
        ├─► Run Code  →  POST /api/code/run  →  Judge0 → stdout/stderr shown
        └─► Submit    →  records submission + sends to AI for review

Session ends (timer expires / "Submit Assessment" / anti-cheat termination)
  └─► endSession() called → navigate to /results with session data

/results (ResultsPage)
  └─► POST /api/results/evaluate  →  Groq AI produces full evaluation JSON
        └─► Renders score, grade, strengths, weaknesses, code quality
```

---

## Backend — Server

### `index.ts` (Entry Point)

**Path:** `server/src/index.ts`

This is the **root of the server**. It bootstraps the entire Express application.

**What it does step by step:**
1. Imports `express`, `cors`, `dotenv`, `mongoose`, `express-rate-limit`, and all route files.
2. Calls `dotenv.config()` to load environment variables from `.env`.
3. Creates the Express app and sets `PORT` (defaults to `5000`).
4. Sets up a **rate limiter**: max 100 requests per 15-minute window (applied to all `/api/*` routes to prevent abuse).
5. Configures **CORS** to accept requests from `localhost:5173` (Vite dev server) and `localhost:3000`.
6. Parses JSON request bodies up to **10 MB** (needed for large resume PDF text).
7. Mounts all 4 route modules:
   - `POST /api/resume/...`
   - `POST /api/interview/...`
   - `POST /api/code/...`
   - `POST /api/results/...`
8. Adds a `/health` check endpoint (useful for deployment health probes).
9. Calls `connectDB()` to connect to MongoDB via Mongoose. If MongoDB is unavailable, the server still starts (graceful degradation — not all features require a database).
10. Once DB connects (or fails gracefully), starts listening on `PORT`.

**Key design:** Rate limiter + generous body size limit + CORS whitelisting for local dev.

---

### Models — `Session.ts`

**Path:** `server/src/models/Session.ts`

Defines the **MongoDB schema** for persisting an interview session using Mongoose.

**Interface `ISession` fields:**
| Field | Type | Purpose |
|---|---|---|
| `sessionId` | `string` (unique, indexed) | Unique identifier for each session |
| `candidateName` | `string?` | Optional candidate name |
| `resumeProjects` | `string[]` | Names of projects extracted from resume |
| `chatHistory` | `Array<{role, content, timestamp}>` | Full conversation log |
| `codeSubmissions` | `Array<{language, code, question, timestamp}>` | All submitted code |
| `mcqAnswers` | `Array<{questionId, answer, correct}>` | MCQ responses |
| `tabSwitchCount` | `number` | Anti-cheat tracking |
| `timeUsed` | `number` | Seconds used |
| `terminated` | `boolean` | Was the session force-terminated? |
| `completed` | `boolean` | Did the candidate finish normally? |
| `score` | `number?` | AI-generated score |
| `evaluation` | `Mixed?` | AI-generated evaluation object |

**Note:** The schema uses `{ timestamps: true }` which automatically adds `createdAt` and `updatedAt` fields.

> **Current usage:** The Session model is defined but the controllers do not actively save every session to the DB — this is scaffolding for future persistence. The evaluation results are returned directly in the HTTP response.

---

### Routes

Routes are **thin wires** — they just connect HTTP method + URL path to the appropriate controller function.

#### `routes/resume.ts`
```
POST /api/resume/upload  ←  multer middleware first (handles file upload)  →  parseResume()
```

#### `routes/interview.ts`
```
POST /api/interview/chat               →  chat()
POST /api/interview/generate-questions →  generateQuestions()
```

#### `routes/code.ts`
```
POST /api/code/run  →  runCode()
```

#### `routes/results.ts`
```
POST /api/results/evaluate  →  evaluateSession()
```

Each route file creates an Express `Router`, registers the handler, and exports it. The main `index.ts` prefixes all of them with `/api`.

---

### Controllers

#### `codeController.ts`

**Purpose:** Executes code snippets via the **Judge0** API (code sandbox).

**Language map** (`LANGUAGE_ID_MAP`):
| Language | Judge0 ID |
|---|---|
| Python | 71 |
| Java | 62 |
| C++ | 54 |
| C | 50 |
| JavaScript | 63 |

**`normalizeJavaCode(code)`:**  
Judge0 saves Java files as `Main.java`, which means the public class **must** be named `Main`. This utility function uses regex to:
- Find the actual public class name (e.g., `Solution`)
- Replace `public class Solution` → `public class Main`
- Replace `new Solution(` → `new Main(`
- Replace `Solution.` → `Main.`

This prevents compilation errors when users write their class name differently.

**`runCode(req, res)` — Main execution flow:**
1. Extracts `code`, `language`, and optional `stdin` from the request body.
2. Validates both are present and the language is supported.
3. Checks the `RAPIDAPI_KEY` is configured.
4. For Java: normalizes the class name.
5. **Submits** the code to Judge0 with `base64_encoded=true` (avoids issues with special characters). The submission uses `wait=false` (async — just returns a token).
6. **Polls** Judge0 every 1.5 seconds via `pollResult()` until `status.id > 2` (i.e., not queued/processing). Maximum 10 attempts before timing out.
7. **Decodes** the base64-encoded `stdout`, `stderr`, and `compile_output` fields.
8. Returns a clean response object: `{ success, stdout, stderr, compile_output, exit_code, status, time, memory }`.

---

#### `interviewerController.ts`

**Purpose:** Powers the **AI interviewer** chatbot (Alex) using Groq's LLM API.

**AI client setup:**  
Uses the `openai` npm package configured with Groq's API base URL (`https://api.groq.com/openai/v1`) and the `XAI_API_KEY` from environment. This works because Groq is OpenAI API-compatible.

**Model:** `meta-llama/llama-4-scout-17b-16e-instruct`

**System Prompt (`SYSTEM_PROMPT`):**  
Alex is instructed to:
- Focus **exclusively** on the `[CURRENT QUESTION]` injected into each message
- Only ask follow-ups about that specific question
- Give hints if wrong, probe deeper if right
- Keep responses **2-4 sentences max**
- If the candidate gives a non-answer, explain the correct answer and say "Let's move on to the next question."
- Never reveal it's an AI

**`chat(req, res)` — Message flow:**
1. Receives `message`, `history`, and `context` (`currentQuestion`, `questionType`, `submittedCode`, `projects`).
2. Builds a `contextPrefix` string that injects:
   - The current question as a strict directive (`[CURRENT QUESTION]`)
   - Submitted code block (if any)
   - Candidate's resume project names (for reference)
3. Converts the `history` (stored in Gemini-style `{role, parts}` format) to OpenAI-style `{role, content}` format.
4. Calls Groq with `max_tokens: 512, temperature: 0.7`.
5. Returns the AI response text.

**`generateQuestions(req, res)` — Dynamic resume questions:**
1. Receives an array of `projects`.
2. Builds a prompt asking for **2 deep-dive questions** about those specific projects.
3. The prompt strictly requests JSON output only.
4. Parses the JSON and returns the generated questions.

---

#### `resumeController.ts`

**Purpose:** Parses a PDF resume and extracts the top 2 technical projects.

**Setup:**
- `multer` with `memoryStorage()` — the PDF is stored in RAM as a buffer (no disk writes)
- File size limit: **10 MB**
- Only accepts `application/pdf` MIME type

**`parseResume(req, res)` — Resume analysis flow:**
1. Checks that a file was uploaded.
2. Uses `pdf-parse` to extract raw text from the PDF buffer.
3. Validates that the text is at least 50 characters (catches empty/unreadable PDFs).
4. Sends the first 8,000 characters of the PDF text to Groq with a prompt to extract:
   - Project name
   - 1-2 sentence description
   - Technologies used
   - Key technical highlights
5. Responds strictly in JSON format.
6. Parses the JSON from the AI response (robustly handles extra text by regex-matching the JSON block).
7. Returns `{ success: true, projects: [...], resumeLength: number }`.

---

#### `resultsController.ts`

**Purpose:** Evaluates the entire interview session and generates a comprehensive assessment report.

**`evaluateSession(req, res)` — Evaluation flow:**
1. Receives the full session data: chat history, code submissions, MCQ score, tab switch count, time used, terminated flag, and projects.
2. Constructs a detailed prompt to Groq acting as a **senior hiring manager**, including:
   - MCQ score/total
   - Time used (converted to minutes)
   - Tab switch count
   - Whether the session was terminated early
   - All code submissions with the question and code block
   - Last 10 messages from the chat history
3. Calls Groq at `temperature: 0.3` (low temperature = more consistent, factual evaluation).
4. The response must be **strict JSON** with this structure:
   - `overallScore` (0–100)
   - `grade` (A+, A, B+, B, C+, C, D, F)
   - `summary`
   - `strongPoints[]` with evidence
   - `weakPoints[]` with suggestions
   - `codeQuality` (score, correctness, efficiency, readability, feedback)
   - `sectionScores` (mcq, coding, communication, resumeDepth)
   - `recommendation` (Strong Hire / Hire / Maybe / No Hire)
   - `nextSteps`
5. Returns `{ success: true, evaluation: {...} }`.

---

## Frontend — Client

### Entry Points: `main.tsx` + `App.tsx`

**`main.tsx`** is the **first file that runs**. It:
1. Renders the React app into `<div id="root">` in `index.html`
2. Wraps everything in `React.StrictMode` for development warnings
3. Wraps with `BrowserRouter` for client-side routing
4. Mounts a global `<Toaster>` (react-hot-toast) in the top-right corner for notifications

**`App.tsx`** is the **router + context root**:
1. Wraps all routes with `<InterviewProvider>` (the global state store)
2. Defines 3 routes:
   - `/` → `LandingPage`
   - `/arena` → `ArenaPage`
   - `/results` → `ResultsPage`

**Control flow:** `main.tsx` → renders `App.tsx` → `InterviewProvider` wraps everything → routes determine which page renders.

---

### Data — `questions.ts`

**Path:** `client/src/data/questions.ts`

Defines the **static question bank** — the default set of interview questions loaded at startup.

**`Question` interface:**
```typescript
{
  id: string
  type: 'mcq' | 'output_guess' | 'debugging' | 'dsa' | 'resume_deep'
  question: string
  options?: string[]          // MCQ only
  correctAnswer?: string      // MCQ/output_guess/debugging
  code?: string               // Code snippet to display
  language?: string           // Language of the displayed code
  starterCode?: Record<string, string> // DSA starter code per language
  explanation?: string        // Explanation shown after answering
  project?: string            // Resume question: which project
  followUp?: string           // Optional follow-up question text
}
```

**`QUESTION_BANK`** — 13 questions in order:
| Count | Type | Description |
|---|---|---|
| 5 | `mcq` | BST complexity, LIFO, CAP theorem, sorting, hash maps |
| 2 | `output_guess` | Python list aliasing, JS var + setTimeout closure |
| 2 | `debugging` | Factorial base case bug, binary search bounds bug |
| 2 | `dsa` | Two Sum (hash map), Valid Parentheses (stack) |
| 2 | `resume_deep` | Project challenge, architecture walkthrough |

The resume deep-dive questions are **placeholder defaults** — they are replaced by AI-generated questions once a resume is uploaded.

---

### API Layer — `lib/api.ts`

**Path:** `client/src/lib/api.ts`

This is the **centralized HTTP client** for all backend communication. It uses `axios`.

**`API` instance:**
- Base URL: `/api` (proxied in Vite config to `localhost:5000/api`)
- Timeout: 30 seconds
- Default `Content-Type: application/json`

**Exported interfaces** (TypeScript types shared across the app):
- `Project` — `{name, description, technologies[], highlights}`
- `ChatMessage` — `{role, content, timestamp?}`
- `CodeRunResult` — `{stdout, stderr, compile_output, exit_code}`
- `EvaluationResult` — Full schema for the results page

**Exported functions:**
| Function | HTTP | Endpoint | Purpose |
|---|---|---|---|
| `uploadResume(file)` | POST | `/api/resume/upload` | Multipart PDF upload |
| `sendChatMessage(msg, history, ctx)` | POST | `/api/interview/chat` | Send message to AI |
| `generateResumeQuestions(projects)` | POST | `/api/interview/generate-questions` | Get AI-generated questions |
| `executeCode(code, lang, stdin?)` | POST | `/api/code/run` | Run code via Judge0 |
| `evaluateSession(sessionData)` | POST | `/api/results/evaluate` | Get AI evaluation report |

**Note:** `uploadResume` uses a separate `axios.post` (not the `API` instance) because it needs `multipart/form-data` headers and a longer 60-second timeout.

---

### Context — `InterviewContext.tsx`

**Path:** `client/src/context/InterviewContext.tsx`

This is the **central nervous system of the entire application** — a React Context that holds all interview session state and logic.

**State managed:**
| State | Type | Purpose |
|---|---|---|
| `sessionStarted` | boolean | Has the interview begun? |
| `sessionEnded` | boolean | Is the session over? |
| `terminated` | boolean | Was it force-terminated (anti-cheat)? |
| `timeUsed` | number | Seconds actually used |
| `projects` | `Project[]` | Resume projects (from upload) |
| `questions` | `Question[]` | Current question list (bank or AI-generated) |
| `currentIndex` | number | Which question is active |
| `chatHistory` | `ChatMessage[]` | UI-facing message list |
| `geminiHistory` | array | LLM conversation format (for API) |
| `isAITyping` | boolean | Controls typing indicator |
| `code` | string | Current code in the editor |
| `language` | string | Selected language (Python by default) |
| `terminalOutput` | string | Code execution output |
| `isRunning` | boolean | Is code currently executing? |
| `codeSubmissions` | array | All submitted code snapshots |
| `mcqAnswers` | array | All MCQ answers with correctness |
| `tabSwitchCount` | number | Anti-cheat counter |
| `isDark` | boolean | Dark/light theme |

**Key functions:**

**`sendMessage(msg, ctx?)`**
1. Calls `addUserMessage()` (updates both `chatHistory` and `geminiHistory`)
2. Sets `isAITyping = true`
3. Calls `sendChatMessage()` from `api.ts` with the full `geminiHistory` (conversation context) and the context object
4. On success: calls `addAIMessage()`, then **speaks** the AI response using `window.speechSynthesis` (Web Speech API TTS)
5. On error: shows a fallback "connectivity trouble" message

**`runCode()`**
1. Calls `executeCode(code, language)` from `api.ts`
2. Assembles output: compiler output + stdout + stderr
3. Sets `terminalOutput` so `CodingPanel` displays it

**`submitCode()`**
1. Saves a code snapshot to `codeSubmissions[]`
2. Automatically sends a chat message to Alex asking for code review
3. Advances to the next question (`goNextQuestion()`)

**`submitMCQ(answer)`**
1. Compares answer to `currentQuestion.correctAnswer`
2. Records the result in `mcqAnswers[]`
3. Returns `true`/`false` (used by `QuestionDetail` to show feedback)

**`endSession(terminated, timeSecs)`**  
Marks the session as ended, stores the final time, cancels speech synthesis.

**`getSessionData()`**  
Assembles the session data object to pass to the results page:
```
{ chatHistory, codeSubmissions, mcqScore, mcqTotal, tabSwitchCount, timeUsed, terminated, projects }
```

**`resetSession()`**  
Resets every piece of state and the chat history back to initial values (used by "Try Again").

---

### Hooks

#### `useTimer.ts`

**Purpose:** A countdown timer with start/pause/stop and urgency states.

**How it works:**
- Takes `initialSeconds` (3600 = 60 minutes) and an optional `onExpire` callback
- Uses `setInterval` (1-second tick) when `isRunning = true`
- When `secondsLeft` reaches 0: stops the interval and calls `onExpire()` exactly once (protected by `expiredRef` to prevent double-firing)
- `formatTime(secs)`: converts to `MM:SS` string
- `urgency`: returns `'critical'` (< 5 min), `'warning'` (< 10 min), or `'normal'`
- `getElapsedSeconds()`: `initialSeconds - secondsLeft`

**Used by:** `ArenaPage` — calls `start()` immediately on mount, passes `handleExpire` as `onExpire`.

---

#### `useSpeech.ts`

**Purpose:** Provides **voice input** (speech recognition) and **voice output** (speech synthesis).

**Voice Input (recognition):**
- Uses `webkitSpeechRecognition` or `SpeechRecognition` (browser APIs)
- `continuous: false` — stops after one utterance
- `interimResults: true` — provides partial transcripts while speaking
- Only the **final** transcript triggers `onTranscriptChange` callback
- The callback is used in `ChatPanel` to append voice text to the input field

**Voice Output (synthesis):**
- `speak(text)`: cancels any ongoing speech, creates a `SpeechSynthesisUtterance` with rate=1.0, pitch=1.0, volume=0.9
- Tracks `isSpeaking` state

**`isSupported`**: checks whether the browser supports speech recognition at all (Chrome/Edge yes, Firefox no).

**Used by:** `ChatPanel` (voice input toggle), `InterviewContext` (`sendMessage` calls `window.speechSynthesis.speak()` directly).

---

#### `useAntiCheat.ts`

**Purpose:** Detects and responds to cheating behaviors — tab switching and gaze aversion.

**Tab-switch detection:**
- Listens to `document.visibilitychange`
- When tab goes hidden: calls `onTabSwitch()` → bumps `tabSwitchCount` in context
- When `tabSwitchCount >= MAX_TAB_SWITCHES` (5): calls `onTerminate()` and sets `isTerminated = true`

**Gaze detection (MediaPipe FaceLandmarker):**

`initGazeDetection(videoEl)` — async setup:
1. Dynamically imports `@mediapipe/tasks-vision` (code-splits the heavy ML library)
2. Downloads the face landmark model from Google's CDN
3. Creates a `FaceLandmarker` in `VIDEO` running mode with output of `facialTransformationMatrixes`
4. Starts a continuous `requestAnimationFrame` detection loop

**Gaze math:**
```
yaw  = arcsin(matrix[2])              → left/right rotation
pitch = atan2(-matrix[6], matrix[10]) → up/down rotation

isLookingAway = |yaw| > 25° OR pitch < -20° OR pitch > 20°
```

If looking away for **5 seconds continuously**: sets `warningType = 'gaze'`  
When face returns: clears the timeout, dismisses the gaze warning.

**Cleanup:** On unmount, cancels animation frame, clears timeouts, stops webcam media tracks.

**Returns:** `{ warningType, isTerminated, dismissWarning, initWebcam, initGazeDetection }`

---

### Pages

#### `LandingPage.tsx`

**Purpose:** The beautiful entry page — animated hero with "Start Interview" flow.

**Sub-components defined inline:**

- **`CursorTrail`:** 7 orbs that follow the mouse cursor with spring physics (each slightly looser than the last). Uses `useMotionValue` + `useSpring` from Framer Motion.
- **`SpotlightGlow`:** A large 700px radial gradient that lazily follows the mouse using `requestAnimationFrame` + linear interpolation (6% ease per frame).
- **`MagneticButton`:** Button that magnetically shifts toward the cursor using spring physics (`±28%` of cursor offset from button center).
- **`StaggerHeadline`:** Splits headline text by word, each word slides up from behind its clip with a staggered delay.
- **`DotGrid`:** A CSS `radial-gradient` repeated pattern creating a dot grid background.

**Main `LandingPage` component:**
1. Reads theme preference from `localStorage` (or system `prefers-color-scheme`)
2. Hides the default cursor (`cursor: none`) and shows the custom `CursorTrail`
3. The "Start Interview" / "Start Mock Interview →" buttons both set `showModal = true`
4. `showModal` renders `<ResumeModal>` with `AnimatePresence` for smooth entry/exit
5. `ResumeModal.onStart` calls `navigate('/arena')`

---

#### `ArenaPage.tsx`

**Purpose:** The **main interview environment** — 3-panel layout, timer, anti-cheat, all integrated.

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  Header: Logo | Timer | Tab-switch count | Submit | End  │
├──────────┬───────────────────────┬───────────────────────┤
│ Question │  Question Detail      │                       │
│ Panel    │  (center top)         │   Coding Panel        │
│ (left)   ├───────────────────────┤   (Monaco Editor)     │
│          │  Chat Panel           │   + Console           │
│          │  (center bottom)      │                       │
└──────────┴───────────────────────┴───────────────────────┘
                                        ProctorOverlay (webcam PIP bottom-right)
```

**Initialization (on mount):**
1. Calls `startSession()` if not already started
2. Calls `startTimer()` to begin the 60-minute countdown
3. Calls `initWebcam(videoRef.current)` → then `initGazeDetection(videoRef.current)` (one-time init)

**Timer expiry → `handleExpire()`:**
- Calls `endSession(false, INTERVIEW_DURATION)` — normal completion at time limit

**Anti-cheat termination → `handleTerminate()`:**
- Calls `endSession(true, elapsedSeconds)` — terminated early
- Calls `setTerminated(true)`
- Navigates to `/results` passing `getSessionData()` as route state

**"Submit Assessment" → `handleFinish()`:**
- Calls `endSession(false, elapsedSeconds)` — voluntary completion
- Navigates to `/results`

**`QuestionDetail` (inline sub-component):**  
Renders the currently active question. Logic differs by question type:
- `mcq`: renders radio-style option buttons, "Submit Answer" button, shows correct/incorrect feedback after submit, auto-advances after 2 seconds
- `output_guess` / `debugging`: shows the code block, user explains in chat
- `dsa`: shows a note pointing to the code editor
- `resume_deep`: shows the question text + follow-up

Hint buttons ("Give Hint", "Help with Mistake", "Explain Constraint") call `sendMessage()` with pre-canned hint request text.

---

#### `ResultsPage.tsx`

**Purpose:** Displays the AI-generated comprehensive evaluation after the interview.

**Initialization:**
- Reads `location.state` (passed via `navigate()`) or falls back to `getSessionData()` from context
- Immediately calls `evaluateSession(sessionData)` on mount
- Shows a progress/loading state while waiting (15–30 seconds)
- On error: uses `FALLBACK_EVALUATION` (hardcoded sample results) so the page never shows a blank error

**Sub-components:**
- **`ScoreRing`:** SVG animated circle that fills to the score percentage using Framer Motion's `strokeDashoffset`. Color changes based on score tier (cyan >= 80, gold >= 60, orange >= 40, red otherwise).
- **`MetricBar`:** Animated progress bar for section scores. Framer Motion width animates from 0 to value%.

**Sections displayed:**
1. Score ring + grade + recommendation/verdict
2. Section breakdown (MCQ, Coding, Communication, Resume Depth) as metric bars
3. Code quality analysis (correctness, efficiency, readability bars + text feedback)
4. Strong points (green checkmarks with evidence)
5. Weak points (red X marks with improvement suggestions)
6. Footer: "Back to Home" button + "Try Again" (calls `resetSession()` then navigates to `/arena`)

---

### Components

#### `ResumeModal.tsx`

**Purpose:** PDF upload flow, shown before the interview begins.

**Flow:**
1. Drag-and-drop or click-to-browse zone (validates PDF MIME type)
2. File selected → shows filename + size
3. "Analyse Resume" clicked → calls `uploadResume(file)` (POST to `/api/resume/upload`)
4. On success: stores projects via `setProjects()`, then calls `generateResumeQuestions(projects)` to get AI questions
5. Questions merged: base bank (without `resume_deep`) + AI-generated resume questions → `setQuestions()`
6. Shows extracted project cards (name, description, tech tags)
7. "Begin Interview →" → calls `startSession()` + `onStart()` (which navigates to `/arena`)
8. "Skip" → uses default `QUESTION_BANK`, skips resume upload

**Error handling:** If `generateResumeQuestions` fails, falls back to `QUESTION_BANK` silently.

---

#### `QuestionPanel.tsx`

**Purpose:** Left sidebar that lists all questions, grouped by section.

**Grouping logic:** Questions are grouped into two sections:
- `MULTIPLE CHOICE` — all `mcq` type
- `CODING` — everything else

Clicking any question calls `setCurrentIndex(idx)` to jump directly to it.

**Active question:** Highlighted with blue left border + blue background row (`C.activeBorder`, `C.activeRow`).

---

#### `ChatPanel.tsx`

**Purpose:** The AI interviewer chat interface.

**Voice input integration:**
- Uses `useSpeech(callback)` where the callback appends the recognized transcript to the input field
- Microphone button shown only if `isSupported` (Web Speech API available)
- Active mic shows a red "stop" state

**Message handling:**
- `handleSend()`: trims input, clears it, then calls `sendMessage(text, { currentQuestion, questionType })`
- `Enter` (without Shift) submits; `Shift+Enter` adds a newline
- Auto-scrolls to the bottom whenever `chatHistory` or `isAITyping` changes

**Typing indicator:** Three bouncing dots shown when `isAITyping` is true.

**Message bubbles:** User messages right-aligned (blue tint), AI messages left-aligned (dark tint).

---

#### `CodingPanel.tsx`

**Purpose:** Monaco Editor-based code writing environment with console output.

**Language support:** Python, Java, C++, JavaScript (each has a default starter code template).

**Starter code logic (`useEffect`):**
- When `currentQuestion` changes: if it has `starterCode[language]`, use that; otherwise use `DEFAULT_CODE[language]`
- When language changes: same logic — loads appropriate starter or default code

**Monaco Editor configuration:**
- `vs-dark` theme
- `JetBrains Mono` font with ligatures
- No minimap, word wrap on, smooth scrolling, 4-space tabs

**Console output coloring:**
- Blue → still running (`⏳`)
- Red → contains `[Error]` or `[Network Error]`
- Green → successful output

---

#### `ProctorOverlay.tsx`

**Purpose:** Renders the webcam PIP feed and warning modals.

**PIP Webcam Feed:**
- Fixed bottom-right: 144×96px rounded box
- The `videoRef` passed from `ArenaPage` renders the live webcam stream
- Indicator shows tab switch count (pulsing red if > 0)

**Warning Modals (animated with AnimatePresence):**
| Condition | Modal Shown |
|---|---|
| `warningType === 'gaze'` | `GazeWarningModal` (yellow, eye icon) — user looked away for 5s |
| `warningType === 'tab'` AND `count < 5` | `TabWarningModal` (orange/red depending on `switchesLeft`) |
| `tabSwitchCount >= 5` | `TerminateModal` (auto-terminates after 5s countdown) |

**`TerminateModal`:** Uses `useEffect` to auto-call `onTerminate()` after 5 seconds. Shows a red progress bar animating from 100% → 0% as a visual 5-second countdown.

---

## Control Flow — Detailed Walkthrough

### Phase 1: Bootstrap
```
index.html → main.tsx → App.tsx
  → InterviewProvider mounts (initializes all state)
  → BrowserRouter + Routes → LandingPage renders at "/"
```

### Phase 2: Pre-Interview Setup
```
User clicks "Start Interview"
  → showModal = true → ResumeModal mounts (AnimatePresence)
  → User drops PDF
  → handleUpload()
      → uploadResume()          → POST /api/resume/upload
          → multer parses file
          → pdf-parse extracts text
          → Groq extracts projects → returns { projects }
      → setProjects(projects)   → InterviewContext.projects updated
      → generateResumeQuestions()  → POST /api/interview/generate-questions
          → Groq generates 2 resume-specific questions → returns { questions }
      → setQuestions([...base, ...dynamic])
  → User clicks "Begin Interview →"
      → startSession()          → sessionStarted = true
      → onStart()               → navigate('/arena')
```

### Phase 3: Interview Arena
```
ArenaPage mounts
  → startSession() (if not already)
  → startTimer()   → 60-min countdown begins
  → initWebcam() → getUserMedia() → webcam stream to videoRef
  → initGazeDetection() → MediaPipe FaceLandmarker starts rAF loop

Candidate types answer in ChatPanel
  → handleSend()
      → sendMessage(text, { currentQuestion, questionType })
          → addUserMessage()    → chatHistory + geminiHistory updated
          → isAITyping = true
          → sendChatMessage()   → POST /api/interview/chat
              → context injected (current question, projects)
              → Groq generates response
              → returns response text
          → addAIMessage()      → chatHistory updated
          → speechSynthesis.speak(response)
          → isAITyping = false

Candidate writes code in CodingPanel
  → Clicks "Run Code"
      → runCode() in context
          → executeCode()       → POST /api/code/run
              → normalizeJava() (if Java)
              → base64 encode + submit to Judge0
              → pollResult() loop (1.5s intervals)
              → decode output
          → setTerminalOutput(stdout/stderr)

  → Clicks "Submit"
      → submitCode()
          → saves to codeSubmissions[]
          → sendMessage("I've submitted... [code block]...")
              → AI reviews the code
          → goNextQuestion()    → currentIndex++

Anti-cheat events:
  → Tab hidden → onTabSwitch() → tabSwitchCount++
      → if count < 5: warningType = 'tab' → TabWarningModal shows
      → if count >= 5: handleTerminate() → navigate('/results')
  → Gaze away 5s → warningType = 'gaze' → GazeWarningModal shows

MCQ answered:
  → handleMCQSubmit()
      → submitMCQ(answer) → records in mcqAnswers[]
      → sendMessage(correct/incorrect message) → AI responds
      → setTimeout 2s → goNextQuestion()
```

### Phase 4: Session End → Results
```
"Submit Assessment" / timer expired / anti-cheat triggered
  → endSession(terminated, timeUsed)
      → sessionEnded = true
      → speechSynthesis.cancel()
  → navigate('/results', { state: getSessionData() })

ResultsPage mounts
  → reads location.state (the session data)
  → evaluateSession(sessionData) → POST /api/results/evaluate
      → Groq analyzes chat, code, scores, flags
      → returns structured JSON evaluation
  → setEvaluation(result)
  → Renders score ring, grade, recommendation, section bars,
    strong/weak points, code quality analysis
```

---

## Environment Variables

### Server (`server/.env`)
| Variable | Purpose |
|---|---|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `XAI_API_KEY` | Groq API key (used for all AI calls) |
| `RAPIDAPI_KEY` | Judge0 via RapidAPI key (code execution) |
| `RAPIDAPI_HOST` | Judge0 host (default: `judge029.p.rapidapi.com`) |
| `NODE_ENV` | `development` or `production` |

### Client (`client/.env`)
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base API URL (proxied by Vite in dev) |

> **Note:** The Vite dev server proxies `/api` requests to `http://localhost:5000`, so `axios` calls to `/api/...` from the client automatically hit the backend during development.

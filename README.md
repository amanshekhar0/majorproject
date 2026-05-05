# AI Interview Platform

This project is a full-stack AI-powered mock technical interview platform. It lets a user choose an interview difficulty, optionally upload a resume, answer technical questions, solve coding problems in-browser, chat with an AI interviewer, and receive an AI-generated performance report at the end.

The app is split into:

- `client/`: React + Vite frontend
- `server/`: Express + TypeScript backend

## What The Project Does

The platform simulates a structured coding interview experience:

- starts a timed interview session
- supports `easy`, `medium`, and `hard` difficulty levels
- optionally analyzes a PDF resume and extracts key projects
- generates follow-up resume-based interview questions
- presents mixed question types like MCQ, output prediction, debugging, DSA, and resume deep-dive questions
- provides an AI interviewer chat assistant during the session
- allows code execution for supported languages
- monitors tab switching and webcam/gaze behavior for basic proctoring
- produces a final AI evaluation report with scores, strengths, weaknesses, and study resources

## How It Works

At a high level, the user journey looks like this:

1. The user opens the landing page and starts an interview.
2. The frontend asks the user to choose a difficulty level.
3. The user can upload a PDF resume or skip that step.
4. If a resume is uploaded, the backend parses the PDF and uses an LLM to extract the top projects.
5. The backend then generates resume-specific technical questions from those extracted projects.
6. During the interview, the frontend keeps the current session state in React context.
7. The user answers theory questions, uses the AI chat panel for feedback, and writes code for DSA questions.
8. Code is sent to the backend, which forwards it to Judge0 through RapidAPI for execution.
9. Anti-cheat hooks watch for tab switches and prolonged gaze loss.
10. At the end, the full session data is sent to the backend for AI evaluation and a result report is shown on the results page.

## Core Features

### 1. Resume-Based Personalization

The resume upload flow accepts a PDF file and extracts text server-side using `pdf-parse`. That text is then sent to an LLM, which returns the two most relevant technical projects in a strict JSON format. Those projects are stored in the interview state and used to generate deeper project-specific questions.

### 2. AI Interviewer Chat

The interview chat is designed to stay focused on the current question. The backend injects the active question, submitted code, and project context into the prompt before sending it to the LLM. The AI interviewer responds as a concise technical interviewer rather than a generic assistant.

### 3. Mixed Interview Question Types

The question bank supports several styles of questions:

- `mcq`
- `output_guess`
- `debugging`
- `dsa`
- `resume_deep`

This gives the interview a more realistic flow instead of limiting it to only coding tasks.

### 4. Built-In Coding Environment

For DSA questions, the frontend shows a coding panel where the candidate can write and run code. The backend maps languages to Judge0 language IDs and sends execution requests through RapidAPI. The result is then returned to the UI with compiler output, stdout, stderr, and execution status.

Supported languages in the current backend:

- Python
- Java
- C++
- C
- JavaScript

### 5. Proctoring / Anti-Cheat Layer

The frontend includes a lightweight anti-cheat system:

- detects tab or window focus loss
- counts tab switches
- terminates the session after the configured limit
- starts webcam access
- uses MediaPipe face landmarks to detect when the user looks away for too long

This is intended as a basic interview-discipline layer, not a production-grade remote proctoring system.

### 6. AI Evaluation Report

After the session ends, the frontend sends session data to the backend, including:

- chat history
- code submissions
- MCQ score
- tab switch count
- time used
- whether the session was terminated
- extracted resume projects

The backend asks the LLM to return a structured JSON evaluation containing:

- overall score
- grade
- strengths
- weaknesses
- code quality breakdown
- section scores
- hiring recommendation
- next study steps

The frontend then renders this as the final performance report.

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Monaco Editor
- Axios
- MediaPipe Tasks Vision

### Backend

- Node.js
- Express
- TypeScript
- Multer
- `pdf-parse`
- Mongoose
- Axios
- `express-rate-limit`
- OpenAI SDK configured against the Groq-compatible API endpoint

### External Services

- Groq-compatible LLM API for resume extraction, interviewer chat, question generation, and final evaluation
- Judge0 via RapidAPI for code execution
- MongoDB connection support is present, although the current interview flow mainly works without a database

## Project Structure

```text
mvp/
├─ client/   # React frontend
└─ server/   # Express backend
```

Important frontend areas:

- `client/src/pages/` - landing page, interview arena, results page
- `client/src/context/InterviewContext.tsx` - central interview session state
- `client/src/hooks/useAntiCheat.ts` - webcam, gaze, and tab-switch monitoring
- `client/src/lib/api.ts` - frontend API client

Important backend areas:

- `server/src/index.ts` - Express app setup and route registration
- `server/src/controllers/resumeController.ts` - resume parsing
- `server/src/controllers/interviewerController.ts` - chat and resume question generation
- `server/src/controllers/codeController.ts` - code execution
- `server/src/controllers/resultsController.ts` - final evaluation

## API Endpoints

The backend exposes these main routes under `/api`:

- `POST /api/resume/upload` - upload and parse a PDF resume
- `POST /api/interview/chat` - send a message to the AI interviewer
- `POST /api/interview/generate-questions` - generate resume-based questions
- `POST /api/code/run` - run code through Judge0
- `POST /api/results/evaluate` - evaluate the completed interview session
- `GET /health` - health check

## Local Setup

### 1. Install dependencies

Install frontend dependencies:

```bash
cd client
npm install
```

Install backend dependencies:

```bash
cd server
npm install
```

### 2. Configure environment variables

Create a `.env` file inside `server/` with the values your backend expects:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/ai-interview

GROQ_API_KEY=your_groq_api_key
# or
XAI_API_KEY=your_alternative_api_key

RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=judge029.p.rapidapi.com
```

Notes:

- `GROQ_API_KEY` is used by the AI interviewer, resume parser, question generator, and evaluator.
- `RAPIDAPI_KEY` is required for code execution.
- MongoDB is attempted on startup, but the app is written to continue even if the database is unavailable.

### 3. Start the backend

```bash
cd server
npm run dev
```

The backend runs on `http://localhost:5000` by default.

### 4. Start the frontend

```bash
cd client
npm run dev
```

The frontend runs on Vite's default dev server, usually `http://localhost:5173`.

## Current Architecture Notes

- The frontend talks to `/api/...` routes using Axios.
- Interview state is managed mostly in memory through React context.
- LLM calls are centralized in backend controllers rather than being made directly from the browser.
- Code execution is outsourced to Judge0 instead of running arbitrary code locally.
- Some backend MongoDB wiring exists, but persistence does not appear to be central to the current MVP flow.

## MVP Limitations

This project is clearly built as an MVP, so a few trade-offs are worth noting:

- interview sessions are mostly in-memory on the client side
- database persistence is not fully central to the main flow yet
- AI responses depend on external API reliability
- code execution depends on RapidAPI/Judge0 availability
- anti-cheat checks are basic and browser-dependent
- there is no root workspace script yet to start both client and server together

## Who This Is For

This project is useful for:

- students preparing for technical interviews
- developers practicing coding and theory rounds
- recruiters or educators experimenting with AI-assisted mock interviews
- anyone building an interview simulator MVP with resume-aware questioning

## Summary

In short, this project is an AI mock interview system that combines:

- resume analysis
- question generation
- live interviewer chat
- coding execution
- anti-cheat monitoring
- automated result evaluation

It works by keeping the interview experience in the React frontend while delegating AI reasoning, PDF parsing, and code execution to the Express backend and external APIs.

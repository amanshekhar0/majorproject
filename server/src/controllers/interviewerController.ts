import { Request, Response } from "express";
import { createChatCompletion } from "../aiClient";
import type OpenAI from "openai";

const SYSTEM_PROMPT = `You are Alex, a senior technical interviewer + hiring manager teammate at a top-tier tech company. You are conducting a live, blended technical and behavioral mock interview.

CORE RULES — follow these without exception:
1. ALWAYS focus EXCLUSIVELY on the current question provided in [CURRENT QUESTION] below.
   - Do NOT introduce unrelated topics, concepts, or questions.
   - Do NOT ask generic questions like "tell me about yourself" unless the CURRENT QUESTION truly calls for it.
2. Your ONLY job is to assess the candidate's answer to the CURRENT QUESTION:
   - Ask clarifying follow-ups STRICTLY about that question/topic.
   - When the CURRENT QUESTION is technical (DSA, debugging, conceptual MCQ explanations, etc.), stay crisp and probing—edge cases, trade-offs, complexity, alternatives.
   - When the CURRENT QUESTION type is behavioral, guide with kindness and STAR structure—ask briefly for Situation, Task, Action, Result ONLY if gaps remain.
   - If they answer incorrectly on technical items, give a short hint and redirect back to the same question.
3. Rhythm: imagine you alternate between respectful behavioral coaching and disciplined technical dives—whatever the active question dictates.
4. When the question involves a project from the candidate's resume, ask specifically about that project's implementation details, trade-offs, and challenges — not generic questions.
5. When reviewing submitted code, give targeted feedback on that code only.
6. Keep ALL responses concise: 2-4 sentences max unless reviewing code.
7. Be professional, encouraging, empathetic (especially for behavioral prompts), yet direct when drilling technical depth.
8. If the candidate answers incorrectly, says "I don't know", "no", gives a one-word non-answer, or clearly irrelevant text:
   - Respond with firm, professional honesty — acknowledge the gap directly but respectfully, without sarcasm, insults, or profanity.
   - Briefly explain the correct answer / ideal STAR angle in 2-3 sentences.
   - End with exactly: "Let's move on to the next question." and stop there.

Never reveal you are an AI. Stay in character as Alex throughout.`;

export const chat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, history, context } = req.body as {
      message: string;
      history: Array<{ role: string; parts: Array<{ text: string }> }>;
      context?: {
        projects?: Array<{
          name: string;
          description: string;
          technologies: string[];
          highlights: string;
        }>;
        submittedCode?: string;
        language?: string;
        currentQuestion?: string;
        questionType?: string;
      };
    };

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    // Build context prefix — currentQuestion is the most important directive
    let contextPrefix = "";

    // ── MANDATORY: inject the current question as a strict directive ──────
    if (context?.currentQuestion) {
      const qType = context.questionType || "technical";
      contextPrefix += `[CURRENT QUESTION — you MUST focus ONLY on this]
Type: ${qType}
Question: ${context.currentQuestion}

Your job: assess the candidate's response to the above question. Ask follow-ups strictly about this topic. Do NOT change the subject.\n\n`;
    }

    if (context?.submittedCode) {
      contextPrefix += `[Candidate submitted ${context.language || "code"} for review]\n\`\`\`${context.language || ""}\n${context.submittedCode}\n\`\`\`\n\n`;
    }
    if (context?.projects?.length) {
      contextPrefix += `[Candidate resume projects for reference: ${context.projects.map((p) => p.name).join(", ")}]\n`;
    }

    // Convert history to OpenAI format
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(history || []).map((h) => ({
        role: (h.role === "assistant" || h.role === "model"
          ? "assistant"
          : "user") as "user" | "assistant",
        content: h.parts.map((p) => p.text).join(""),
      })),
      { role: "user", content: contextPrefix + message },
    ];

    try {
      const responseText =
        (await createChatCompletion({
          messages,
          max_tokens: 512,
          temperature: 0.7,
        })) || "No response generated.";
      res.json({ success: true, message: responseText });
    } catch (aiErr) {
      // AI unavailable — return a graceful fallback
      console.warn("AI chat unavailable:", (aiErr as Error).message);
      res.json({
        success: true,
        message:
          "That's a solid attempt! I noticed some interesting points in your answer. Think about edge cases and time complexity as well. Let's continue — what else can you tell me about your approach?",
      });
    }
  } catch (err: unknown) {
    console.error("Interviewer chat error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `AI interviewer error: ${message}` });
  }
};

export const generateQuestions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { projects } = req.body as {
      projects: Array<{
        name: string;
        description: string;
        technologies: string[];
        highlights: string;
      }>;
    };

    const projectContext = projects?.length
      ? projects
          .map(
            (p) => `${p.name}: ${p.description} (${p.technologies.join(", ")})`,
          )
          .join("; ")
      : "No specific projects provided.";

    const prompt = `Generate 2 deep-dive technical interview questions about the candidate's projects.
Projects: ${projectContext}

Respond ONLY with valid JSON:
{
  "questions": [
    { "id": "resume_1", "type": "resume_deep", "question": "...", "project": "...", "followUp": "..." },
    { "id": "resume_2", "type": "resume_deep", "question": "...", "project": "...", "followUp": "..." }
  ]
}`;

    try {
      const text = await createChatCompletion({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      });
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI returned non-JSON");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      res.json({ success: true, questions: parsed.questions });
    } catch (aiErr) {
      // AI unavailable — return fallback resume questions
      console.warn("AI question gen unavailable, using fallbacks:", (aiErr as Error).message);
      const fallbackQuestions = (projects || []).slice(0, 2).map((p, i) => ({
        id: `resume_${i + 1}`,
        type: "resume_deep",
        question: `Walk me through the architecture and key design decisions of your "${p.name}" project. What were the main technical challenges you faced?`,
        project: p.name,
        followUp: `If you had to scale this project to 10x the users, what would you change?`,
      }));
      // If no projects, generate generic deep-dive questions
      if (!fallbackQuestions.length) {
        fallbackQuestions.push(
          {
            id: "resume_1",
            type: "resume_deep",
            question: "Tell me about the most technically challenging project you've worked on. What was the architecture and what trade-offs did you make?",
            project: "General",
            followUp: "How would you improve it if you had more time?",
          },
          {
            id: "resume_2",
            type: "resume_deep",
            question: "Describe a time you had to debug a complex issue in production. What tools and strategies did you use?",
            project: "General",
            followUp: "What monitoring would you add to prevent similar issues?",
          },
        );
      }
      res.json({ success: true, questions: fallbackQuestions });
    }
  } catch (err: unknown) {
    console.error("Generate questions error:", err);
    res.status(500).json({ error: "Failed to generate resume questions" });
  }
};

export const generateRandomQuestions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { difficulty = "medium", projects = [] } = req.body as {
      difficulty?: "easy" | "medium" | "hard";
      projects?: Array<{
        name: string;
        description: string;
        technologies: string[];
        highlights: string;
      }>;
    };

    const projectContext = projects.length
      ? projects
          .map(
            (p) =>
              `${p.name}: ${p.description} (${(p.technologies || []).join(", ")})`,
          )
          .join("; ")
      : "No resume projects provided.";

    const prompt = `Generate a realistic mock interview question set as valid JSON only.
Difficulty: ${difficulty}
Candidate projects: ${projectContext}

Rules:
- Return EXACTLY 10 questions.
- Include a balanced mix: 3 mcq, 1 output_guess/debugging, 2 dsa (coding algorithms), 1 sql (writing queries), 1 behavioral, 2 resume_deep.
- Keep the questions practical and interview-grade.
- For mcq include options[4], correctAnswer, explanation.
- For output_guess/debugging include code, language (python|javascript|java|cpp), correctAnswer, explanation.
- For dsa include starterCode for python/java/cpp and explanation. NEVER write the solution inside the starterCode; it must be an empty template (e.g. function signature only).
- For sql, set the "type" field to "dsa" and include starterCode for "sql" (e.g. { "sql": "-- Write your SQL query here\\n" }). NEVER write the SQL solution inside the starterCode. Include the database schema in the question description and put the correct SQL solution in the explanation field.
- Every item must include: id, type, difficulty, question, timeLimit.
- ids should be unique strings.

Return JSON:
{
  "questions": [
    {
      "id": "ai_1",
      "type": "mcq|output_guess|debugging|dsa|behavioral|resume_deep",
      "difficulty": "${difficulty}",
      "question": "...",
      "options": ["..."],
      "correctAnswer": "...",
      "explanation": "...",
      "code": "...",
      "language": "python",
      "starterCode": { "python": "...", "java": "...", "cpp": "..." },
      "followUp": "...",
      "timeLimit": 180
    }
  ]
}`;

    try {
      const text = await createChatCompletion({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 3000,
      });
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI returned non-JSON");
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        questions?: Array<Record<string, unknown>>;
      };
      const questions = (parsed.questions || []).map((q, idx) => ({
        ...q,
        id: typeof q.id === "string" ? q.id : `ai_${difficulty}_${idx + 1}`,
        difficulty,
        timeLimit:
          typeof q.timeLimit === "number" && q.timeLimit > 0
            ? q.timeLimit
            : q.type === "dsa"
              ? 1200
              : q.type === "behavioral"
                ? 300
                : 180,
      }));

      if (!questions.length) {
        throw new Error("AI returned empty question set");
      }

      res.json({ success: true, questions });
    } catch (aiErr) {
      // AI unavailable — return empty so client falls back to static question bank
      console.warn("AI random question gen unavailable:", (aiErr as Error).message);
      res.json({ success: true, questions: [] });
    }
  } catch (err: unknown) {
    console.error("Generate random questions error:", err);
    res.status(500).json({ error: "Failed to generate random questions" });
  }
};

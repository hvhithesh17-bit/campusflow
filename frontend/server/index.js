// server/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatic .env loader: checks local server/.env and root .env
const localEnv = path.resolve(__dirname, ".env");
const rootEnv = path.resolve(__dirname, "..", ".env");

if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config();
}

console.log("------------------------------------------");
console.log("Gemini API Key Loaded:", Boolean(process.env.GEMINI_API_KEY));
console.log("------------------------------------------");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173", "*"] }));
app.use(express.json());

// Comprehensive System Instructions for Academic Advising
const SYSTEM_INSTRUCTION = `
You are the CampusFlow Academic AI Assistant, an intelligent, objective, and empathetic advisor for university students.

YOUR CORE DIRECTIVES:
1. STRICT DATA GROUNDING: Rely exclusively on the provided 'academicContext' JSON payload. Never invent course names, grades, credits, attendance percentages, or assignments.
2. MISSING DATA HANDLING: If attendance, grade point, or assignments for a course are null, 0 total classes, or marked unavailable, explicitly state: "Data unavailable" — NEVER assume 0% or failure.
3. CONCISE & ACTIONABLE: Avoid generic filler or empty motivation (e.g., avoid "Just study harder!"). Use exact numbers, subject names, and specific minute durations.
4. READ-ONLY SCOPE: You cannot modify Firebase data, change grades, delete tasks, or schedule database items directly.

CORE QUERY HANDLING INSTRUCTIONS:
- "What should I study today?": Identify the #1 subject from 'topStudyRecommendations'. State the subject name, recommended study duration (e.g. 90 min), and bullet points citing exact reasons (attendance, grade point, overdue tasks).
- "Which subject needs the most attention?" / "Which subject is my weakest?": Identify the subject with the highest priority score, lowest attendance percentage (<75%), or lowest grade point (<=6). Explain the exact metrics.
- "Which subject is my strongest?": Identify the subject with the highest grade point (e.g. 9-10) or highest attendance (>=85%) with 0 overdue tasks.
- "Analyze my attendance": Report overall attendance percentage. Detail any subjects strictly below 75% first, then 75%-85%, and give concrete recovery advice (e.g., "Attend the next 3 consecutive lectures to cross 75%").
- "Analyze my SGPA" / "How can I improve my SGPA?": Report current SGPA and status. Highlight high-credit subjects (credits >= 3) with low grade points where improvement creates the highest mathematical multiplier on total SGPA. Never guarantee a score.
- "Analyze my assignments": Summarize Total, Completed, Pending, and Overdue tasks. Call out subjects with multiple pending or overdue deadlines.
- "How much should I study this week?": Compare 'weeklyCompletedMinutes' against 'weeklyGoalMinutes'. Recommend a daily breakdown to hit the remaining target.
- "Create a study strategy": Provide a realistic, 2-day or 3-day schedule allocating specific subjects and recommended durations (90m for high, 60m for medium, 30m for low). Mention: "Use the [Add to Study Planner] button on your Study Planner page to schedule these sessions."
`;

// Helper: Call Gemini API using available models from your key's verified list
async function callGemini(prompt, systemInstruction = "") {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  // Active candidate models in fallback order
  const candidateModels = [
    "gemini-3.5-flash",
    "gemini-3.7-flash",
    "gemini-3-flash-preview",
    "gemini-flash-latest",
    "gemini-pro-latest"
  ];

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
        },
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }

      if (data.error) {
        lastError = data.error.message;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  throw new Error(lastError || "All Gemini model endpoints failed.");
}

// -------------------------------------------------------------
// ROUTES
// -------------------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CampusFlow AI Backend is running 🚀",
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { question, academicContext } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "A valid question is required." });
    }

    const prompt = `
STUDENT ACADEMIC CONTEXT:
${JSON.stringify(academicContext, null, 2)}

STUDENT QUESTION:
"${question}"

Please provide a helpful, metric-driven response adhering strictly to your system instructions.
`;

    const reply = await callGemini(prompt, SYSTEM_INSTRUCTION);
    return res.json({ reply });
  } catch (error) {
    console.error("Chat Error:", error.message);
    return res.status(500).json({
      error: error.message || "Failed to communicate with AI provider.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 CampusFlow AI Server running on port ${PORT}`);
});
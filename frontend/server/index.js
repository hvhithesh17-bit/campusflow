// server/index.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ============================================================
// PATH SETUP
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// LOAD .ENV
// ============================================================

const localEnv = path.resolve(__dirname, ".env");
const rootEnv = path.resolve(__dirname, "..", ".env");

if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config();
}

// ============================================================
// STARTUP INFORMATION
// ============================================================

console.log("------------------------------------------");
console.log("CampusFlow AI Backend");
console.log("------------------------------------------");

console.log(
  "Gemini API Key Loaded:",
  Boolean(process.env.GEMINI_API_KEY)
);

console.log("------------------------------------------");

// ============================================================
// EXPRESS APP
// ============================================================

const app = express();

const PORT = process.env.PORT || 5000;

// ============================================================
// CORS
// ============================================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      // Allow configured origins.
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow during development/deployment testing.
      return callback(null, true);
    },
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

// ============================================================
// SYSTEM INSTRUCTION
// ============================================================

const SYSTEM_INSTRUCTION = `
You are the CampusFlow Academic AI Assistant.

You are an intelligent, objective, practical and empathetic
academic advisor for university students.

CORE RULES:

1. STRICT DATA GROUNDING

Use only the information provided inside academicContext.

Never invent:

- subject names
- grades
- credits
- attendance
- assignments
- IA marks
- SGPA
- study progress

2. MISSING DATA

If information is unavailable, explicitly say:

"Data unavailable"

Never assume missing information is zero.

3. IA MARKS

When IA data is available:

- IA-1 is out of 50.
- IA-2 is out of 50.
- Identify weak subjects.
- Suggest realistic IA-2 targets.
- Explain why a subject needs attention.
- Prioritize high-credit subjects when appropriate.

4. SGPA

Use the provided SGPA information.

Never guarantee a future SGPA.

Use phrases such as:

- expected SGPA
- estimated SGPA
- possible improvement

5. STUDY RECOMMENDATIONS

Give specific recommendations.

HIGH priority:
90 minutes

MEDIUM priority:
60 minutes

LOW priority:
30 minutes

6. ATTENDANCE

Prioritize subjects below 75%.

Give practical recovery advice.

7. ASSIGNMENTS

Mention:

- pending assignments
- overdue assignments
- subjects with multiple pending tasks

8. STUDY PLANNER

When recommending study sessions, tell the student:

"Use the Add to Study Planner option to schedule this session."

9. READ ONLY

You cannot directly:

- modify Firebase
- change grades
- delete assignments
- create study sessions

You can only recommend actions.

10. RESPONSE STYLE

Keep responses:

- concise
- practical
- metric-driven
- easy to understand

Use the student's actual subject names and numbers.
`;

// ============================================================
// GEMINI API FUNCTION
// ============================================================

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured on the server."
    );
  }

  // ==========================================================
  // GEMINI MODEL FALLBACK
  // ==========================================================

  const models = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
  ];

  let lastError = null;

  for (const model of models) {
    try {
      console.log(
        `Trying Gemini model: ${model}`
      );

      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/` +
        `${model}:generateContent`;

      const payload = {
        systemInstruction: {
          parts: [
            {
              text: SYSTEM_INSTRUCTION,
            },
          ],
        },

        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],

        generationConfig: {
          maxOutputTokens: 1000,
        },
      };

      const response = await fetch(url, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },

        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // ======================================================
      // SUCCESS
      // ======================================================

      if (response.ok) {
        const reply =
          data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (reply) {
          console.log(
            `Gemini response received from ${model}`
          );

          return reply;
        }

        lastError =
          "Gemini returned an empty response.";

        continue;
      }

      // ======================================================
      // ERROR
      // ======================================================

      const errorMessage =
        data?.error?.message ||
        `Gemini returned HTTP ${response.status}`;

      console.log(
        `${model} failed: ${response.status}`
      );

      console.log(
        errorMessage
      );

      lastError = errorMessage;

      // ======================================================
      // TEMPORARY ERRORS
      // Try another model.
      // ======================================================

      if (
        response.status === 429 ||
        response.status === 500 ||
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504
      ) {
        console.log(
          `Trying next Gemini model...`
        );

        continue;
      }

      // ======================================================
      // OTHER ERRORS
      // ======================================================

      break;
    } catch (error) {
      console.log(
        `Request failed for ${model}:`,
        error.message
      );

      lastError = error.message;
    }
  }

  throw new Error(
    lastError ||
      "All Gemini models are currently unavailable."
  );
}

// ============================================================
// ROOT HEALTH CHECK
// ============================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,

    service:
      "CampusFlow AI Backend",

    status:
      "running",

    timestamp:
      new Date().toISOString(),
  });
});

// ============================================================
// API HEALTH CHECK
// ============================================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,

    message:
      "CampusFlow AI API is healthy",

    geminiConfigured:
      Boolean(
        process.env.GEMINI_API_KEY
      ),
  });
});

// ============================================================
// CHAT API
// ============================================================

app.post("/api/chat", async (req, res) => {
  try {
    const {
      question,
      academicContext,
    } = req.body;

    // ========================================================
    // VALIDATE QUESTION
    // ========================================================

    if (
      !question ||
      typeof question !== "string" ||
      !question.trim()
    ) {
      return res.status(400).json({
        success: false,

        error:
          "A valid question is required.",
      });
    }

    // ========================================================
    // BUILD AI PROMPT
    // ========================================================

    const prompt = `
STUDENT ACADEMIC CONTEXT:

${JSON.stringify(
  academicContext || {},
  null,
  2
)}

STUDENT QUESTION:

"${question.trim()}"

Answer the student's question using only
the provided academic context.

If information is missing, say:

"Data unavailable."

Give practical, specific and
metric-driven recommendations.
`;

    // ========================================================
    // CALL GEMINI
    // ========================================================

    const reply =
      await callGemini(prompt);

    // ========================================================
    // SUCCESS RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      reply,
    });
  } catch (error) {
    console.error(
      "------------------------------------------"
    );

    console.error(
      "Chat Error:",
      error.message
    );

    console.error(
      "------------------------------------------"
    );

    return res.status(500).json({
      success: false,

      error:
        error.message ||
        "Failed to communicate with AI provider.",
    });
  }
});

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,

    error:
      "API endpoint not found.",
  });
});

// ============================================================
// SERVER
// ============================================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `CampusFlow AI Server running on port ${PORT}`
    );
  }
);
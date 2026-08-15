// server/check-models.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ No GEMINI_API_KEY found in .env");
  process.exit(1);
}

async function listAvailableModels() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();

    if (data.error) {
      console.error("❌ Google API Error:", data.error.message);
      return;
    }

    console.log("✅ Available Models for your API Key:");
    const generateModels = data.models
      ?.filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      ?.map((m) => m.name.replace("models/", ""));

    console.log(generateModels);
  } catch (err) {
    console.error("❌ Request failed:", err.message);
  }
}

listAvailableModels();
import { GoogleGenAI } from "@google/genai";

const ALLOWED_ORIGIN =
  "https://dempseypaulafae-jpg.github.io";

const MODEL = "gemini-2.5-flash-lite";
const requestLog = new Map();

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;

  if (origin === ALLOWED_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function hasExceededLimit(req) {
  const forwarded = req.headers["x-forwarded-for"];

  const ip =
    (Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(",")[0]) ||
    req.socket?.remoteAddress ||
    "unknown";

  const now = Date.now();
  const previousRequests = requestLog.get(ip) || [];

  const recentRequests = previousRequests.filter(
    time => now - time < 60000
  );

  if (recentRequests.length >= 15) {
    requestLog.set(ip, recentRequests);
    return true;
  }

  recentRequests.push(now);
  requestLog.set(ip, recentRequests);
  return false;
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.headers.origin !== ALLOWED_ORIGIN) {
    return res.status(403).json({
      error: "This website is not permitted to use the assistant."
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  if (hasExceededLimit(req)) {
    res.setHeader("Retry-After", "60");

    return res.status(429).json({
      error:
        "The assistant is receiving too many requests. Please wait one minute and try again."
    });
  }

  const message =
    typeof req.body?.message === "string"
      ? req.body.message.trim()
      : "";

  const suppliedHistory = Array.isArray(req.body?.history)
    ? req.body.history
    : [];

  if (!message || message.length > 1000) {
    return res.status(400).json({
      error: "Please enter a question of 1,000 characters or fewer."
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "The assistant has not been configured."
    });
  }

  const history = suppliedHistory
    .slice(-10)
    .flatMap(turn => {
      if (
        typeof turn?.user !== "string" ||
        typeof turn?.assistant !== "string"
      ) {
        return [];
      }

      return [
        {
          role: "user",
          parts: [{ text: turn.user.slice(0, 1000) }]
        },
        {
          role: "model",
          parts: [{ text: turn.assistant.slice(0, 2000) }]
        }
      ];
    });

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const chat = ai.chats.create({
      model: MODEL,
      history,
      config: {
        systemInstruction: `
You are the AquaNest Help Assistant for a fictitious Irish
company supplying smart filtration systems for aquariums.

Help customers with red or amber warning lights, cartridge
replacement, low water flow and sensor cleaning.

Follow these rules:
- Use clear, concise and relevant plain English.
- Ask for the filter model, tank size and warning-light colour
  when necessary.
- Do not invent product, warranty, refund or safety information.
- Do not claim that an action has been completed.
- Advise switching the filter off before opening or cleaning it.
- Never recommend soap or household chemicals.
- If fish appear distressed or are gasping, recommend urgent
  assistance from a qualified aquarium specialist.
- If information is unavailable, say so and recommend contacting
  AquaNest support.
- Keep most answers below 120 words.
        `
      }
    });

    const response = await chat.sendMessage({
      message
    });

    const answer = response.text?.trim();

    if (!answer) {
      throw new Error("Gemini returned an empty response.");
    }

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("Gemini request failed:", error);

    return res.status(502).json({
      error:
        "The assistant could not respond just now. Please try again shortly."
    });
  }
}

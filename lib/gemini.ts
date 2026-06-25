import { GoogleGenAI, Type, type Part } from "@google/genai";
import type { NutritionResult } from "./types";

// Primary model (per project spec). flash-lite occasionally returns transient
// 503 "high demand"; we fall back to the next model only when the primary is
// transiently unavailable, so flash-lite stays the default in normal operation.
export const GEMINI_MODEL = "gemini-2.5-flash-lite";
export const MODEL_CHAIN = [GEMINI_MODEL, "gemini-2.5-flash"];

/** Thrown when the API key is missing — surfaced as a 500 by the routes. */
export class MissingApiKeyError extends Error {
  constructor() {
    super("GEMINI_API_KEY is not set in the environment (.env).");
    this.name = "MissingApiKeyError";
  }
}

let client: GoogleGenAI | null = null;

/** Lazily create a single GoogleGenAI client (reused across requests). */
function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new MissingApiKeyError();
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

// JSON schema Gemini must conform to. Forcing a schema (structured output) means
// we get parseable JSON back instead of free-form prose.
const nutritionSchema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      description: "One entry per distinct food identified.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Food name, e.g. 'Grilled chicken breast'." },
          servingSize: { type: Type.STRING, description: "Estimated portion, e.g. '150 g' or '1 cup'." },
          calories: { type: Type.NUMBER, description: "Calories (kcal) for this item." },
          protein: { type: Type.NUMBER, description: "Protein in grams." },
          carbs: { type: Type.NUMBER, description: "Carbohydrates in grams." },
          fat: { type: Type.NUMBER, description: "Fat in grams." },
        },
        required: ["name", "servingSize", "calories", "protein", "carbs", "fat"],
        propertyOrdering: ["name", "servingSize", "calories", "protein", "carbs", "fat"],
      },
    },
    total: {
      type: Type.OBJECT,
      description: "Sum of all items.",
      properties: {
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER },
        carbs: { type: Type.NUMBER },
        fat: { type: Type.NUMBER },
      },
      required: ["calories", "protein", "carbs", "fat"],
      propertyOrdering: ["calories", "protein", "carbs", "fat"],
    },
    notes: {
      type: Type.STRING,
      description: "Optional caveats about the estimate (assumptions, uncertainty).",
    },
  },
  required: ["items", "total"],
  propertyOrdering: ["items", "total", "notes"],
};

const SYSTEM_INSTRUCTION = [
  "You are a nutrition estimation assistant for a calorie-tracking app.",
  "Identify each distinct food in the input and estimate its calories and macros",
  "(protein, carbs, fat in grams) for a realistic single serving.",
  "Use common nutrition databases as your basis. If a portion is unspecified, assume",
  "a typical serving and say so in 'notes'. Round calories to whole numbers and macros",
  "to at most one decimal. The 'total' must equal the sum of the items.",
  "If the input contains no identifiable food, return an empty items array, zeroed",
  "totals, and explain why in 'notes'.",
].join(" ");

/** True for transient errors worth retrying (overloaded / rate-limited). */
function isTransient(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (status === 503 || status === 429 || status === 500) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /UNAVAILABLE|overloaded|high demand|rate.?limit|RESOURCE_EXHAUSTED/i.test(msg);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Send content parts (text and/or image) to Gemini and return structured
 * nutrition data. Retries transient 503/429 spikes with backoff, then falls
 * back to the next model in MODEL_CHAIN if the current one stays unavailable.
 * Throws on persistent/non-transient failure; callers map to HTTP responses.
 */
export async function analyzeNutrition(parts: Part[]): Promise<NutritionResult> {
  const ai = getClient();

  const attemptsPerModel = 3;
  let lastErr: unknown;
  let response: Awaited<ReturnType<typeof ai.models.generateContent>> | undefined;

  outer: for (const model of MODEL_CHAIN) {
    for (let attempt = 1; attempt <= attemptsPerModel; attempt++) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts }],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: nutritionSchema,
            temperature: 0.2,
          },
        });
        break outer;
      } catch (err) {
        lastErr = err;
        if (!isTransient(err)) throw err; // real error (bad key, bad request) — stop now
        if (attempt < attemptsPerModel) {
          await sleep(400 * 2 ** (attempt - 1)); // 0.4s, 0.8s, then next model
        }
      }
    }
  }

  if (!response) {
    throw lastErr instanceof Error ? lastErr : new Error("Gemini request failed.");
  }

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  let parsed: NutritionResult;
  try {
    parsed = JSON.parse(text) as NutritionResult;
  } catch {
    throw new Error("Gemini returned malformed JSON.");
  }

  // Normalize defensively so callers always get the expected shape.
  return {
    items: Array.isArray(parsed.items) ? parsed.items : [],
    total: parsed.total ?? { calories: 0, protein: 0, carbs: 0, fat: 0 },
    notes: parsed.notes,
  };
}

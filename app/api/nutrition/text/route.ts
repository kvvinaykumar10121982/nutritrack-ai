import { NextResponse } from "next/server";
import { analyzeNutrition, MissingApiKeyError } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // Gemini calls can take a few seconds.

/**
 * POST /api/nutrition/text
 * Body: { "description": "grilled chicken with rice and salad" }
 * Returns structured nutrition data: { items, total, notes? }
 */
export async function POST(request: Request) {
  let body: { description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const description = body.description?.trim();
  if (!description) {
    return NextResponse.json(
      { error: "Field 'description' is required." },
      { status: 400 }
    );
  }
  if (description.length > 2000) {
    return NextResponse.json(
      { error: "Description is too long (max 2000 characters)." },
      { status: 400 }
    );
  }

  try {
    const result = await analyzeNutrition([
      { text: `Estimate the nutrition for this meal: "${description}"` },
    ]);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("[nutrition/text] Gemini error:", err);
    return NextResponse.json(
      { error: "Failed to analyze nutrition. Please try again." },
      { status: 502 }
    );
  }
}

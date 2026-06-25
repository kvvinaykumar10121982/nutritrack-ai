import { NextResponse } from "next/server";
import { analyzeNutrition, MissingApiKeyError } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // Gemini vision calls can take a few seconds.

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB upload cap.
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

/**
 * POST /api/nutrition/image
 * Body: multipart/form-data with an "image" file field.
 * Returns structured nutrition data: { items, total, notes? }
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data with an 'image' field." },
      { status: 400 }
    );
  }

  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Field 'image' (a file) is required." },
      { status: 400 }
    );
  }

  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: `Unsupported image type '${mimeType}'. Use JPEG, PNG, WebP, or HEIC.` },
      { status: 400 }
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Uploaded image is empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image is too large (max 8 MB)." },
      { status: 413 }
    );
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  try {
    const result = await analyzeNutrition([
      {
        text:
          "Identify the foods in this meal photo and estimate calories and macros " +
          "for the portions shown.",
      },
      { inlineData: { mimeType, data: base64 } },
    ]);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("[nutrition/image] Gemini error:", err);
    return NextResponse.json(
      { error: "Failed to analyze the image. Please try again." },
      { status: 502 }
    );
  }
}

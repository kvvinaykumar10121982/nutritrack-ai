import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { FOODS } from "@/lib/foods";
import { isSameDay } from "@/lib/utils";
import { isMealCategory, mealForTime } from "@/lib/meals";
import type { LogEntry, NutritionItem } from "@/lib/types";

// Avoid static optimization — this route reads/writes a file at runtime.
export const dynamic = "force-dynamic";

/** Coerce an untrusted value to a finite, non-negative number (default 0). */
function safeNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Validate + sanitize an arbitrary (e.g. AI-generated) food item into a Food.
 * Returns null if it isn't a usable item (no name). Numbers are sanitized so a
 * bad value can never corrupt the running totals.
 */
function sanitizeItem(raw: unknown): NutritionItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (!name) return null;
  const servingSize =
    typeof r.servingSize === "string" && r.servingSize.trim()
      ? r.servingSize.trim()
      : "1 serving";
  return {
    name,
    servingSize,
    calories: safeNumber(r.calories),
    protein: safeNumber(r.protein),
    carbs: safeNumber(r.carbs),
    fat: safeNumber(r.fat),
  };
}

/** GET /api/log — return today's log entries (newest first). */
export async function GET() {
  const db = await getDb();
  const today = db.data.log
    .filter((e) => isSameDay(e.loggedAt))
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  return NextResponse.json({ log: today });
}

/**
 * POST /api/log — add a food to today's log. Accepts either:
 *   { foodId }        → quick-add from the static catalog (macros from FOODS)
 *   { item }          → an arbitrary item (e.g. from an AI nutrition lookup)
 */
export async function POST(request: Request) {
  let body: { foodId?: string; item?: unknown; meal?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const meal = isMealCategory(body.meal) ? body.meal : mealForTime();

  let food: NutritionItem & { id: string };

  if (body.foodId !== undefined) {
    const catalogFood = FOODS.find((f) => f.id === body.foodId);
    if (!catalogFood) {
      return NextResponse.json({ error: "Unknown foodId" }, { status: 400 });
    }
    food = catalogFood;
  } else if (body.item !== undefined) {
    const item = sanitizeItem(body.item);
    if (!item) {
      return NextResponse.json(
        { error: "Invalid item: a non-empty 'name' is required." },
        { status: 400 }
      );
    }
    food = { ...item, id: crypto.randomUUID() };
  } else {
    return NextResponse.json(
      { error: "Provide either 'foodId' or 'item'." },
      { status: 400 }
    );
  }

  const entry: LogEntry = {
    ...food,
    entryId: crypto.randomUUID(),
    loggedAt: new Date().toISOString(),
    meal,
  };

  const db = await getDb();
  db.data.log.push(entry);
  await db.write();

  return NextResponse.json({ entry }, { status: 201 });
}

/** DELETE /api/log — clear all of today's entries. */
export async function DELETE() {
  const db = await getDb();
  db.data.log = db.data.log.filter((e) => !isSameDay(e.loggedAt));
  await db.write();
  return NextResponse.json({ ok: true });
}

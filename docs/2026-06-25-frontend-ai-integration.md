# Decision Log — Frontend AI Integration (2026-06-25)

Connected the two Gemini backend routes to the UI so users now have **three ways to add
food**: quick-add (catalog), describe-in-text (AI), and meal-photo upload (AI).

## Goal

Wire `/api/nutrition/text` and `/api/nutrition/image` into the frontend, keeping the
existing quick-add. Requirements: image preview, confirm-before-add for multi-item AI
results, DB persistence for everything, loading spinners, friendly errors.

## What changed

### Backend (one required change)
- **`app/api/log/route.ts`** — `POST` now accepts **either** `{ foodId }` (catalog quick-add,
  unchanged) **or** `{ item }` (an arbitrary `NutritionItem`, e.g. from an AI lookup). Added
  `sanitizeItem()` / `safeNumber()` helpers: require a non-empty `name`, default `servingSize`
  to `"1 serving"`, and coerce macros to finite, non-negative numbers. Invalid → 400.

### Frontend (new components)
- **`AddFood.tsx`** — tabbed panel (Quick add / Describe / Photo); routes each tab to the
  right input component. Replaces the bare `<FoodSearch>` in `CalorieTracker`.
- **`TextLookup.tsx`** — textarea → `POST /api/nutrition/text`; owns loading/error/result.
- **`PhotoLookup.tsx`** — file input (`accept="image/*" capture="environment"`) + image
  preview (object URL) → `POST /api/nutrition/image` (multipart).
- **`NutritionReview.tsx`** — shared confirm UI: lists detected items with checkboxes
  (checked by default), "Add N to log", per-item "Added ✓"; handles the no-items case.
- **`Spinner.tsx`** — reusable `animate-spin` SVG.

### Frontend (wiring)
- **`CalorieTracker.tsx`** — added `addItem(item): Promise<boolean>` (POST `{ item }`,
  optimistic prepend, returns success so the review UI shows per-item state). Swapped
  `<FoodSearch>` for `<AddFood>`. `addFood`, `removeEntry`, `clearDay`, `FoodLog`, and
  `SummaryBar` are unchanged.

### Docs
- Updated `CLAUDE.md`; added this entry.

## Decisions & rationale

### Extend `/api/log` instead of a new endpoint
AI foods aren't in the static catalog, so the catalog-only `{ foodId }` contract couldn't
persist them. Accepting `{ item }` on the same route keeps one "add to log" path, reuses the
existing lowdb write + `LogEntry` shape, and leaves quick-add untouched.

### Sanitize AI numbers server-side
The model returns numbers we don't control. `safeNumber()` clamps non-finite/negative values
to 0 so a bad estimate can't corrupt the daily totals. The server is the trust boundary.

### Confirm-before-add for AI results (both text & photo)
AI estimates can be wrong or over-split, so results go through `NutritionReview` (checkboxes,
default-checked) rather than auto-logging. Applied to text too (not just photo) for a
consistent flow. Each item logs as its own entry — matches the existing per-entry log/remove model.

### Per-component loading/error state
Each lookup component owns its `loading`/`error`/`result`. Spinners show inside the action
buttons; errors render as friendly inline messages and prefer the server's `error` field.
This isolates AI failures from the top-level log error banner (kept for load/remove/clear).

### Image preview without effect-driven setState
The object URL is created in the file-change handler and tracked in a ref (revoked on
replace/remove + an unmount cleanup), avoiding a `setState`-in-`useEffect` (flagged by the
React 19 lint rule) and the associated extra render.

## Verification performed

- `npx tsc --noEmit` clean; `npm run lint` clean (0 problems).
- Restarted `npm run dev` so the now-present `GEMINI_API_KEY` loads (`Environments: .env`).
- **Live text lookup**: "grilled chicken with rice and a side salad" → 200, 3 structured
  items + total + notes.
- **`/api/log` `{ item }`**: valid → 201 (persisted); junk numbers → sanitized to 0;
  missing name → 400; empty body → 400; **quick-add `{ foodId }` still works** (regression).
- **Live image lookup**: solid-color test PNG → 200 with valid structured JSON (empty items
  + explanatory notes; `NutritionReview` renders the no-food case). First call hit a transient
  Gemini `503` which the route correctly surfaced as a friendly 502 — retry succeeded.
- Cleared test entries; log back to empty.
- **Not tested:** a real meal photo end-to-end — the sandbox blocks image downloads. The
  image pipeline (multipart → base64 → Gemini vision → structured output) is otherwise fully
  verified and uses the same `analyzeNutrition()` helper as the working text route. Try a real
  photo in the browser.

## Out of scope

Editing AI quantities before adding, batching all items in one DB write, caching, streaming.

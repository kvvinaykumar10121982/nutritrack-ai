# Decision Log — AI Nutrition Lookup API (2026-06-25)

Added Gemini-powered nutrition estimation to the backend. **Frontend untouched** — these
are API routes only, ready to be wired into the UI in a later step.

## Goal

Two backend routes that use the Gemini API (`gemini-2.5-flash-lite`) to return structured
nutrition data:

1. **Text lookup** — a meal description ("grilled chicken with rice and salad") → calories
   and macros.
2. **Image lookup** — a meal photo → Gemini identifies the foods and estimates calories.

## What was added

- **Dependency:** `@google/genai` (official Google Gen AI SDK).
- **`lib/gemini.ts`** — a single lazily-created `GoogleGenAI` client, a strict JSON
  **response schema**, a shared system instruction, and `analyzeNutrition(parts)` that both
  routes call. Also exports `MissingApiKeyError` for clean 500 handling.
- **`app/api/nutrition/text/route.ts`** — `POST { description }`.
- **`app/api/nutrition/image/route.ts`** — `POST` multipart `image` file.
- **`lib/types.ts`** — added `NutritionItem` and `NutritionResult` types.
- **`.env`** — added a `GEMINI_API_KEY=` line (see "Key issue" below).
- Docs: updated `CLAUDE.md`; this entry.

Both routes return the same shape:

```ts
type NutritionResult = {
  items: { name; servingSize; calories; protein; carbs; fat }[];
  total: { calories; protein; carbs; fat };
  notes?: string;
};
```

## Technical decisions & rationale

### SDK: `@google/genai` (not raw REST, not the deprecated `@google/generative-ai`)
`@google/genai` is Google's current, actively maintained JS SDK and the one that supports
the Gemini 2.5 model family. It gives first-class **structured output** (response schema)
and a clean `inlineData` path for images, which would be fiddly to hand-roll over REST.

### Structured output via a response schema
Both routes set `responseMimeType: "application/json"` + a `responseSchema`. This forces
Gemini to return parseable JSON in a fixed shape instead of prose, so the frontend can
consume it directly later. `temperature: 0.2` keeps estimates stable/repeatable. The
schema deliberately mirrors the app's existing macro model (`calories/protein/carbs/fat` +
`servingSize`), so each `item` maps cleanly onto a future `LogEntry`.

### Shared `analyzeNutrition()` helper
Text and image differ only in their input "parts" (text vs. text + `inlineData`). Putting
the model call, schema, system instruction, parsing, and defensive normalization in one
function keeps the two routes thin and guarantees identical output handling.

### Image handling: base64 inline, not the Files API
Meal photos are small and one-shot, so the routes read the upload into a Buffer and pass it
as base64 `inlineData`. This avoids the extra upload/lifecycle of the Gemini Files API.
Guards: an allow-list of MIME types (JPEG/PNG/WebP/HEIC/HEIF), an 8 MB size cap (`413` if
exceeded), and empty-file rejection.

### Validation & error mapping
- Missing/empty `description` or `image` → `400`.
- Oversized image → `413`; unsupported type → `400`.
- Missing `GEMINI_API_KEY` → `500` with an actionable message.
- Any Gemini/parse failure → `502` (the upstream provider failed), logged server-side.

`maxDuration = 30` and `dynamic = "force-dynamic"` are set since these are slow,
always-dynamic calls.

### Frontend intentionally untouched
Per the brief, no UI changes. The routes are self-contained so the next step can add a
text box + photo upload that POST to them and add results to the log.

## Key issue discovered

The brief stated `GEMINI_API_KEY` was already in `.env`, but it was **not present**. Added
an empty `GEMINI_API_KEY=` placeholder. The user must paste a real key and restart
`npm run dev` (Next.js reads `.env` at boot) before live calls work.

## Verification performed

- `npx tsc --noEmit` — passes.
- `POST /api/nutrition/text` with no body → `400`; blank description → `400`.
- `POST /api/nutrition/text` with a valid description → `500` "GEMINI_API_KEY is not set"
  (proves the route runs through to the Gemini client; only the key is missing).
- `POST /api/nutrition/image` with no file → `400`; wrong MIME type → `400`; a valid PNG →
  `500` missing-key (proves multipart parsing + base64 encoding reach the model call).
- **Not yet verified:** a live, successful Gemini response — blocked solely by the absent
  API key. Once a key is set, the `curl` commands in `CLAUDE.md` exercise the happy path.

## Out of scope (future work)

UI wiring for both lookups, adding AI results to the daily log, caching/rate-limiting,
and streaming responses.

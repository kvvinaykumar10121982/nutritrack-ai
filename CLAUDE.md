# NutriTrack — Calorie & Macro Tracker

A polished, single-page calorie & macro tracker. Add foods three ways, organize them by
meal, and track progress toward a daily calorie goal with a live ring + macro bars. No
login — your log is saved to a local database on this machine so it survives refreshes and
restarts.

## What it does

**Three ways to add food** (each targets a meal you pick — Breakfast/Lunch/Dinner/Snack):

- **Quick add** — search a built-in catalog of 25 common foods; one-tap `+` to log.
- **Describe (AI)** — type a meal in plain English ("grilled chicken with rice and salad");
  Gemini estimates each food. Results are shown for **confirmation** before logging.
- **Photo (AI)** — upload or snap a meal photo; Gemini identifies the foods. Shows an
  **image preview** and lists **all detected items** with checkboxes to confirm.

**The dashboard:**

- **Daily goal ring** — calories consumed vs. an editable goal, colored green → amber → red
  as you approach/exceed it, with "kcal left".
- **Macro bars** — protein/carbs/fat consumed vs. targets (derived from the goal).
- **Meals** — entries grouped into Breakfast/Lunch/Dinner/Snack cards with per-meal subtotals.
- **Header** with app name + today's date.
- Card-style entries, empty/loading/error states, dark mode, responsive (mobile → desktop),
  reduced-motion support, and keyboard-accessible controls.

## How to run

```bash
npm install      # first time only
npm run dev      # start the dev server → http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`.
Requirements: Node 18+ (developed on Node 24, npm 11).

### Environment variables (`.env`)

```
GEMINI_API_KEY=your_key_here   # required for the AI nutrition lookup routes
```

Get a key at https://aistudio.google.com/apikey. After editing `.env`, **restart**
`npm run dev`. The core tracker works without a key; only the `/api/nutrition/*` routes need it.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** — styling (emerald accent; amber/rose reserved for goal status)
- **Storage** — Upstash Redis (Vercel KV) in production; **lowdb** JSON file
  (`data/foodlog.json`) as the automatic local-dev fallback (`lib/db.ts`)
- **@google/genai** — Gemini SDK; primary model `gemini-2.5-flash-lite`, with auto-retry on
  transient 503s and fallback to `gemini-2.5-flash` when overloaded (see `lib/gemini.ts`)

The daily **goal** is a client preference stored in `localStorage` (`nutritrack:calorie-goal`).

### Why a local JSON database (lowdb)?

The requirement was a "local database" that persists across refreshes. lowdb is pure-JS and
file-backed with zero native dependencies — it always installs/runs (unlike `better-sqlite3`,
which needs native compilation, fragile on new Node / Windows). See
`docs/2026-06-25-initial-build.md`.

## Folder structure

```
app/
  api/log/route.ts            # GET today, POST add (foodId|item + meal), DELETE clear day
  api/log/[entryId]/route.ts  # DELETE one entry
  api/nutrition/text/route.ts # POST: AI lookup from text
  api/nutrition/image/route.ts# POST: AI lookup from a photo
  layout.tsx · page.tsx · globals.css
components/
  CalorieTracker.tsx   # client container: log + goal state, API calls
  Header.tsx           # app name + today's date
  DailySummary.tsx     # goal ring + remaining + macro bars (hero)
  ProgressRing.tsx · MacroBars.tsx
  AddFood.tsx          # meal selector + Quick add / Describe / Photo
  MealSelector.tsx · FoodSearch.tsx · TextLookup.tsx · PhotoLookup.tsx
  NutritionReview.tsx  # confirm AI items before logging
  FoodLog.tsx          # entries grouped by meal, card style
  Spinner.tsx
lib/
  types.ts   # Food, LogEntry (+meal), MealCategory, Totals, MacroTargets, NutritionResult
  foods.ts   # static 25-food catalog
  meals.ts   # meal categories + mealForTime()
  db.ts      # lowdb init
  gemini.ts  # client, schema, analyzeNutrition() (retry + model fallback)
  utils.ts   # isSameDay, sumTotals, round1, macroTargets, calorieStatus, formatToday, …
data/foodlog.json  # the local database (gitignored, auto-created)
docs/              # decision logs
```

## Data model

```ts
type MealCategory = "breakfast" | "lunch" | "dinner" | "snack";
type Food     = { id; name; servingSize; calories; protein; carbs; fat };
type LogEntry = Food & { entryId; loggedAt; meal: MealCategory };
type DBData   = { log: LogEntry[] };
```

The catalog (`lib/foods.ts`) is a static constant; only the *log* is stored in the DB.
"Today" = entries whose `loggedAt` is on the current calendar day. Entries logged before
meal categories existed are shown under **Snack**.

## API

| Method | Path                    | Purpose                                                    |
| ------ | ----------------------- | --------------------------------------------------------- |
| GET    | `/api/log`              | Today's entries (newest first)                            |
| POST   | `/api/log`              | Add: `{ foodId }` or `{ item }`, plus optional `{ meal }` |
| DELETE | `/api/log`              | Clear today's entries                                     |
| DELETE | `/api/log/:entryId`     | Remove a single entry                                     |
| POST   | `/api/nutrition/text`   | AI lookup: `{ "description": "..." }` → `NutritionResult` |
| POST   | `/api/nutrition/image`  | AI lookup: multipart `image` file → `NutritionResult`     |

`NutritionResult = { items: NutritionItem[]; total: Totals; notes?: string }`.

Quick test (after setting `GEMINI_API_KEY` + restart):

```bash
curl -X POST http://localhost:3000/api/nutrition/text \
  -H "Content-Type: application/json" -d '{"description":"grilled chicken with rice"}'
```

## Next Steps

- **Deploy to Vercel** — swap lowdb for a hosted store (Postgres/KV) since Vercel's
  filesystem is ephemeral, then ship it.
- **Food history & charts** — multi-day history with calorie/macro trend charts.
- **User preferences** — server-stored goals, custom macro split, units, dietary targets.
- **Barcode scanning** — scan packaged foods (camera + a nutrition database lookup).
- Editable quantities/servings before logging; custom foods; favorites; CSV/JSON export.

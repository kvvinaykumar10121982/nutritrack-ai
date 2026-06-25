# NutriTrack — Project Plan

A local-first calorie & macro tracker with AI food lookup, built with Next.js 16, React 19,
TypeScript, Tailwind CSS 4, lowdb, and the Google Gemini API.

## What We Built

- **Core tracker** — a single-page app to log foods and track daily calories/macros, with a
  local JSON-file database (lowdb, `data/foodlog.json`) that persists across refreshes. No
  accounts or login.
- **Three ways to add food:**
  - **Quick add** from a 25-item catalog (one-tap `+`).
  - **Describe (AI)** — plain-English meal → Gemini estimates calories/macros.
  - **Photo (AI)** — meal photo → Gemini identifies foods, with image preview and a
    confirm-before-add review of all detected items.
- **AI backend** — `/api/nutrition/text` and `/api/nutrition/image` call Gemini
  (`gemini-2.5-flash-lite`) with structured JSON output, server-side input validation, and a
  shared `analyzeNutrition()` helper.
- **Dashboard** — editable daily calorie goal with a color-coded progress ring, macro
  progress bars, and entries grouped by meal (Breakfast/Lunch/Dinner/Snack) with subtotals.
- **Product polish** — branded header with date, card-style entries, dark mode, responsive
  layout, and empty/loading/error states.

## What We Improved

Driven by an iterative build → independent design-review → refine cycle (see
`docs/2026-06-25-ralph-polish.md`):

- **Reliability** — added retry-with-backoff and a model fallback
  (`gemini-2.5-flash-lite` → `gemini-2.5-flash`) so transient `503 overloaded` errors no
  longer surface as failures.
- **Mobile ergonomics** — visible meal labels, ~44px touch targets, iOS-zoom-safe inputs.
- **Accessibility** — WCAG-AA contrast (dropped low-contrast grays), consistent focus rings,
  `aria-label`ed landmarks, button-group semantics, `prefers-reduced-motion` support.
- **Visual restraint** — reserved emerald for primary actions and amber/rose for goal status;
  gave macros a distinct violet/teal/orange palette; quieted the quick-add buttons.
- **Usability details** — made "kcal left" the prominent figure, capped the default food list
  with a search hint, added a confirm step to the destructive "Clear day".
- **Data safety** — preserved pre-existing user entries (no `meal` field) via a safe fallback
  to "Snack".

## Future Roadmap

- **Deploy to Vercel** — replace lowdb with a hosted store (Postgres/KV), since Vercel's
  filesystem is ephemeral.
- **Food history & charts** — multi-day history with calorie/macro trend visualizations.
- **User preferences** — server-stored goals, custom macro splits, units, dietary targets.
- **Barcode scanning** — scan packaged foods via the camera + a nutrition database.
- **Nice-to-haves** — editable quantities/servings before logging, custom foods, favorites,
  CSV/JSON export, optional accounts for multi-device sync.

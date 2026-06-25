# Decision Log — Initial Build (2026-06-25)

Initial build of the Calorie Tracker web app, from an empty folder to a working,
documented application.

## Goal

A single-page calorie tracker: search common foods, add them to a daily log, see
total calories + macros at the top, with the log persisted in a local database across
page refreshes. No login, no accounts. Must run with `npm run dev` at `localhost:3000`.

## What was built

- A Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 project.
- A static catalog of **25 common foods** (`lib/foods.ts`), each with calories, protein,
  carbs, fat, and a serving size.
- A **local JSON-file database** (`lib/db.ts` using lowdb) storing the food log in
  `data/foodlog.json`.
- **API route handlers** (`app/api/log/...`):
  - `GET /api/log` — today's entries, newest first
  - `POST /api/log` — add a food by `foodId`
  - `DELETE /api/log` — clear today's entries
  - `DELETE /api/log/:entryId` — remove one entry
- **UI components**: `CalorieTracker` (state + fetch), `SummaryBar` (sticky totals),
  `FoodSearch` (search + quick-add), `FoodLog` (today's entries with remove / clear).
- **Docs**: `CLAUDE.md` (project overview) and this decision log.

## Technical decisions & rationale

### Persistence: lowdb (JSON file DB), not SQLite or localStorage
The brief said "local database … persists across page refreshes." Three options:

| Option            | Verdict                                                              |
| ----------------- | ------------------------------------------------------------------- |
| `better-sqlite3`  | A "real" SQL DB, but a **native module**. On Node 24 (new ABI) on Windows, prebuilt binaries may be missing → source compile needs MSVC build tools → high risk of broken `npm install`. ❌ |
| `localStorage`    | Trivial, but browser-only, wiped on cache clear — not really a "database". ❌ |
| **lowdb (JSON)**  | Pure-JS, zero native deps, file-backed at `data/foodlog.json`. Installs/runs reliably; genuinely persists to disk. ✅ **Chosen** |

This best honors "local database" while guaranteeing the app runs first try on this
machine. Trade-off: it's a single-process file store (fine for a local, single-user
app), not a concurrent multi-user DB. Swapping to SQLite/Postgres later only touches
`lib/db.ts` + the route handlers.

### Architecture: API routes + client container
The interactive UI is one client component (`CalorieTracker`) that calls Route Handlers
for all reads/writes. This keeps the DB strictly server-side (lowdb uses Node `fs`) and
gives a clean HTTP seam for a future real database or sync. Deletes/clear use optimistic
UI updates with rollback on failure for snappy feel.

### Food catalog as code, not data
The 25-food catalog lives in `lib/foods.ts` as a typed constant, not in the DB. It's
effectively read-only reference data, so version-controlling it is simpler and avoids
seeding logic. Only the *log* (user-generated) goes in the database. A logged entry
copies the food's macros at log time, so editing the catalog later won't retroactively
change past entries.

### "Today" semantics
Entries carry an ISO `loggedAt` timestamp; "today" is computed with a local-time
calendar-day comparison (`isSameDay` in `lib/utils.ts`). This keeps the door open for
multi-day history without a schema change.

### Scaffolding note
`create-next-app` rejects the folder name (`An AI powered_VNutritionAPP`) because npm
package names can't contain spaces/capitals. Worked around by scaffolding into a temp
`calorie-tracker/` subdir and moving the contents up to the project root.

## Verification performed

- `npx tsc --noEmit` — passes (no type errors).
- `npm run dev` — server ready at `localhost:3000`; homepage returns 200 and renders.
- `POST /api/log` (valid) → 201; (invalid foodId) → 400.
- `GET /api/log` → entries newest-first; written through to `data/foodlog.json`.
- `DELETE /api/log/:entryId` → 200; unknown id → 404.
- `DELETE /api/log` → clears the day; file shows `{ "log": [] }`.
- No errors in the dev server log.

## Out of scope (future work)

Multi-day history/charts, custom foods, editable quantities/servings, daily goals,
favorites, export, and accounts/multi-device sync.

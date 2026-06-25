# NutriTrack — Architecture

How the app is put together and how data flows. Diagrams are [Mermaid](https://mermaid.js.org/)
and render automatically on GitHub.

- **Live:** https://nutritrack-ai-three.vercel.app
- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Google Gemini

---

## 1. System overview

Two responsibilities split cleanly:

- **Logging** runs entirely in the **browser** (`localStorage`) — fast, offline-friendly,
  and works on Vercel's read-only filesystem with no database.
- **AI nutrition lookup** runs on the **server** (Next.js route handlers) so the Gemini
  API key stays secret, then returns structured JSON the UI confirms before logging.

```mermaid
flowchart LR
  subgraph B["User's Browser"]
    UI["React UI<br/>(NutriTrack client components)"]
    LS[("localStorage<br/>food log + daily goal")]
  end

  subgraph V["Vercel — Next.js app"]
    PAGE["Page + client bundle"]
    RT["Route: /api/nutrition/text"]
    RI["Route: /api/nutrition/image"]
    GEM["lib/gemini.ts<br/>JSON schema · retry · model fallback"]
    RL["Route: /api/log<br/>(wired, currently unused)"]
    DB["lib/db.ts<br/>Upstash Redis / lowdb<br/>(for future cross-device sync)"]
  end

  GEMINI["Google Gemini API<br/>gemini-2.5-flash-lite<br/>(+ flash fallback)"]

  UI -->|"load app"| PAGE
  UI <-->|"read / write log"| LS
  UI -->|"describe meal"| RT
  UI -->|"meal photo"| RI
  RT --> GEM
  RI --> GEM
  GEM -->|"HTTPS"| GEMINI
  RL -.->|"dormant path"| DB
```

> **Note:** The food log currently lives only in the browser. The server `/api/log`
> routes and `lib/db.ts` (Upstash Redis with a lowdb local fallback) are implemented and
> tested but **not used by the UI yet** — they're the upgrade path to cross-device sync.

---

## 2. The three ways to add food

```mermaid
flowchart TD
  A["Pick a meal<br/>(Breakfast / Lunch / Dinner / Snack)"] --> Q & T & P

  Q["Quick add<br/>(catalog)"] -->|"client only"| SAVE
  T["Describe (text)"] -->|"POST /api/nutrition/text"| AI
  P["Photo"] -->|"POST /api/nutrition/image"| AI

  AI["Gemini → structured items"] --> REVIEW["Review & confirm<br/>(NutritionReview)"]
  REVIEW --> SAVE[("Save to localStorage")]
  SAVE --> DASH["Dashboard updates<br/>ring + macros + meal groups"]
```

- **Quick add** never touches the server — the food is already in `lib/foods.ts`.
- **Describe / Photo** call Gemini, then the user confirms the detected items before they're
  written to the log (AI estimates can be wrong, so nothing is logged automatically).

---

## 3. Request flow — AI text lookup

```mermaid
sequenceDiagram
  actor U as User
  participant UI as React UI
  participant API as /api/nutrition/text
  participant G as lib/gemini.ts
  participant GM as Gemini API
  participant LS as localStorage

  U->>UI: type "grilled chicken with rice"
  UI->>API: POST { description }
  API->>G: analyzeNutrition(parts)
  G->>GM: generateContent (responseSchema = NutritionResult)
  Note over G,GM: retry on 503/429,<br/>fall back flash-lite → flash
  GM-->>G: { items, total, notes }
  G-->>API: validated result
  API-->>UI: 200 NutritionResult
  UI-->>U: show items to confirm
  U->>UI: select items + "Add to log"
  UI->>LS: persist entries
  UI-->>U: ring, macros & meal log update
```

The **photo** flow is identical except the UI sends `multipart/form-data` with an image,
which `lib/gemini.ts` forwards to Gemini as inline base64.

---

## 4. Component tree (client)

```mermaid
flowchart TB
  CT["CalorieTracker<br/>owns: entries, goal, errors"]
  CT --> H["Header<br/>brand + date"]
  CT --> DS["DailySummary"]
  DS --> PR["ProgressRing<br/>calorie goal (green/amber/red)"]
  DS --> MB["MacroBars<br/>protein / carbs / fat"]
  CT --> AF["AddFood<br/>meal selector + tabs"]
  AF --> MS["MealSelector"]
  AF --> FS["FoodSearch (quick add)"]
  AF --> TL["TextLookup"]
  AF --> PL["PhotoLookup"]
  TL --> NR["NutritionReview"]
  PL --> NR["NutritionReview"]
  CT --> FL["FoodLog<br/>entries grouped by meal"]
```

`CalorieTracker` is the single source of truth for state; everything below it is
presentational and talks back through callbacks (`onAddFood`, `onAddItem`, `onRemove`, …).

---

## 5. Data model

```ts
type MealCategory = "breakfast" | "lunch" | "dinner" | "snack";
type Food     = { id; name; servingSize; calories; protein; carbs; fat };
type LogEntry = Food & { entryId; loggedAt; meal };   // one logged food
// AI lookups return:
type NutritionResult = { items: NutritionItem[]; total: Totals; notes?: string };
```

- The food **catalog** (`lib/foods.ts`) is static code — only the **log** is stored.
- "Today" = entries whose `loggedAt` is on the current calendar day.

---

## 6. Deploy pipeline

```mermaid
flowchart LR
  DEV["Local dev<br/>npm run dev<br/>(lowdb file fallback)"] -->|"git push"| GH["GitHub<br/>nutritrack-ai"]
  GH -->|"auto-deploy on push"| VC["Vercel<br/>next build"]
  VC --> PROD["Live site<br/>nutritrack-ai-three.vercel.app"]
  ENV["Vercel env:<br/>GEMINI_API_KEY"] -.-> VC
```

- Push to `master` → Vercel builds and deploys automatically (repo is connected).
- `GEMINI_API_KEY` is set in Vercel project env (never committed; see `.env.example`).
- `.vercelignore` keeps local-only files (`data/`, `dev.log`, `docs/`) out of deploys.

---

## 7. Future: cross-device sync (already wired)

To move the log from the browser to a shared server store:

1. Vercel dashboard → **Storage → connect Upstash Redis** (injects `UPSTASH_REDIS_REST_URL`
   / `_TOKEN`).
2. Point `CalorieTracker` back to the `/api/log` routes (instead of `lib/localLog.ts`).
3. Redeploy. `lib/db.ts` already picks Redis when those env vars exist, lowdb otherwise.

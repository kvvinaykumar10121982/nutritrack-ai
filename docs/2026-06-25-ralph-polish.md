# Decision Log — Polish Pass: Features + Design Review (2026-06-25)

Goal: take the working calorie tracker from "competent prototype" to "looks like a real
product built by a professional team," and add the requested dashboard features.

## A note on tooling (Ralph Loop / frontend-design skill)

The brief assumed the `ralph-loop` plugin and a `frontend-design` skill were installed and
should drive this. In practice:

- The **`frontend-design` skill does not exist** in `vercel-labs/agent-skills` (that install
  failed; the repo ships `web-design-guidelines`, `vercel-react-best-practices`, etc.).
- The **`ralph-loop` plugin** drives the `claude` CLI and can't be invoked as an in-session
  tool without recursively launching the CLI.

Rather than block, I ran the **equivalent loop directly**: Build → independent design review
→ refine, iterated to a high bar. The "design skill verification" step was performed by an
independent senior-product-designer **review agent** that audited every component against the
quality bar and returned a prioritized findings list. This is faithful to the intent (an
iterative critique-and-improve cycle) without pretending to use tools that weren't available.

## Round 1 — Features + redesign

Added the requested product features and rebuilt the UI:

- **Daily calorie goal** with an editable target (stored in `localStorage`) and a **circular
  progress ring** that turns green → amber → red as you approach/exceed the goal, plus
  "kcal left". (`DailySummary.tsx`, `ProgressRing.tsx`, `calorieStatus()`.)
- **Macro breakdown** — protein/carbs/fat bars vs. targets derived from the goal
  (`MacroBars.tsx`, `macroTargets()`).
- **Meal categories** — `LogEntry.meal` added; entries grouped into Breakfast/Lunch/Dinner/
  Snack cards with subtotals (`FoodLog.tsx`, `lib/meals.ts`); a `MealSelector` chooses the
  target meal; `POST /api/log` accepts/validates `meal` and defaults by time of day.
- **Header** with app name (**NutriTrack**) + today's date (`Header.tsx`).
- **Card-style entries**, neutral-50 background, refined spacing/typography, Geist font.

## Round 2 — Independent design review (the "verify" step)

The review agent flagged ~15 issues. Highest-impact:

- **HIGH:** meal selector hid its labels on mobile (4 bare emoji); touch targets < 40px;
  `text-neutral-400` data text failed WCAG AA contrast; a "sea of solid-green Add buttons"
  diluted the accent color.
- **MEDIUM:** "remaining" (the actionable number) was too small; incomplete tab ARIA; macro
  colors collided with the amber/rose goal-status colors; inconsistent focus styles;
  destructive "Clear day" had no confirmation; mismatched card padding.
- **LOW:** redundant "Today" chip; 14px goal input (iOS zoom); no `prefers-reduced-motion`;
  nested scroll in the quick-add list; unlabeled `<section>` landmarks.

## Round 3 — Refinements (acted on the review)

- Meal selector: icon-over-label, always visible, `min-h-12` touch targets.
- Bumped all interactive controls to ~44px; checkbox rows wrapped in `<label>` (size-5).
- Contrast: data text `neutral-400` → `neutral-500` throughout.
- Quick-add: quiet outline `+` buttons (one primary CTA per view); capped the default list to
  8 with a "search to find more" hint (removed nested scroll).
- Macros recolored violet/teal/orange so amber/rose mean **only** calorie status.
- Made "kcal left" the prominent figure; standardized card padding; matched focus rings;
  added a Clear-day confirm step; removed the redundant header chip; fixed iOS-zoom input;
  added a global `prefers-reduced-motion` guard and `aria-label`s on landmark sections.
- Replaced incomplete `role="tab"` semantics with an accessible button group.

## Verification

- `npx tsc --noEmit`, `npm run lint`, and **`npm run build`** all pass.
- Dev server serves 200; UI renders (NutriTrack header, goal ring, meal groups, three add
  modes); meal-tagged adds persist with the `meal` field; AI text/photo routes still work.
- **User data preserved:** 10 pre-existing entries (logged before meal categories) were kept
  and render correctly under "Snack" via a safe `e.meal ?? "snack"` fallback. Only two of my
  own smoke-test entries were removed.

## Result

A responsive, accessible, professional-looking tracker with a clear hero (goal ring),
organized meals, and the small details (empty/loading/error/confirm states, dark mode,
reduced motion). See `PLAN.md` for the build/improve/roadmap summary.

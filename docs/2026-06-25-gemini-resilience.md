# Decision Log — Gemini Resilience: Retry + Model Fallback (2026-06-25)

## Problem

AI nutrition lookups (text and photo) intermittently failed with a user-facing
"Couldn't look that up: Failed to analyze nutrition." Server logs showed the cause was an
upstream Gemini error, repeated on every attempt:

```
[nutrition/text] Gemini error: ApiError 503 "This model is currently experiencing high
demand ... UNAVAILABLE"
```

So `gemini-2.5-flash-lite` was persistently overloaded server-side — not a bug in the input
or our code. A simple in-place retry (added first) didn't help because the model stayed
unavailable across all attempts (~17s, 4 tries, all 503).

## Investigation

Probed the key against several models directly:

| Model                     | Result                         |
| ------------------------- | ------------------------------ |
| `gemini-2.5-flash-lite`   | 503 overloaded (primary, down) |
| `gemini-2.5-flash`        | **OK**                         |
| `gemini-2.0-flash`        | 429 quota exceeded             |
| `gemini-2.0-flash-lite`   | 429 quota exceeded             |

`gemini-2.5-flash` was healthy, making it a viable fallback.

## Fix (`lib/gemini.ts`)

`analyzeNutrition()` now:

1. **Retries transient errors** with exponential backoff. `isTransient()` matches HTTP
   503/429/500 and messages like `UNAVAILABLE` / `overloaded` / `high demand` /
   `RESOURCE_EXHAUSTED`.
2. **Falls back across a model chain** — `MODEL_CHAIN = [gemini-2.5-flash-lite,
   gemini-2.5-flash]`. Each model gets up to 3 attempts; if it stays transiently
   unavailable, we move to the next model. **Non-transient** errors (bad key, bad request)
   throw immediately — no pointless retries.

### Why keep flash-lite as primary
The project spec calls for `gemini-2.5-flash-lite` (cheapest/fastest). We preserve it as the
default and only fall back when it's transiently down, so normal operation is unchanged and
the app degrades gracefully during provider spikes instead of erroring.

### Why not just switch to flash
That would silently abandon the chosen model and cost more on every call. Fallback-on-failure
keeps intent + cost while restoring reliability.

## Verification

- `npx tsc --noEmit` and `npm run lint` — both clean.
- `POST /api/nutrition/text {"description":"ate 1 banana"}` → **200**:
  `{ items:[{ Banana, "1 medium (118 g)", 105 kcal, P1.3 C27 F0.3 }], total:{…} }`
  (served via the `gemini-2.5-flash` fallback while flash-lite was overloaded).
- The image route uses the same helper, so it inherits the retry + fallback automatically.

## Notes / future work

- When flash-lite recovers, calls use it again automatically (it's tried first every time).
- Could add brief in-memory caching of identical lookups and surface which model answered.

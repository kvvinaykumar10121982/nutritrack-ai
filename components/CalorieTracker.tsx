"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Food, LogEntry, MealCategory, NutritionItem } from "@/lib/types";
import { DEFAULT_CALORIE_GOAL, sumTotals } from "@/lib/utils";
import Header from "./Header";
import DailySummary from "./DailySummary";
import AddFood from "./AddFood";
import FoodLog from "./FoodLog";

const GOAL_KEY = "nutritrack:calorie-goal";

/** Top-level interactive widget: owns the log + goal and talks to the API. */
export default function CalorieTracker() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [goal, setGoal] = useState(DEFAULT_CALORIE_GOAL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Load today's log + the saved goal on mount.
  useEffect(() => {
    (async () => {
      const saved = Number(localStorage.getItem(GOAL_KEY));
      if (Number.isFinite(saved) && saved > 0) setGoal(saved);
      try {
        const res = await fetch("/api/log", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load log");
        const data = (await res.json()) as { log: LogEntry[] };
        setEntries(data.log);
      } catch {
        setError("Could not load your food log.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateGoal = useCallback((next: number) => {
    setGoal(next);
    localStorage.setItem(GOAL_KEY, String(next));
  }, []);

  const totals = useMemo(() => sumTotals(entries), [entries]);

  const addFood = useCallback(async (food: Food, meal: MealCategory) => {
    setPendingId(food.id);
    setError(null);
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodId: food.id, meal }),
      });
      if (!res.ok) throw new Error("Failed to add");
      const data = (await res.json()) as { entry: LogEntry };
      setEntries((prev) => [data.entry, ...prev]);
    } catch {
      setError("Could not add that food. Try again.");
    } finally {
      setPendingId(null);
    }
  }, []);

  // Add an AI-found item. Returns success so the review UI can show per-item state.
  const addItem = useCallback(
    async (item: NutritionItem, meal: MealCategory): Promise<boolean> => {
      setError(null);
      try {
        const res = await fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item, meal }),
        });
        if (!res.ok) throw new Error("Failed to add");
        const data = (await res.json()) as { entry: LogEntry };
        setEntries((prev) => [data.entry, ...prev]);
        return true;
      } catch {
        setError("Could not add that item. Try again.");
        return false;
      }
    },
    []
  );

  const removeEntry = useCallback(
    async (entryId: string) => {
      const prev = entries;
      setEntries((cur) => cur.filter((e) => e.entryId !== entryId)); // optimistic
      try {
        const res = await fetch(`/api/log/${entryId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to remove");
      } catch {
        setEntries(prev); // rollback
        setError("Could not remove that entry.");
      }
    },
    [entries]
  );

  const clearDay = useCallback(async () => {
    const prev = entries;
    setEntries([]); // optimistic
    try {
      const res = await fetch("/api/log", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to clear");
    } catch {
      setEntries(prev);
      setError("Could not clear the day.");
    }
  }, [entries]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <Header />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-5">
        {error && (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-brand-red/30 bg-brand-red/10 px-4 py-2.5 text-sm font-medium text-brand-red"
          >
            <span aria-hidden>⚠️</span>
            {error}
          </p>
        )}

        <DailySummary totals={totals} goal={goal} onGoalChange={updateGoal} />

        <AddFood onAddFood={addFood} onAddItem={addItem} pendingId={pendingId} />

        {loading ? (
          <div className="flex flex-col gap-2">
            <div className="h-16 animate-pulse rounded-xl bg-black/[0.04] dark:bg-white/5" />
            <div className="h-16 animate-pulse rounded-xl bg-black/[0.04] dark:bg-white/5" />
          </div>
        ) : (
          <FoodLog entries={entries} onRemove={removeEntry} onClearDay={clearDay} />
        )}
      </main>

      <footer className="mx-auto w-full max-w-2xl px-4 pb-6 pt-2 text-center text-xs text-neutral-500">
        Stored locally on this device · macros are estimates
      </footer>
    </div>
  );
}

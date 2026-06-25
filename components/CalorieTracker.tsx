"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Food, LogEntry, MealCategory, NutritionItem } from "@/lib/types";
import { DEFAULT_CALORIE_GOAL, sumTotals } from "@/lib/utils";
import {
  addFoodEntry,
  addItemEntry,
  clearToday,
  loadToday,
  removeEntry as removeLocalEntry,
} from "@/lib/localLog";
import Header from "./Header";
import DailySummary from "./DailySummary";
import AddFood from "./AddFood";
import FoodLog from "./FoodLog";

const GOAL_KEY = "nutritrack:calorie-goal";

/**
 * Top-level interactive widget. The food log is stored in the browser
 * (localStorage) so it persists across refreshes and works on Vercel without a
 * writable server filesystem. AI lookups still call the server routes.
 */
export default function CalorieTracker() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [goal, setGoal] = useState(DEFAULT_CALORIE_GOAL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load today's log + the saved goal on mount (client-only).
  useEffect(() => {
    (async () => {
      try {
        const saved = Number(localStorage.getItem(GOAL_KEY));
        if (Number.isFinite(saved) && saved > 0) setGoal(saved);
        setEntries(loadToday());
      } catch {
        setError("Storage is unavailable in this browser, so your log can't be saved.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateGoal = useCallback((next: number) => {
    setGoal(next);
    try {
      localStorage.setItem(GOAL_KEY, String(next));
    } catch {
      /* ignore */
    }
  }, []);

  const totals = useMemo(() => sumTotals(entries), [entries]);

  const addFood = useCallback((food: Food, meal: MealCategory) => {
    setError(null);
    try {
      const entry = addFoodEntry(food, meal);
      setEntries((prev) => [entry, ...prev]);
    } catch {
      setError("Could not add that food. Try again.");
    }
  }, []);

  const addItem = useCallback(
    async (item: NutritionItem, meal: MealCategory): Promise<boolean> => {
      setError(null);
      try {
        const entry = addItemEntry(item, meal);
        setEntries((prev) => [entry, ...prev]);
        return true;
      } catch {
        setError("Could not add that item. Try again.");
        return false;
      }
    },
    []
  );

  const removeEntry = useCallback((entryId: string) => {
    setEntries((cur) => cur.filter((e) => e.entryId !== entryId));
    try {
      removeLocalEntry(entryId);
    } catch {
      setError("Could not remove that entry.");
    }
  }, []);

  const clearDay = useCallback(() => {
    setEntries([]);
    try {
      clearToday();
    } catch {
      setError("Could not clear the day.");
    }
  }, []);

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

        <AddFood onAddFood={addFood} onAddItem={addItem} pendingId={null} />

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
        Saved in your browser · macros are estimates
      </footer>
    </div>
  );
}

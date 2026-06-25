"use client";

import { useState } from "react";
import type { LogEntry, MealCategory } from "@/lib/types";
import { MEALS } from "@/lib/meals";
import { formatNumber, round1, sumTotals } from "@/lib/utils";

type Props = {
  entries: LogEntry[];
  onRemove: (entryId: string) => void;
  onClearDay: () => void;
};

/** Today's log, grouped into meal sections with card-style entries. */
export default function FoodLog({ entries, onRemove, onClearDay }: Props) {
  const [confirmClear, setConfirmClear] = useState(false);

  const byMeal = (meal: MealCategory) =>
    entries.filter((e) => (e.meal ?? "snack") === meal);

  return (
    <section className="flex flex-col gap-4" aria-label="Food log">
      <div className="flex min-h-9 items-center justify-between px-1">
        <h2 className="text-lg font-bold tracking-tight">
          Today&apos;s meals{" "}
          <span className="text-sm font-normal text-neutral-500">
            · {formatNumber(sumTotals(entries).calories)} kcal
          </span>
        </h2>
        {entries.length > 0 &&
          (confirmClear ? (
            <span className="flex items-center gap-1 text-sm">
              <span className="text-neutral-500">Clear all?</span>
              <button
                type="button"
                onClick={() => {
                  onClearDay();
                  setConfirmClear(false);
                }}
                className="rounded-md px-2 py-1 font-semibold text-brand-red hover:bg-brand-red/10"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="rounded-md px-2 py-1 font-medium text-neutral-500 hover:bg-black/[0.04] dark:hover:bg-white/5"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="rounded-md px-2.5 py-1.5 text-sm font-medium text-neutral-500 transition hover:bg-brand-red/10 hover:text-brand-red"
            >
              Clear day
            </button>
          ))}
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-black/10 bg-white/50 px-6 py-14 text-center dark:border-white/10 dark:bg-neutral-900/40">
          <span className="text-3xl" aria-hidden>
            🍽️
          </span>
          <p className="font-medium">No meals logged yet</p>
          <p className="max-w-xs text-sm text-neutral-500">
            Pick a meal above, then quick-add a food, describe it, or snap a photo.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {MEALS.map((m) => {
            const items = byMeal(m.id);
            if (items.length === 0) return null;
            const mealCals = sumTotals(items).calories;
            return (
              <div key={m.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-brand-navy dark:text-brand-sky">
                    <span aria-hidden>{m.icon}</span>
                    {m.label}
                  </h3>
                  <span className="text-xs font-medium tabular-nums text-neutral-500">
                    {formatNumber(mealCals)} kcal
                  </span>
                </div>

                <ul className="flex flex-col gap-2">
                  {items.map((e) => (
                    <li
                      key={e.entryId}
                      className="group flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3.5 shadow-sm transition hover:border-black/10 dark:border-white/10 dark:bg-neutral-900 dark:hover:border-white/20"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{e.name}</p>
                        <p className="truncate text-xs text-neutral-500">
                          {e.servingSize} · P {round1(e.protein)} · C {round1(e.carbs)} · F{" "}
                          {round1(e.fat)}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatNumber(e.calories)}
                        <span className="ml-0.5 text-xs font-normal text-neutral-500">
                          kcal
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemove(e.entryId)}
                        aria-label={`Remove ${e.name}`}
                        className="shrink-0 rounded-md p-2.5 text-neutral-400 transition hover:bg-brand-red/10 hover:text-brand-red focus:opacity-100 dark:hover:bg-brand-red/15 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path
                            d="M18 6 6 18M6 6l12 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

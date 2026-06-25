"use client";

import { useMemo, useState } from "react";
import { FOODS } from "@/lib/foods";
import type { Food } from "@/lib/types";

type Props = {
  onAdd: (food: Food) => void;
  pendingId: string | null;
};

const DEFAULT_VISIBLE = 8;

/** Search bar + quick-add list of common foods. */
export default function FoodSearch({ onAdd, pendingId }: Props) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FOODS;
    return FOODS.filter((f) => f.name.toLowerCase().includes(q));
  }, [query]);

  // Without a query, show a short list rather than the whole catalog.
  const results = query.trim() ? matches : matches.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = matches.length - results.length;

  return (
    <section className="flex flex-col gap-3" aria-label="Quick add from catalog">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search foods (e.g. chicken, rice, banana)…"
        className="w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-base outline-none focus:border-brand-sky dark:border-white/15 dark:bg-neutral-900"
        aria-label="Search foods"
      />

      {matches.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-neutral-500">
          No foods match “{query}”.
        </p>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {results.map((food) => (
              <li
                key={food.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-black/5 bg-neutral-50 p-3 dark:border-white/10 dark:bg-neutral-800/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{food.name}</p>
                  <p className="text-xs text-neutral-500">
                    {food.calories} kcal · {food.servingSize}
                  </p>
                  <p className="text-xs text-neutral-500">
                    P {food.protein} · C {food.carbs} · F {food.fat}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAdd(food)}
                  disabled={pendingId === food.id}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-brand-sky/50 bg-brand-sky/10 text-lg font-bold text-brand-navy transition hover:bg-brand-sky/20 disabled:opacity-50 dark:border-brand-sky/30 dark:bg-brand-sky/10 dark:text-brand-sky dark:hover:bg-brand-sky/20"
                  aria-label={`Add ${food.name} to log`}
                >
                  {pendingId === food.id ? (
                    <span className="text-xs">…</span>
                  ) : (
                    <span aria-hidden>+</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {hiddenCount > 0 && (
            <p className="px-1 text-center text-xs text-neutral-500">
              Showing {DEFAULT_VISIBLE} of {matches.length} — search to find more.
            </p>
          )}
        </>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";
import type { NutritionItem, NutritionResult } from "@/lib/types";
import { round1 } from "@/lib/utils";
import Spinner from "./Spinner";

type Props = {
  result: NutritionResult;
  onAdd: (item: NutritionItem) => Promise<boolean>;
  onDismiss: () => void;
};

/**
 * Shows AI-detected food items so the user can confirm before logging. Each item
 * has a checkbox (checked by default); "Add to log" logs the selected ones.
 */
export default function NutritionReview({ result, onAdd, onDismiss }: Props) {
  const { items, notes } = result;
  const [selected, setSelected] = useState<boolean[]>(() => items.map(() => true));
  const [added, setAdded] = useState<boolean[]>(() => items.map(() => false));
  const [adding, setAdding] = useState(false);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
        <p>No foods were identified.{notes ? ` ${notes}` : ""}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 text-amber-900 underline underline-offset-2 dark:text-amber-100"
        >
          Dismiss
        </button>
      </div>
    );
  }

  const toggle = (i: number) =>
    setSelected((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  const selectedCount = selected.filter((v, i) => v && !added[i]).length;

  const addSelected = async () => {
    setAdding(true);
    const nextAdded = [...added];
    for (let i = 0; i < items.length; i++) {
      if (!selected[i] || added[i]) continue;
      const ok = await onAdd(items[i]);
      if (ok) nextAdded[i] = true;
    }
    setAdded(nextAdded);
    setAdding(false);
  };

  const allAdded = items.every((_, i) => added[i] || !selected[i]) && added.some(Boolean);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-black/10 bg-neutral-50 p-4 dark:border-white/10 dark:bg-neutral-900/50">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Found {items.length} item{items.length > 1 ? "s" : ""} — confirm to add
        </h3>
        <button
          type="button"
          onClick={onDismiss}
          className="text-sm text-neutral-500 underline-offset-2 hover:underline"
        >
          Clear
        </button>
      </div>

      {notes && <p className="text-xs text-neutral-500">{notes}</p>}

      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li
            key={`${item.name}-${i}`}
            className="flex items-center gap-3 rounded-md border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-neutral-900"
          >
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={selected[i]}
                disabled={added[i] || adding}
                onChange={() => toggle(i)}
                className="size-5 shrink-0 accent-[#4FC3F7]"
                aria-label={`Select ${item.name}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.name}</p>
                <p className="text-xs text-neutral-500">
                  {Math.round(item.calories)} kcal · {item.servingSize} · P{" "}
                  {round1(item.protein)} · C {round1(item.carbs)} · F {round1(item.fat)}
                </p>
              </div>
            </label>
            {added[i] && (
              <span className="shrink-0 text-sm font-semibold text-brand-navy dark:text-brand-sky">
                Added ✓
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addSelected}
          disabled={adding || selectedCount === 0}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c62828] disabled:opacity-50"
        >
          {adding && <Spinner />}
          {allAdded
            ? "Added"
            : selectedCount > 0
              ? `Add ${selectedCount} to log`
              : "Nothing selected"}
        </button>
        {allAdded && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-sm text-neutral-500 hover:underline"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

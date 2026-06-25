"use client";

import type { MealCategory } from "@/lib/types";
import { MEALS } from "@/lib/meals";

/** Segmented control to pick which meal new foods are added to. */
export default function MealSelector({
  value,
  onChange,
}: {
  value: MealCategory;
  onChange: (meal: MealCategory) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-neutral-500">Add to meal</span>
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800/60">
        {MEALS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            aria-pressed={value === m.id}
            className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium leading-none transition ${
              value === m.id
                ? "bg-white text-brand-navy shadow-sm dark:bg-neutral-700 dark:text-brand-sky"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            }`}
          >
            <span aria-hidden className="text-base">
              {m.icon}
            </span>
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

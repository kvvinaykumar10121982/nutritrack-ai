"use client";

import { useState } from "react";
import type { Totals } from "@/lib/types";
import { calorieStatus, formatNumber, macroTargets } from "@/lib/utils";
import ProgressRing from "./ProgressRing";
import MacroBars from "./MacroBars";

const STATUS = {
  good: { ring: "text-brand-sky", chip: "text-brand-navy dark:text-brand-sky" },
  warn: { ring: "text-amber-500", chip: "text-amber-600 dark:text-amber-400" },
  over: { ring: "text-brand-red", chip: "text-brand-red" },
} as const;

type Props = {
  totals: Totals;
  goal: number;
  onGoalChange: (goal: number) => void;
};

/** Hero card: calorie goal ring + remaining + macro progress. */
export default function DailySummary({ totals, goal, onGoalChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goal));

  const consumed = Math.round(totals.calories);
  const ratio = goal > 0 ? consumed / goal : 0;
  const status = calorieStatus(ratio);
  const remaining = goal - consumed;
  const colors = STATUS[status];

  const saveGoal = () => {
    const n = Math.round(Number(draft));
    if (Number.isFinite(n) && n >= 500 && n <= 10000) onGoalChange(n);
    else setDraft(String(goal));
    setEditing(false);
  };

  return (
    <section
      aria-label="Daily summary"
      className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6"
    >
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        <ProgressRing ratio={ratio} colorClass={colors.ring}>
          <span className="text-4xl font-extrabold tabular-nums tracking-tight text-brand-navy dark:text-white">
            {formatNumber(consumed)}
          </span>
          <span className="text-xs text-neutral-500">of {formatNumber(goal)} kcal</span>
        </ProgressRing>

        <div className="flex w-full flex-1 flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-lg font-bold tracking-tight ${colors.chip}`}>
                {remaining >= 0
                  ? `${formatNumber(remaining)} kcal left`
                  : `${formatNumber(-remaining)} kcal over`}
              </p>
              <p className="text-xs text-neutral-500">Daily goal</p>
            </div>

            {editing ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={draft}
                  autoFocus
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveGoal();
                    if (e.key === "Escape") {
                      setDraft(String(goal));
                      setEditing(false);
                    }
                  }}
                  className="w-20 rounded-md border border-black/15 bg-white px-2 py-1.5 text-base tabular-nums outline-none focus:border-brand-sky dark:border-white/15 dark:bg-neutral-800"
                />
                <button
                  type="button"
                  onClick={saveGoal}
                  className="rounded-md bg-brand-red px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#c62828]"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDraft(String(goal));
                  setEditing(true);
                }}
                className="rounded-md px-2.5 py-1.5 text-sm font-medium text-neutral-500 transition hover:bg-black/[0.04] hover:text-neutral-900 dark:hover:bg-white/5 dark:hover:text-neutral-100"
              >
                Edit goal
              </button>
            )}
          </div>

          <MacroBars totals={totals} targets={macroTargets(goal)} />
        </div>
      </div>
    </section>
  );
}

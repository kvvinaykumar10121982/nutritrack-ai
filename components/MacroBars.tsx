import type { MacroTargets, Totals } from "@/lib/types";
import { formatNumber, round1 } from "@/lib/utils";

// Non-semantic palette so macros don't collide with the calorie status colors
// (amber/rose), which are reserved for "approaching"/"over" the goal.
const MACROS = [
  { key: "protein", label: "Protein", bar: "bg-violet-500", text: "text-violet-600 dark:text-violet-400" },
  { key: "carbs", label: "Carbs", bar: "bg-teal-500", text: "text-teal-600 dark:text-teal-400" },
  { key: "fat", label: "Fat", bar: "bg-orange-500", text: "text-orange-600 dark:text-orange-400" },
] as const;

/** Three macro progress bars (consumed vs. target grams). */
export default function MacroBars({
  totals,
  targets,
}: {
  totals: Totals;
  targets: MacroTargets;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {MACROS.map((m) => {
        const value = totals[m.key];
        const target = targets[m.key];
        const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
        return (
          <div key={m.key} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                {m.label}
              </span>
              <span className={`text-xs font-semibold tabular-nums ${m.text}`}>
                {round1(value)}g
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
              <div
                className={`h-full rounded-full ${m.bar} transition-[width] duration-500 ease-out`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] text-neutral-500">
              of {formatNumber(target)}g
            </span>
          </div>
        );
      })}
    </div>
  );
}

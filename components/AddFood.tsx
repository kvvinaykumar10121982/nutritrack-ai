"use client";

import { useState } from "react";
import type { Food, MealCategory, NutritionItem } from "@/lib/types";
import { mealForTime } from "@/lib/meals";
import FoodSearch from "./FoodSearch";
import TextLookup from "./TextLookup";
import PhotoLookup from "./PhotoLookup";
import MealSelector from "./MealSelector";

type Tab = "quick" | "text" | "photo";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "quick", label: "Quick add", icon: "⚡" },
  { id: "text", label: "Describe", icon: "✏️" },
  { id: "photo", label: "Photo", icon: "📷" },
];

type Props = {
  onAddFood: (food: Food, meal: MealCategory) => void;
  onAddItem: (item: NutritionItem, meal: MealCategory) => Promise<boolean>;
  pendingId: string | null;
};

/** Three ways to add food (quick-add, AI text, AI photo), targeting a meal. */
export default function AddFood({ onAddFood, onAddItem, pendingId }: Props) {
  const [tab, setTab] = useState<Tab>("quick");
  const [meal, setMeal] = useState<MealCategory>(() => mealForTime());

  return (
    <section
      aria-label="Add food"
      className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6"
    >
      <MealSelector value={meal} onChange={setMeal} />

      <div
        role="group"
        aria-label="Ways to add food"
        className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800/60"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-white text-brand-navy shadow-sm dark:bg-neutral-700 dark:text-brand-sky"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            }`}
          >
            <span aria-hidden>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "quick" && (
        <FoodSearch onAdd={(food) => onAddFood(food, meal)} pendingId={pendingId} />
      )}
      {tab === "text" && <TextLookup onAdd={(item) => onAddItem(item, meal)} />}
      {tab === "photo" && <PhotoLookup onAdd={(item) => onAddItem(item, meal)} />}
    </section>
  );
}

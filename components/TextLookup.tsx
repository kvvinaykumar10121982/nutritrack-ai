"use client";

import { useState } from "react";
import type { NutritionItem, NutritionResult } from "@/lib/types";
import Spinner from "./Spinner";
import NutritionReview from "./NutritionReview";

/** Describe a meal in plain English; Gemini estimates the nutrition. */
export default function TextLookup({
  onAdd,
}: {
  onAdd: (item: NutritionItem) => Promise<boolean>;
}) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NutritionResult | null>(null);

  const lookup = async () => {
    const text = description.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/nutrition/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Lookup failed");
      setResult(data as NutritionResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Couldn't look that up: ${err.message}`
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <label htmlFor="meal-desc" className="text-sm text-neutral-600 dark:text-neutral-300">
        Describe what you ate and AI will estimate the nutrition.
      </label>
      <textarea
        id="meal-desc"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="e.g. grilled chicken with rice and a side salad"
        rows={3}
        className="w-full resize-y rounded-lg border border-black/15 bg-white px-4 py-3 text-base outline-none focus:border-brand-sky dark:border-white/15 dark:bg-neutral-900"
      />
      <button
        type="button"
        onClick={lookup}
        disabled={loading || !description.trim()}
        className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c62828] disabled:opacity-50"
      >
        {loading && <Spinner />}
        {loading ? "Analyzing…" : "Look up nutrition"}
      </button>

      {error && (
        <p className="rounded-md border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-sm font-medium text-brand-red">
          {error}
        </p>
      )}

      {result && (
        <NutritionReview result={result} onAdd={onAdd} onDismiss={() => setResult(null)} />
      )}
    </section>
  );
}

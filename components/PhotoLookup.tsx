"use client";

import { useEffect, useRef, useState } from "react";
import type { NutritionItem, NutritionResult } from "@/lib/types";
import Spinner from "./Spinner";
import NutritionReview from "./NutritionReview";

/** Upload or take a meal photo; Gemini identifies the foods and estimates calories. */
export default function PhotoLookup({
  onAdd,
}: {
  onAdd: (item: NutritionItem) => Promise<boolean>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NutritionResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);

  // Revoke the current object URL, if any.
  const revoke = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  // Clean up the last object URL on unmount.
  useEffect(() => revoke, []);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    revoke();
    setError(null);
    setResult(null);
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      urlRef.current = url;
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const reset = () => {
    revoke();
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const analyze = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/nutrition/image", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Analysis failed");
      setResult(data as NutritionResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Couldn't analyze the photo: ${err.message}`
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Take or upload a photo of your meal and AI will identify the foods.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-medium transition hover:border-brand-sky dark:border-white/15 dark:bg-neutral-900">
          {file ? "Choose a different photo" : "Choose / take photo"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={pickFile}
            className="hidden"
          />
        </label>
        {file && (
          <button
            type="button"
            onClick={reset}
            className="text-sm text-neutral-500 hover:underline"
          >
            Remove
          </button>
        )}
      </div>

      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Meal preview"
          className="max-h-64 w-full rounded-lg border border-black/10 object-contain dark:border-white/10"
        />
      )}

      {file && (
        <button
          type="button"
          onClick={analyze}
          disabled={loading}
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c62828] disabled:opacity-50"
        >
          {loading && <Spinner />}
          {loading ? "Analyzing photo…" : "Analyze photo"}
        </button>
      )}

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

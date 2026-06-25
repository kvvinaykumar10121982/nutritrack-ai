"use client";

import { useSyncExternalStore } from "react";
import { formatToday } from "@/lib/utils";

const noop = () => () => {};

/** Sticky app header: brand mark, name, and today's date. */
export default function Header() {
  // Read the date from the browser (client) so it uses the viewer's local
  // timezone; the server renders an empty string to avoid a hydration mismatch.
  const today = useSyncExternalStore(
    noop,
    () => formatToday(),
    () => ""
  );

  return (
    <header className="sticky top-0 z-20 bg-brand-navy shadow-sm">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex size-9 items-center justify-center rounded-xl bg-brand-sky text-brand-navy shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 3c2.5 3 6 4.5 6 9a6 6 0 1 1-12 0c0-2 1-3.5 2-4.5C8.5 9.5 10 9 10 7c1.2.6 2 1.6 2 3 .8-.7 1.2-1.7 0-7z"
                fill="currentColor"
              />
            </svg>
          </span>
          <div className="leading-tight">
            <h1 className="text-base font-extrabold tracking-tight text-white">
              NutriTrack
            </h1>
            <p className="text-xs text-brand-sky" suppressHydrationWarning>
              {today || " "}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

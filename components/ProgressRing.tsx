import type { ReactNode } from "react";

type Props = {
  /** Progress ratio (0..1+); the arc caps at 1 but color reflects the true value. */
  ratio: number;
  size?: number;
  stroke?: number;
  /** Tailwind text-color class for the progress arc (e.g. "text-brand-sky"). */
  colorClass: string;
  children?: ReactNode;
};

/** Circular progress indicator with a value displayed in the center. */
export default function ProgressRing({
  ratio,
  size = 168,
  stroke = 14,
  colorClass,
  children,
}: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, ratio));
  const offset = circumference * (1 - pct);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-black/[0.07] dark:stroke-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colorClass} transition-[stroke-dashoffset] duration-700 ease-out`}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

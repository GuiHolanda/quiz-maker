'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface ScoreDonutProps {
  readonly percent: number;
  readonly toneClass: string;
  readonly size?: number;
  readonly children: ReactNode;
}

const RADIUS = 78;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoreDonut({ percent, toneClass, size = 232, children }: ScoreDonutProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setRevealed(true));

    return () => cancelAnimationFrame(frame);
  }, []);

  const clamped = Math.max(0, Math.min(100, percent));
  const offset = revealed ? CIRCUMFERENCE * (1 - clamped / 100) : CIRCUMFERENCE;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 180 180">
        <circle
          className="text-default-200"
          cx="90"
          cy="90"
          fill="none"
          r={RADIUS}
          stroke="currentColor"
          strokeWidth="14"
        />
        <circle
          className={`${toneClass} transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none`}
          cx="90"
          cy="90"
          fill="none"
          r={RADIUS}
          stroke="currentColor"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="14"
        />
        <circle
          className="text-primary/40"
          cx="90"
          cy="90"
          fill="none"
          r="62"
          stroke="currentColor"
          strokeDasharray="2 6"
          strokeWidth="2"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

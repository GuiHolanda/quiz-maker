'use client';

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface UsageCardProps {
  readonly icon: IconDefinition;
  readonly label: string;
  readonly used: number;
  readonly limit: number | null;
  readonly limitLabel: string;
  readonly renewNote?: string;
}

export function UsageCard({ icon, label, used, limit, limitLabel, renewNote }: UsageCardProps) {
  const isUnlimited = limit === null || limit === -1;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit!) * 100));

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <FontAwesomeIcon className="text-primary" icon={icon} />
          {label}
        </h4>
        <span className="text-sm font-medium text-default-400">
          {used} / {limitLabel}
        </span>
      </div>
      <div className="w-full bg-default-200 rounded-full h-2.5 mb-2 overflow-hidden">
        <div
          className="bg-primary h-2.5 rounded-full transition-all duration-300"
          style={{ width: isUnlimited ? '0%' : `${pct}%` }}
        />
      </div>
      {renewNote && <p className="text-xs text-default-400">{renewNote}</p>}
    </div>
  );
}

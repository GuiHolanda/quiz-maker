'use client';

import type { ReactNode } from 'react';

import { BlueprintFrame } from '@/app/(marketing)/components/shared/BlueprintFrame';

interface DemoStatCardProps {
  readonly label: string;
  readonly value: ReactNode;
  readonly footer: ReactNode;
  readonly accent?: boolean;
  readonly children?: ReactNode;
}

export function DemoStatCard({ label, value, footer, accent, children }: DemoStatCardProps) {
  return (
    <BlueprintFrame className="p-5">
      <p className="text-xs text-mkt-text opacity-50 mb-2">{label}</p>
      <p className={`mono text-3xl font-bold ${accent ? 'text-mkt-accent' : 'text-mkt-text'}`}>{value}</p>
      {children}
      <p className="text-xs text-mkt-text opacity-50 mt-2 leading-relaxed truncate">{footer}</p>
    </BlueprintFrame>
  );
}

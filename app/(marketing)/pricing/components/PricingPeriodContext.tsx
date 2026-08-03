'use client';

import { createContext, useContext, useState } from 'react';

type Period = 'monthly' | 'yearly';

interface PricingPeriodContextValue {
  readonly period: Period;
  readonly setPeriod: (p: Period) => void;
}

const PricingPeriodContext = createContext<PricingPeriodContextValue | null>(null);

export function PricingPeriodProvider({ children }: { readonly children: React.ReactNode }) {
  const [period, setPeriod] = useState<Period>('monthly');

  return <PricingPeriodContext.Provider value={{ period, setPeriod }}>{children}</PricingPeriodContext.Provider>;
}

export function usePricingPeriod(): PricingPeriodContextValue {
  const ctx = useContext(PricingPeriodContext);
  if (!ctx) throw new Error('usePricingPeriod must be used inside PricingPeriodProvider');
  return ctx;
}

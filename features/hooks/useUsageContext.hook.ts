'use client';

import { useContext } from 'react';

import { UsageContext } from '@/features/providers/usage.provider';

export function useUsageContext() {
  return useContext(UsageContext);
}

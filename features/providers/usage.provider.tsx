'use client';

import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';

import type { UsageStats } from '@/shared/types';
import { getBillingUsage } from '@/features/connectors';

interface UsageContextValue {
  readonly usage: UsageStats | null;
  readonly refreshUsage: () => void;
}

export const UsageContext = createContext<UsageContextValue>({
  usage: null,
  refreshUsage: () => {},
});

export function UsageProvider({ children }: { readonly children: ReactNode }) {
  const { status } = useSession();
  const [usage, setUsage] = useState<UsageStats | null>(null);

  const refreshUsage = useCallback(() => {
    getBillingUsage().then(setUsage).catch(() => {});
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      refreshUsage();
    } else {
      setUsage(null);
    }
  }, [status, refreshUsage]);

  return <UsageContext.Provider value={{ usage, refreshUsage }}>{children}</UsageContext.Provider>;
}

'use client';

import { createContext, useCallback, useState, type ReactNode } from 'react';

import type { LimitError } from '@/lib/limit-error';
import { parseLimitError } from '@/lib/limit-error';
import { LimitReachedModal } from '@/shared/components/ui/LimitReachedModal';

interface LimitModalContextValue {
  // Shows the limit modal. Returns true when the error was a limit (so the caller skips
  // its own error toast) and false when it wasn't, leaving normal handling in place.
  readonly showLimitIfBlocked: (err: unknown) => boolean;
  readonly showLimit: (limit: LimitError) => void;
}

export const LimitModalContext = createContext<LimitModalContextValue>({
  showLimitIfBlocked: () => false,
  showLimit: () => {},
});

// One modal for the whole workspace: quota walls surface from route handlers, save
// handlers and the catalog alike, and every one of them needs the same "here's what you
// hit, here's the upgrade" dialog. Mounting it once avoids each caller rendering its own.
export function LimitModalProvider({ children }: { readonly children: ReactNode }) {
  const [limit, setLimit] = useState<LimitError | null>(null);

  const showLimit = useCallback((next: LimitError) => setLimit(next), []);

  const showLimitIfBlocked = useCallback((err: unknown) => {
    const parsed = parseLimitError(err);

    if (!parsed) return false;
    setLimit(parsed);

    return true;
  }, []);

  return (
    <LimitModalContext.Provider value={{ showLimitIfBlocked, showLimit }}>
      {children}
      <LimitReachedModal limit={limit} onClose={() => setLimit(null)} />
    </LimitModalContext.Provider>
  );
}

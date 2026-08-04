'use client';
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface AiChatUIContextValue {
  readonly isOpen: boolean;
  readonly openChat: () => void;
  readonly closeChat: () => void;
}

const AiChatUIContext = createContext<AiChatUIContextValue | null>(null);

export function AiChatUIProvider({ children }: { readonly children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AiChatUIContext.Provider value={{ isOpen, openChat: () => setIsOpen(true), closeChat: () => setIsOpen(false) }}>
      {children}
    </AiChatUIContext.Provider>
  );
}

export function useAiChatUIContext(): AiChatUIContextValue {
  const ctx = useContext(AiChatUIContext);
  if (!ctx) throw new Error('useAiChatUIContext must be used inside AiChatUIProvider');
  return ctx;
}

'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

import { AiChatDrawer } from '@/shared/components/ui/AiChatDrawer';
import { AiChatFab } from '@/shared/components/ui/AiChatFab';

const AI_CHAT_PLANS = ['pro_ai', 'tester', 'admin'];

export function AiChatWrapper() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (status !== 'authenticated') return null;
  if (!AI_CHAT_PLANS.includes(session?.user?.plan ?? '')) return null;

  return (
    <>
      {!isOpen && <AiChatFab onPress={() => setIsOpen(true)} />}
      <AiChatDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

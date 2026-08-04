'use client';
import { useSession } from 'next-auth/react';

import { AiChatDrawer } from '@/shared/components/ai-chat/AiChatDrawer';
import { AiChatFab } from '@/shared/components/ai-chat/AiChatFab';
import { useAiChatUI } from '@/features/hooks/useAiChatUI.hook';
import { AI_CHAT_ALLOWED_PLANS } from '@/config/constants';

export function AiChatWrapper() {
  const { data: session, status } = useSession();
  const { isOpen, openChat, closeChat } = useAiChatUI();

  const userId = session?.user?.id ?? '';

  if (status !== 'authenticated') return null;
  if (!AI_CHAT_ALLOWED_PLANS.includes(session?.user?.plan ?? '')) return null;

  return (
    <>
      {!isOpen && <AiChatFab onPress={openChat} />}
      <AiChatDrawer isOpen={isOpen} userId={userId} onClose={closeChat} />
    </>
  );
}

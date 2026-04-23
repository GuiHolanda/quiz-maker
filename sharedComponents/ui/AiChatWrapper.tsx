'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { AiChatDrawer } from '@/sharedComponents/ui/AiChatDrawer';
import { AiChatFab } from '@/sharedComponents/ui/AiChatFab';

export function AiChatWrapper() {
  const { status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (status !== 'authenticated') return null;

  return (
    <>
      {!isOpen && <AiChatFab onPress={() => setIsOpen(true)} />}
      <AiChatDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

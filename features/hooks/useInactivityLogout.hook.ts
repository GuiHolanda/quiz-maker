'use client';

import { useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';

import { AI_CHAT_LOGOUT_INACTIVITY_MS } from '@/config/constants';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;

// Only users on AI-chat-enabled plans get the inactivity logout —
// free/pro users should not be silently signed out.
const AI_CHAT_PLANS = ['pro_ai', 'tester', 'admin'];

/**
 * Monitors user activity across the whole page and calls signOut() after
 * AI_CHAT_LOGOUT_INACTIVITY_MS of inactivity. Only active for authenticated
 * users on AI-chat plans (pro_ai, tester, admin).
 */
export function useInactivityLogout() {
  const { data: session, status } = useSession();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = status === 'authenticated' && AI_CHAT_PLANS.includes(session?.user?.plan ?? '');

  useEffect(() => {
    if (!isActive) return;

    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        signOut({ callbackUrl: '/login' });
      }, AI_CHAT_LOGOUT_INACTIVITY_MS);
    }

    resetTimer();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive]);
}

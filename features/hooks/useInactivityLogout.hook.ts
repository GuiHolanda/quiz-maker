'use client';

import { useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';

import { INACTIVITY_LOGOUT_MS } from '@/config/constants';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;

export function useInactivityLogout() {
  const { status } = useSession();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = status === 'authenticated';

  useEffect(() => {
    if (!isActive) return;

    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        signOut({ callbackUrl: '/login' });
      }, INACTIVITY_LOGOUT_MS);
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

'use client';

import { createContext, useReducer, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';

import type { AppNotification } from '@/shared/types';
import { notificationsReducer, type NotificationsState } from '@/features/reducers/notifications.reducer';
import { APP_NOTIFICATIONS_LOCAL_STORAGE_KEY } from '@/config/constants';

interface NotificationsContextValue {
  readonly notifications: AppNotification[];
  readonly unreadCount: number;
  readonly addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  readonly markAllRead: () => void;
}

export const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAllRead: () => {},
});

const INITIAL_STATE: NotificationsState = { notifications: [] };

export function NotificationsProvider({ children }: { readonly children: ReactNode }) {
  const [state, dispatch] = useReducer(notificationsReducer, INITIAL_STATE);
  const isHydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(APP_NOTIFICATIONS_LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppNotification[];
        dispatch({ type: 'setNotifications', payload: parsed });
      }
    } catch {}
    isHydrated.current = true;
  }, []);

  useEffect(() => {
    if (!isHydrated.current) return;
    try {
      localStorage.setItem(APP_NOTIFICATIONS_LOCAL_STORAGE_KEY, JSON.stringify(state.notifications));
    } catch {}
  }, [state.notifications]);

  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const full: AppNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    dispatch({ type: 'addNotification', payload: full });
  }, []);

  const markAllRead = useCallback(() => dispatch({ type: 'markAllRead' }), []);

  const unreadCount = state.notifications.filter((n) => !n.read).length;

  const contextValue = useMemo(
    () => ({ notifications: state.notifications, unreadCount, addNotification, markAllRead }),
    [state.notifications, unreadCount, addNotification, markAllRead],
  );

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
}


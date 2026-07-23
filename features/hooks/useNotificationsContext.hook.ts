'use client';

import { useContext } from 'react';

import { NotificationsContext } from '@/features/providers/notifications.provider';

export function useNotificationsContext() {
  return useContext(NotificationsContext);
}

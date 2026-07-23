import type { AppNotification } from '@/shared/types';

export interface NotificationsState {
  readonly notifications: AppNotification[];
}

export type NotificationsAction =
  | { type: 'addNotification'; payload: AppNotification }
  | { type: 'markAllRead' }
  | { type: 'setNotifications'; payload: AppNotification[] };

export function notificationsReducer(
  state: NotificationsState,
  action: NotificationsAction,
): NotificationsState {
  switch (action.type) {
    case 'addNotification':
      return { notifications: [action.payload, ...state.notifications] };
    case 'markAllRead':
      return { notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    case 'setNotifications':
      return { notifications: action.payload };
    default:
      return state;
  }
}

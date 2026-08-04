'use client';

import { Popover, PopoverTrigger, PopoverContent } from '@heroui/popover';
import NextLink from 'next/link';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useNotificationsContext } from '@/features/hooks/useNotificationsContext.hook';

export function NotificationsPopover() {
  const { t } = useTranslation();
  const { notifications, unreadCount, markAllRead } = useNotificationsContext();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover
      isOpen={isOpen}
      placement="bottom-end"
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open && unreadCount > 0) markAllRead();
      }}
    >
      <PopoverTrigger>
        <button
          data-testid="notification-bell"
          aria-label={t('aria.notifications')}
          className="relative w-8 h-8 flex items-center justify-center border border-default-200 rounded-lg hover:border-default-300 transition-colors bg-content1"
        >
          <FontAwesomeIcon className="text-default-400 w-3 h-3" icon={faBell} />
          {unreadCount > 0 && (
            <span
              data-testid="notification-badge"
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-danger rounded-full flex items-center justify-center text-[9px] font-bold text-danger-foreground leading-none"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-80">
        {renderPanel()}
      </PopoverContent>
    </Popover>
  );

  function renderPanel() {
    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-default-200">
          <p className="text-xs font-semibold text-foreground">{t('notification.title')}</p>
          {unreadCount > 0 && (
            <button className="text-xs text-primary hover:opacity-80 transition-opacity" onClick={markAllRead}>
              {t('notification.markAllRead')}
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-default-400">{t('notification.empty')}</p>
          </div>
        ) : (
          <div className="flex flex-col max-h-80 overflow-y-auto">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                data-testid="notification-item"
                className={`flex gap-3 px-4 py-3 border-b border-default-200 last:border-0 ${!notif.read ? 'bg-primary/5' : ''}`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 ${notif.read ? 'invisible' : ''}`}
                />
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground leading-snug">{notif.title}</p>
                  <p className="text-xs text-default-500 leading-snug">{notif.description}</p>
                  {notif.ctaHref && notif.ctaLabel && (
                    <NextLink
                      className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity mt-1 self-start"
                      href={notif.ctaHref}
                      onClick={() => setIsOpen(false)}
                    >
                      {notif.ctaLabel}
                    </NextLink>
                  )}
                  <p className="text-[10px] text-default-400 mt-0.5">
                    <RelativeDate date={notif.createdAt} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

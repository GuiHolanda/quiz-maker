'use client';

import { Avatar } from '@heroui/avatar';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from '@heroui/dropdown';
import { Popover, PopoverTrigger, PopoverContent } from '@heroui/popover';
import NextLink from 'next/link';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faMagnifyingGlass, faArrowUp, faUser } from '@fortawesome/free-solid-svg-icons';

import { UpgradeModal } from '@/shared/components/ui/UpgradeModal';
import { UsageBadge } from '@/shared/components/ui/UsageBadge';
import { ThemeSwitch } from '@/shared/components/ui/theme-switch';
import { LanguageSwitch } from '@/shared/components/ui/language-switch';
import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { useNotificationsContext } from '@/features/hooks/useNotificationsContext.hook';

export function WorkspaceHeader() {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const { usage } = useUsageContext();
  const { notifications, unreadCount, markAllRead } = useNotificationsContext();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <>
      <header className="hidden md:flex shrink-0 bg-background border-b border-divider px-6 py-3 items-center gap-4 z-20 h-14">
        {/* Search */}
        <div className="flex-1 max-w-lg relative">
          <FontAwesomeIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400 w-3 h-3"
            icon={faMagnifyingGlass}
          />
          <input
            className="w-full text-xs text-foreground bg-content1 border border-default-200 rounded-lg px-3 py-2 pl-8 placeholder:text-default-400 transition-colors duration-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            placeholder={t('header.searchPlaceholder')}
            type="text"
          />
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Usage badge */}
          {status === 'authenticated' && usage && <UsageBadge usage={usage} />}

          {/* Notifications */}
          <Popover
            isOpen={isNotifOpen}
            placement="bottom-end"
            onOpenChange={(open) => {
              setIsNotifOpen(open);
              if (!open && unreadCount > 0) markAllRead();
            }}
          >
            <PopoverTrigger>
              <button
                aria-label={t('aria.notifications')}
                className="relative w-8 h-8 flex items-center justify-center border border-default-200 rounded-lg hover:border-default-300 transition-colors bg-content1"
              >
                <FontAwesomeIcon className="text-default-400 w-3 h-3" icon={faBell} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-danger rounded-full flex items-center justify-center text-[9px] font-bold text-danger-foreground leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-80">
              {renderNotificationsPanel()}
            </PopoverContent>
          </Popover>

          {/* User dropdown */}
          {status === 'authenticated' && session?.user && (
            <Dropdown isOpen={isDropdownOpen} placement="bottom-end" onOpenChange={setIsDropdownOpen}>
              <DropdownTrigger>
                <Avatar
                  as="button"
                  classNames={{ base: 'ring-2 ring-primary/40 ring-offset-1 ring-offset-transparent cursor-pointer' }}
                  name={session.user.name ?? session.user.email ?? undefined}
                  size="sm"
                  src={session.user.image ?? undefined}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label={t('aria.userMenu')} className="min-w-[200px]" closeOnSelect={false}>
                <DropdownSection showDivider>
                  <DropdownItem key="user-info" isReadOnly className="opacity-100 cursor-default">
                    <p className="text-sm font-semibold text-foreground">
                      {session.user.name ?? session.user.email ?? 'Account'}
                    </p>
                    <p className="text-xs text-default-400">{session.user.email}</p>
                  </DropdownItem>
                  <DropdownItem
                    key="billing"
                    as={NextLink}
                    href="/billing"
                    startContent={<FontAwesomeIcon className="w-3 h-3" icon={faUser} />}
                    onPress={() => setIsDropdownOpen(false)}
                  >
                    {t('nav.manageAccount')}
                  </DropdownItem>
                </DropdownSection>
                {usage?.plan === 'free' ? (
                  <DropdownSection showDivider>
                    <DropdownItem
                      key="upgrade"
                      className="text-primary font-semibold"
                      startContent={<FontAwesomeIcon className="w-3 h-3" icon={faArrowUp} />}
                      onPress={() => setIsUpgradeOpen(true)}
                    >
                      {t('billing.upgradeButton')}
                    </DropdownItem>
                  </DropdownSection>
                ) : null}
                <DropdownSection showDivider>
                  <DropdownItem key="theme" isReadOnly className="cursor-default">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-default-600">{t('nav.theme')}</span>
                      <ThemeSwitch />
                    </div>
                  </DropdownItem>
                  <DropdownItem key="language" isReadOnly className="cursor-default">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-default-600">{t('nav.language')}</span>
                      <LanguageSwitch />
                    </div>
                  </DropdownItem>
                </DropdownSection>
                <DropdownItem
                  key="sign-out"
                  className="text-danger"
                  color="danger"
                  onPress={() => signOut({ callbackUrl: '/login' })}
                >
                  {t('common.signOut')}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
      </header>

      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </>
  );

  function renderNotificationsPanel() {
    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-default-200">
          <p className="text-xs font-semibold text-foreground">{t('aria.notifications')}</p>
          {unreadCount > 0 && (
            <button
              className="text-xs text-primary hover:opacity-80 transition-opacity"
              onClick={markAllRead}
            >
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
                className={`flex gap-3 px-4 py-3 border-b border-default-200 last:border-0 ${!notif.read ? 'bg-primary/5' : ''}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 ${notif.read ? 'invisible' : ''}`} />
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground leading-snug">{notif.title}</p>
                  <p className="text-xs text-default-500 leading-snug">{notif.description}</p>
                  {notif.ctaHref && notif.ctaLabel && (
                    <NextLink
                      className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity mt-1 self-start"
                      href={notif.ctaHref}
                      onClick={() => setIsNotifOpen(false)}
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

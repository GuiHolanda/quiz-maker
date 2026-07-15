'use client';

import { Avatar } from '@heroui/avatar';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from '@heroui/dropdown';
import NextLink from 'next/link';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faMagnifyingGlass, faArrowUp, faUser, faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';

import { UpgradeModal } from '@/shared/components/ui/UpgradeModal';
import { UsageBadge } from '@/shared/components/ui/UsageBadge';
import { ThemeSwitch } from '@/shared/components/ui/theme-switch';
import { LanguageSwitch } from '@/shared/components/ui/language-switch';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';

export function WorkspaceHeader() {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const { usage } = useUsageContext();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <>
      <header className="hidden md:flex shrink-0 bg-background2 border-b border-divider px-6 py-3 items-center gap-4 z-20 h-14">
        {/* Search */}
        <div className="flex-1 max-w-lg relative">
          <FontAwesomeIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400 w-3 h-3"
            icon={faMagnifyingGlass}
          />
          <input
            className="w-full text-xs text-foreground bg-content1 border border-default-200 rounded-lg px-3 py-2 pl-8 placeholder:text-default-400 transition-colors duration-200 focus:outline-none focus:border-primary"
            placeholder={t('header.searchPlaceholder')}
            type="text"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="font-mono text-default-400 border border-default-200 rounded px-1 text-[9px]">
              ⌘K
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Usage badge */}
          {status === 'authenticated' && usage && <UsageBadge usage={usage} />}

          {/* Notifications */}
          <button
            aria-label={t('aria.notifications')}
            className="relative w-8 h-8 flex items-center justify-center border border-default-200 rounded-lg hover:border-default-300 transition-colors bg-content1"
          >
            <FontAwesomeIcon className="text-default-400 w-3 h-3" icon={faBell} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-danger rounded-full" />
          </button>

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
                    <p className="text-sm font-semibold text-foreground">{session.user.name}</p>
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
}

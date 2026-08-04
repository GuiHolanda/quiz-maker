'use client';

import type { UserPlan } from '@/shared/types';

import { Avatar } from '@heroui/avatar';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from '@heroui/dropdown';
import NextLink from 'next/link';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faUser } from '@fortawesome/free-solid-svg-icons';

import { UpgradeModal } from '@/shared/components/ui/UpgradeModal';
import { ThemeSwitch } from '@/shared/components/ui/theme-switch';
import { LanguageSwitch } from '@/shared/components/ui/language-switch';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';

const PLAN_BADGE_KEYS: Partial<Record<UserPlan, string>> = {
  free: 'billing.badge.free',
  pro: 'billing.badge.pro',
  pro_ai: 'billing.badge.proAi',
};

function getPlanLabel(plan: UserPlan, t: (key: string) => string): string {
  const key = PLAN_BADGE_KEYS[plan];
  return key ? t(key) : plan;
}

export function UserDropdown() {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const { usage } = useUsageContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  if (status !== 'authenticated' || !session?.user) return null;

  const name = session.user.name ?? session.user.email ?? t('common.account');
  const planLabel = usage?.plan ? getPlanLabel(usage.plan, t) : null;

  return (
    <>
      <Dropdown isOpen={isDropdownOpen} placement="bottom-end" onOpenChange={setIsDropdownOpen}>
        <DropdownTrigger>
          <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-content2 transition-colors duration-200 cursor-pointer">
            <Avatar
              name={session.user.name ?? session.user.email ?? undefined}
              size="sm"
              src={session.user.image ?? undefined}
            />
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-foreground leading-tight">{name}</span>
              {planLabel && (
                <span className="text-xs text-default-400 leading-tight">{planLabel}</span>
              )}
            </div>
          </button>
        </DropdownTrigger>
        <DropdownMenu aria-label={t('aria.userMenu')} className="min-w-[200px]" closeOnSelect={false}>
          <DropdownSection showDivider>
            <DropdownItem key="user-info" isReadOnly className="opacity-100 cursor-default">
              <p className="text-sm font-semibold text-foreground">{name}</p>
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
      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </>
  );
}

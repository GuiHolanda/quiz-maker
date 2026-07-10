'use client';

import type { UsageStats } from '@/shared/types';

import NextLink from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faBars, faXmark, faArrowUp, faUser } from '@fortawesome/free-solid-svg-icons';
import { Avatar } from '@heroui/avatar';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from '@heroui/dropdown';
import { Button } from '@heroui/button';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { getBillingUsage } from '@/features/connectors';
import { ThemeSwitch } from '@/shared/components/ui/theme-switch';
import { LanguageSwitch } from '@/shared/components/ui/language-switch';
import { UpgradeModal } from '@/shared/components/ui/UpgradeModal';

const NAV_LINKS = [
  { labelKey: 'nav.certificates', href: '/certifications/simulados' },
  { labelKey: 'nav.concursos', href: '/public-exams/simulados' },
  { labelKey: 'nav.pricing', href: '/pricing' },
  { labelKey: 'nav.docs', href: '#' },
] as const;

export function MarketingNavbar() {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      getBillingUsage()
        .then(setUsage)
        .catch(() => {});
    } else {
      setUsage(null);
    }
  }, [status]);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-navy-800/60"
        style={{ background: 'rgba(15,27,61,0.95)', backdropFilter: 'blur(8px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <NextLink className="flex items-center gap-3" href="/">
              <div
                className="w-7 h-7 rounded flex items-center justify-center"
                style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)' }}
              >
                <FontAwesomeIcon className="text-accent text-xs" icon={faMicrochip} />
              </div>
              <span className="font-sora font-bold text-white text-sm tracking-tight">CertifiqueAI</span>
              <span className="hidden sm:block w-px h-4 bg-navy-700 mx-1" />
              <span className="hidden sm:block font-mono text-xs text-navy-400 tracking-wider">EXAM PLATFORM</span>
            </NextLink>

            {/* Nav links — desktop */}
            <nav className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map((item) => (
                <NextLink
                  key={item.href}
                  className="font-sans text-xs font-medium text-navy-400 hover:text-white transition-colors tracking-wide uppercase"
                  href={item.href}
                >
                  {t(item.labelKey)}
                </NextLink>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Auth state */}
              {status === 'authenticated' && session?.user ? (
                renderUserDropdown()
              ) : (
                <>
                  <NextLink
                    className="font-sans text-xs font-medium text-navy-400 hover:text-white transition-colors tracking-wide hidden sm:block"
                    href="/login"
                  >
                    {t('nav.logIn')}
                  </NextLink>
                  <Button
                    as={NextLink}
                    className="font-sans text-xs font-semibold bg-navy-600 hover:bg-navy-500 text-white border border-navy-500 rounded tracking-wide"
                    href="/login"
                    size="sm"
                  >
                    {t('nav.startFreeTrial')}
                  </Button>
                </>
              )}

              {/* Mobile hamburger */}
              <button
                aria-label="Toggle menu"
                className="md:hidden text-navy-400 hover:text-white transition-colors"
                onClick={() => setMenuOpen((o) => !o)}
              >
                <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} className="text-sm" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-navy-800/60 bg-navy-950/98 px-4 py-4">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((item) => (
                <NextLink
                  key={item.href}
                  className="font-sans text-sm text-navy-400 hover:text-white transition-colors py-2.5 border-b border-navy-800/40 last:border-0"
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                >
                  {t(item.labelKey)}
                </NextLink>
              ))}
              {!(status === 'authenticated' && session?.user) && (
                <NextLink
                  className="font-sans text-sm text-navy-400 hover:text-white transition-colors py-2.5"
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('nav.logIn')}
                </NextLink>
              )}
            </nav>
          </div>
        )}
      </header>
      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </>
  );

  function renderUserDropdown() {
    return (
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Avatar
            as="button"
            classNames={{ base: 'ring-2 ring-accent/30 ring-offset-1 ring-offset-transparent cursor-pointer' }}
            name={session?.user?.name ?? session?.user?.email ?? undefined}
            size="sm"
            src={session?.user?.image ?? undefined}
          />
        </DropdownTrigger>
        <DropdownMenu aria-label={t('aria.userMenu')} className="min-w-[200px]" closeOnSelect={false}>
          <DropdownSection showDivider>
            <DropdownItem key="user-info" isReadOnly className="opacity-100 cursor-default">
              <p className="text-sm font-semibold text-foreground">{session?.user?.name}</p>
              <p className="text-xs text-default-400">{session?.user?.email}</p>
            </DropdownItem>
            <DropdownItem
              key="billing"
              as={NextLink}
              href="/billing"
              startContent={<FontAwesomeIcon className="w-3 h-3" icon={faUser} />}
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
    );
  }
}

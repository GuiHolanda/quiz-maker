'use client';

import NextLink from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark, faArrowUp, faUser, faHouse } from '@fortawesome/free-solid-svg-icons';
import { Avatar } from '@heroui/avatar';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from '@heroui/dropdown';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { UpgradeModal } from '@/shared/components/ui/UpgradeModal';

const NAV_LINKS = [
  { labelKey: 'nav.certificates', href: '/#certificacoes' },
  { labelKey: 'nav.concursos', href: '/#concursos' },
  { labelKey: 'nav.features', href: '/#features' },
  { labelKey: 'nav.pricing', href: '/#pricing' },
] as const;

const navLinkClass =
  'text-sm font-medium text-mkt-text opacity-60 hover:opacity-100 transition-opacity duration-150';

export function MarketingNavbar() {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <header className="border-b border-mkt-divider bg-mkt-bg overflow-hidden">
          <div className="px-4 sm:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-10">
                <NextLink className="flex items-center" href="/">
                  <span className="ds-heading text-mkt-text text-base tracking-tight">Certifique AI</span>
                </NextLink>

                <nav aria-label="Main navigation" className="hidden md:flex items-center gap-7">
                  {NAV_LINKS.map((item) => (
                    <NextLink key={item.labelKey} className={navLinkClass} href={item.href}>
                      {t(item.labelKey)}
                    </NextLink>
                  ))}
                </nav>
              </div>

              <div className="flex items-center gap-3">
                {status === 'authenticated' && session?.user ? (
                  <>
                    <NextLink
                      className={`${navLinkClass} hidden sm:flex items-center gap-1.5`}
                      href="/dashboard"
                    >
                      <FontAwesomeIcon icon={faHouse} className="text-xs" />
                      {t('nav.dashboard')}
                    </NextLink>
                    {renderUserDropdown()}
                  </>
                ) : (
                  <>
                    <NextLink className={`${navLinkClass} hidden sm:block`} href="/login">
                      {t('nav.logIn')}
                    </NextLink>
                    <NextLink
                      className="inline-flex items-center text-sm font-semibold bg-mkt-accent text-white px-4 py-2 leading-none hover:opacity-90 transition-opacity"
                      href="/register"
                    >
                      {t('nav.startFreeTrial')}
                    </NextLink>
                  </>
                )}

                <button
                  type="button"
                  aria-label={t('nav.toggleMenu')}
                  aria-expanded={menuOpen}
                  className="md:hidden text-mkt-text opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-none"
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} className="text-sm" />
                </button>
              </div>
            </div>
          </div>

          {menuOpen && (
            <div className="md:hidden border-t border-mkt-divider bg-mkt-bg px-4 py-3">
              <nav className="flex flex-col">
                {NAV_LINKS.map((item) => (
                  <NextLink
                    key={item.labelKey}
                    className="text-sm text-mkt-text opacity-60 hover:opacity-100 transition-opacity py-3 border-b border-mkt-divider last:border-0"
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    {t(item.labelKey)}
                  </NextLink>
                ))}
                {!(status === 'authenticated' && session?.user) && (
                  <NextLink
                    className="text-sm text-mkt-text opacity-60 hover:opacity-100 transition-opacity py-3"
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
      </div>
      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </>
  );

  function renderUserDropdown() {
    return (
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Avatar
            as="button"
            classNames={{ base: 'cursor-pointer ring-2 ring-mkt-accent/30 ring-offset-1 ring-offset-transparent' }}
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
          {session?.user?.plan === 'free' ? (
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

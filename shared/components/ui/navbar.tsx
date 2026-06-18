'use client';

import type { UsageStats } from '@/shared/types';

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from '@heroui/navbar';
import { Link } from '@heroui/link';
import { Button } from '@heroui/button';
import { Avatar } from '@heroui/avatar';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from '@heroui/dropdown';
import NextLink from 'next/link';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faBrain, faChevronDown, faGear } from '@fortawesome/free-solid-svg-icons';

import { UpgradeModal } from '@/shared/components/ui/UpgradeModal';
import { UsageBadge } from '@/shared/components/ui/UsageBadge';
import { getBillingUsage } from '@/features/connectors';
import { ThemeSwitch } from '@/shared/components/ui/theme-switch';
import { LanguageSwitch } from '@/shared/components/ui/language-switch';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

const PRODUCT_ITEMS = [
  { label: 'nav.quiz', href: '/certifications/quiz' },
  { label: 'nav.generateQuestions', href: '/certifications/questions?tab=generate' },
  { label: 'nav.configureCertification', href: '/certifications/configure' },
  { label: 'nav.browseQuestions', href: '/certifications/questions?tab=browse' },
] as const;

const CONCURSO_ITEMS = [
  { label: 'nav.configureConcurso', href: '/public-exams/configure' },
  { label: 'nav.generateConcursoQuestions', href: '/public-exams/questions?tab=generate' },
  { label: 'nav.browseConcursoQuestions', href: '/public-exams/questions?tab=browse' },
  { label: 'nav.simulados', href: '/public-exams/simulados' },
] as const;

const NAV_LINKS = [
  { label: 'nav.solutions', href: '#' },
  { label: 'nav.pricing', href: '#' },
  { label: 'nav.docs', href: '#' },
] as const;

export const Navbar = () => {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
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

  const userDropdown = (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Avatar
          as="button"
          classNames={{ base: 'ring-2 ring-primary/40 ring-offset-1 ring-offset-transparent cursor-pointer' }}
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

  return (
    <>
      <HeroUINavbar
        classNames={{
          base: 'bg-background2 border-b border-divider',
          wrapper: 'px-4 sm:px-6',
        }}
        maxWidth="xl"
        position="sticky"
      >
        <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
          <NavbarBrand as="li" className="gap-3 max-w-fit">
            <NextLink className="flex justify-start items-center gap-2.5" href="/">
              <FontAwesomeIcon className="text-primary text-lg" icon={faBrain} />
              <p className="font-bold text-foreground tracking-wide text-sm">MyQuiz</p>
            </NextLink>
          </NavbarBrand>

          <ul className="hidden lg:flex gap-1 justify-start ml-2 items-center">
            <NavbarItem>
              <Dropdown>
                <DropdownTrigger>
                  <button className="flex items-center gap-1.5 text-default-500 hover:text-foreground text-sm px-3 py-1.5 rounded-lg hover:bg-default-100 transition-colors duration-200">
                    {t('nav.certificates')}
                    <FontAwesomeIcon className="w-2.5 h-2.5" icon={faChevronDown} />
                  </button>
                </DropdownTrigger>
                <DropdownMenu aria-label={t('nav.certificates')} className="font-sans">
                  {PRODUCT_ITEMS.map((item) => (
                    <DropdownItem key={item.href} as={NextLink} href={item.href}>
                      <span className="text-sm">{t(item.label)}</span>
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
            {(!usage || usage.publicExamsLimit !== 0) && (
              <NavbarItem>
                <Dropdown>
                  <DropdownTrigger>
                    <button className="flex items-center gap-1.5 text-default-500 hover:text-foreground text-sm px-3 py-1.5 rounded-lg hover:bg-default-100 transition-colors duration-200">
                      {t('nav.concursos')}
                      <FontAwesomeIcon className="w-2.5 h-2.5" icon={faChevronDown} />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label={t('nav.concursos')} className="font-sans">
                    {CONCURSO_ITEMS.map((item) => (
                      <DropdownItem key={item.href} as={NextLink} href={item.href}>
                        <span className="text-sm">{t(item.label)}</span>
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </NavbarItem>
            )}
            {NAV_LINKS.map((item) => (
              <NavbarItem key={item.label}>
                <NextLink
                  className="text-default-500 hover:text-foreground text-sm px-3 py-1.5 rounded-lg hover:bg-default-100 transition-colors duration-200"
                  href={item.href}
                >
                  {t(item.label)}
                </NextLink>
              </NavbarItem>
            ))}
            {status === 'authenticated' && session?.user?.plan === 'admin' && (
              <NavbarItem>
                <NextLink
                  className="flex items-center gap-1.5 text-default-500 hover:text-foreground text-sm px-3 py-1.5 rounded-lg hover:bg-default-100 transition-colors duration-200"
                  href="/admin"
                >
                  <FontAwesomeIcon className="w-3 h-3" icon={faGear} />
                  Admin
                </NextLink>
              </NavbarItem>
            )}
          </ul>
        </NavbarContent>

        <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
          {status === 'authenticated' && usage && (
            <NavbarItem>
              <UsageBadge usage={usage} />
            </NavbarItem>
          )}
          <NavbarItem className="hidden sm:flex gap-2 items-center">
            {status === 'authenticated' && session?.user ? (
              userDropdown
            ) : (
              <div className="flex items-center gap-3">
                <NextLink
                  className="text-sm text-default-500 hover:text-foreground transition-colors duration-200"
                  href="/login"
                >
                  {t('nav.logIn')}
                </NextLink>
                <Button
                  as={NextLink}
                  className="bg-primary text-primary-foreground font-semibold rounded-lg transition-colors duration-200 px-4"
                  href="/login"
                  size="sm"
                >
                  {t('nav.startFreeTrial')}
                </Button>
              </div>
            )}
          </NavbarItem>
        </NavbarContent>

        <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
          {status === 'authenticated' && session?.user ? (
            userDropdown
          ) : (
            <Button
              as={NextLink}
              className="bg-primary text-primary-foreground font-semibold rounded-lg"
              href="/login"
              size="sm"
            >
              {t('nav.logIn')}
            </Button>
          )}
          <NavbarMenuToggle className="text-default-500" />
        </NavbarContent>

        <NavbarMenu className="bg-background border-t border-divider pt-4">
          <div className="mx-4 mt-2 flex flex-col gap-1">
            <p className="text-xs font-semibold text-default-400 px-2 pt-2 pb-1">{t('nav.certificates')}</p>
            {PRODUCT_ITEMS.map((item) => (
              <NavbarMenuItem key={item.href}>
                <Link className="text-default-500 hover:text-foreground pl-2" href={item.href} size="lg">
                  {t(item.label)}
                </Link>
              </NavbarMenuItem>
            ))}
            {(!usage || usage.publicExamsLimit !== 0) && (
              <>
                <p className="text-xs font-semibold text-default-400 px-2 pt-3 pb-1">{t('nav.concursos')}</p>
                {CONCURSO_ITEMS.map((item) => (
                  <NavbarMenuItem key={item.href}>
                    <Link className="text-default-500 hover:text-foreground pl-2" href={item.href} size="lg">
                      {t(item.label)}
                    </Link>
                  </NavbarMenuItem>
                ))}
              </>
            )}
            {NAV_LINKS.map((item) => (
              <NavbarMenuItem key={item.label}>
                <Link className="text-default-500 hover:text-foreground" href={item.href} size="lg">
                  {t(item.label)}
                </Link>
              </NavbarMenuItem>
            ))}
            {status === 'authenticated' && session?.user?.plan === 'admin' && (
              <NavbarMenuItem>
                <Link className="text-default-500 hover:text-foreground flex items-center gap-1.5" href="/admin" size="lg">
                  <FontAwesomeIcon className="w-3 h-3" icon={faGear} />
                  Admin
                </Link>
              </NavbarMenuItem>
            )}
          </div>
        </NavbarMenu>
      </HeroUINavbar>
      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </>
  );
};

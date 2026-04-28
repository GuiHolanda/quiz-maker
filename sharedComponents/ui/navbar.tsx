'use client';

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from '@heroui/navbar';
import { Kbd } from '@heroui/kbd';
import { Link } from '@heroui/link';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { link as linkStyles } from '@heroui/theme';
import { Avatar } from '@heroui/avatar';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from '@heroui/dropdown';
import NextLink from 'next/link';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

import { siteConfig } from '@/config/site';
import { PlanBadge } from '@/sharedComponents/ui/PlanBadge';
import { UsageBadge } from '@/sharedComponents/ui/UsageBadge';
import { getBillingUsage } from '@/features/connectors';
import type { UsageStats } from '@/types';
import { ThemeSwitch } from '@/sharedComponents/ui/theme-switch';
import { LanguageSwitch } from '@/sharedComponents/ui/language-switch';
import { SearchIcon } from '@/sharedComponents/icons';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

export const Navbar = () => {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const [usage, setUsage] = useState<UsageStats | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      getBillingUsage().then(setUsage).catch(() => {});
    } else {
      setUsage(null);
    }
  }, [status]);

  const userDropdown = (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Avatar
          as="button"
          size="sm"
          src={session?.user?.image ?? undefined}
          name={session?.user?.name ?? session?.user?.email ?? undefined}
          classNames={{ base: 'ring-2 ring-primary/40 ring-offset-1 ring-offset-transparent cursor-pointer' }}
        />
      </DropdownTrigger>
      <DropdownMenu
        aria-label={t('aria.userMenu')}
        closeOnSelect={false}
        className="min-w-[200px]"
      >
        <DropdownSection showDivider>
          <DropdownItem key="user-info" isReadOnly className="opacity-100 cursor-default">
            <p className="text-sm font-semibold text-foreground">{session?.user?.name}</p>
            <p className="text-xs text-default-400">{session?.user?.email}</p>
          </DropdownItem>
        </DropdownSection>
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
          color="danger"
          className="text-danger"
          onPress={() => signOut({ callbackUrl: '/login' })}
        >
          {t('common.signOut')}
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );

  const searchInput = (
    <Input
      aria-label={t('aria.search')}
      classNames={{ ...inputProperties.input.classNames, input: 'text-sm' }}
      variant="bordered"
      endContent={
        <Kbd className="hidden lg:inline-block" keys={['command']}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder={t('common.search')}
      startContent={<SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />}
      type="search"
    />
  );

  return (
    <HeroUINavbar
      maxWidth="xl"
      position="sticky"
      classNames={{
        base: 'bg-background border-b border-divider',
        wrapper: 'px-4 sm:px-6',
      }}
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-2.5" href="/">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white text-[10px] font-bold tracking-tight">AI</span>
            </div>
            <p className="font-bold text-foreground tracking-wide text-sm">AIQuiz</p>
          </NextLink>
        </NavbarBrand>
        <ul className="hidden lg:flex gap-1 justify-start ml-2">
          {siteConfig.navItems &&
            siteConfig.navItems.length > 0 &&
            siteConfig.navItems.map((item: any) => (
              <NavbarItem key={item.href}>
                <NextLink
                  className={clsx(
                    linkStyles({ color: 'foreground' }),
                    'text-default-500 hover:text-foreground text-sm px-3 py-1.5 rounded-lg hover:bg-default-100 transition-colors duration-200',
                    'data-[active=true]:text-primary data-[active=true]:font-medium data-[active=true]:bg-primary/10'
                  )}
                  color="foreground"
                  href={item.href}
                >
                  {t(item.label)}
                </NextLink>
              </NavbarItem>
            ))}
        </ul>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
        {status === 'authenticated' && usage && (
          <>
            <NavbarItem>
              <UsageBadge usage={usage} />
            </NavbarItem>
            <NavbarItem>
              <PlanBadge plan={usage.plan} />
            </NavbarItem>
          </>
        )}
        <NavbarItem className="hidden sm:flex gap-2 items-center">
          {status === 'authenticated' && session?.user ? (
            userDropdown
          ) : (
            <Button
              as={NextLink}
              href="/login"
              size="sm"
              className="bg-primary text-primary-foreground font-semibold rounded-lg transition-colors duration-200 px-4"
            >
              {t('common.signIn')}
            </Button>
          )}
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        {status === 'authenticated' && session?.user ? (
          userDropdown
        ) : (
          <Button
            as={NextLink}
            href="/login"
            size="sm"
            className="bg-primary text-primary-foreground font-semibold rounded-lg"
          >
            {t('common.signIn')}
          </Button>
        )}
        <NavbarMenuToggle className="text-default-500" />
      </NavbarContent>

      <NavbarMenu className="bg-background border-t border-divider pt-4">
        {searchInput}
        <div className="mx-4 mt-2 flex flex-col gap-1">
          {siteConfig.navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                color={index === 2 ? 'primary' : index === siteConfig.navMenuItems.length - 1 ? 'danger' : 'foreground'}
                href={item.href}
                size="lg"
                className="text-default-500 hover:text-foreground"
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};

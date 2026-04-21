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
import NextLink from 'next/link';
import clsx from 'clsx';
import { useSession, signOut } from 'next-auth/react';

import { siteConfig } from '@/config/site';
import { ThemeSwitch } from '@/sharedComponents/ui/theme-switch';
import { LanguageSwitch } from '@/sharedComponents/ui/language-switch';
import { GithubIcon, SearchIcon } from '@/sharedComponents/icons';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

export const Navbar = () => {
  const { data: session, status } = useSession();
  const { t } = useTranslation();

  const searchInput = (
    <Input
      aria-label={t('aria.search')}
      classNames={{
        inputWrapper: 'bg-default-100',
        input: 'text-sm',
      }}
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
        base: 'bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.05),0_4px_24px_rgba(0,0,0,0.4)]',
        wrapper: 'px-4 sm:px-6',
      }}
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-2.5" href="/">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_3px_10px_rgba(139,92,246,0.5)]">
              <span className="text-white text-[10px] font-bold tracking-tight">AI</span>
            </div>
            <p className="font-bold text-white/80 tracking-wide text-sm">AIQuiz</p>
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
                    'text-white/50 hover:text-white/80 text-sm px-3 py-1.5 rounded-lg hover:bg-white/[0.06] transition-all duration-200',
                    'data-[active=true]:text-violet-400 data-[active=true]:font-medium data-[active=true]:bg-violet-500/10'
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
        <NavbarItem className="hidden sm:flex gap-2 items-center">
          <Link isExternal aria-label={t('aria.github')} href={siteConfig.links.github}>
            <GithubIcon className="text-white/30 hover:text-white/60 transition-colors" />
          </Link>
          <ThemeSwitch />
          <LanguageSwitch />
          {status === 'authenticated' && session?.user ? (
            <div className="flex items-center gap-2">
              <Avatar
                size="sm"
                src={session.user.image ?? undefined}
                name={session.user.name ?? session.user.email ?? undefined}
                classNames={{ base: 'ring-2 ring-violet-500/40 ring-offset-1 ring-offset-transparent' }}
              />
              <Button
                size="sm"
                variant="flat"
                onPress={() => signOut({ callbackUrl: '/login' })}
                className="bg-white/[0.06] border border-white/[0.08] text-white/60 hover:bg-white/[0.1] hover:text-white/80 rounded-xl transition-all duration-200"
              >
                {t('common.signOut')}
              </Button>
            </div>
          ) : (
            <Button
              as={NextLink}
              href="/login"
              size="sm"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-[0_3px_12px_rgba(139,92,246,0.4)] hover:shadow-[0_4px_16px_rgba(139,92,246,0.55)] transition-all duration-200 px-4"
            >
              {t('common.signIn')}
            </Button>
          )}
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <Link isExternal aria-label={t('aria.github')} href={siteConfig.links.github}>
          <GithubIcon className="text-white/30" />
        </Link>
        <ThemeSwitch />
        <LanguageSwitch />
        {status === 'authenticated' ? (
          <Button
            size="sm"
            variant="flat"
            onPress={() => signOut({ callbackUrl: '/login' })}
            className="bg-white/[0.06] border border-white/[0.08] text-white/60 rounded-xl"
          >
            {t('common.signOut')}
          </Button>
        ) : (
          <Button
            as={NextLink}
            href="/login"
            size="sm"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl"
          >
            {t('common.signIn')}
          </Button>
        )}
        <NavbarMenuToggle className="text-white/50" />
      </NavbarContent>

      <NavbarMenu className="bg-[#0a0a1a]/95 backdrop-blur-xl border-t border-white/[0.06] pt-4">
        {searchInput}
        <div className="mx-4 mt-2 flex flex-col gap-1">
          {siteConfig.navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                color={index === 2 ? 'primary' : index === siteConfig.navMenuItems.length - 1 ? 'danger' : 'foreground'}
                href={item.href}
                size="lg"
                className="text-white/60 hover:text-white/90"
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

'use client';

import type { ThemeProviderProps } from 'next-themes';

import * as React from 'react';
import { HeroUIProvider } from '@heroui/system';
import { useRouter } from 'next/navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ToastProvider } from '@heroui/toast';
import { SessionProvider } from 'next-auth/react';

import { LanguageProvider } from '@/features/providers/language.provider';
import { useInactivityLogout } from '@/features/hooks/useInactivityLogout.hook';

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module '@react-types/shared' {
  interface RouterConfig {
    routerOptions: NonNullable<Parameters<ReturnType<typeof useRouter>['push']>[1]>;
  }
}

function InactivityGuard() {
  useInactivityLogout();

  return null;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <SessionProvider>
      <InactivityGuard />
      <LanguageProvider>
        <HeroUIProvider navigate={router.push}>
          <ToastProvider />
          <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
        </HeroUIProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}

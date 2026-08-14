'use client';

import { useSession } from 'next-auth/react';

export function usePrimaryCtaHref(): string {
  const { data: session } = useSession();
  return session?.user ? '/simulados' : '/register';
}

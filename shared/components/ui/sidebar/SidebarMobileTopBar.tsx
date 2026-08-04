'use client';

import NextLink from 'next/link';
import Image from 'next/image';
import { Avatar } from '@heroui/avatar';
import { IconMenu2 } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface SidebarMobileTopBarProps {
  readonly onOpen: () => void;
}

export function SidebarMobileTopBar({ onOpen }: SidebarMobileTopBarProps) {
  const { data: session } = useSession();
  const { t } = useTranslation();

  return (
    <div className="flex md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-background2 border-b border-divider items-center justify-between px-4">
      <button
        aria-label={t('aria.openMenu')}
        className="p-2 text-default-500 hover:text-foreground transition-colors"
        onClick={onOpen}
      >
        <IconMenu2 size={20} />
      </button>
      <NextLink className="flex items-center gap-2" href="/">
        <Image alt="CertifiqueAI" className="rounded-md" height={22} src="/icon.svg" width={22} />
        <p className="font-sora font-semibold text-foreground tracking-wide text-sm">Certifique AI</p>
      </NextLink>
      <Avatar
        classNames={{ base: 'ring-2 ring-primary/40 ring-offset-1 ring-offset-transparent' }}
        name={session?.user?.name ?? session?.user?.email ?? undefined}
        size="sm"
        src={session?.user?.image ?? undefined}
      />
    </div>
  );
}

'use client';

import { Drawer, DrawerContent, DrawerHeader, DrawerBody } from '@heroui/drawer';
import NextLink from 'next/link';
import Image from 'next/image';
import { IconX } from '@tabler/icons-react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { SidebarNav } from '@/shared/components/ui/sidebar/SidebarNav';
import { SidebarUsageCounters } from '@/shared/components/ui/sidebar/SidebarUsageCounters';

interface SidebarMobileDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function SidebarMobileDrawer({ isOpen, onClose }: SidebarMobileDrawerProps) {
  const { t } = useTranslation();

  return (
    <Drawer hideCloseButton isOpen={isOpen} placement="left" size="xs" onClose={onClose}>
      <DrawerContent className="bg-background2">
        <DrawerHeader className="flex items-center justify-between border-b border-divider px-4 py-3">
          <NextLink className="flex items-center gap-2" href="/" onClick={onClose}>
            <Image alt="CertifiqueAI" className="rounded-md" height={22} src="/icon.svg" width={22} />
            <p className="font-sora font-semibold text-foreground tracking-wide text-sm">Certifique AI</p>
          </NextLink>
          <button
            aria-label={t('nav.closeSidebar')}
            className="p-1.5 text-default-400 hover:text-foreground transition-colors rounded-lg hover:bg-default-100"
            onClick={onClose}
          >
            <IconX size={16} />
          </button>
        </DrawerHeader>
        <DrawerBody className="px-3 py-3">
          <SidebarNav isMobile onClose={onClose} />
          <SidebarUsageCounters />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

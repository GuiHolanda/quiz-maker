'use client';

import { Drawer, DrawerContent, DrawerHeader, DrawerBody } from '@heroui/drawer';
import { IconX } from '@tabler/icons-react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { SidebarBrandLockup } from '@/shared/components/ui/sidebar/SidebarBrandLockup';
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
        <DrawerHeader className="flex items-center gap-2 justify-between border-b border-content2 px-4 py-3">
          <SidebarBrandLockup onClick={onClose} />
          <button
            aria-label={t('nav.closeSidebar')}
            className="p-1.5 text-navy-500 hover:text-foreground transition-colors rounded-lg hover:bg-content2 shrink-0"
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

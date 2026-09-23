'use client';

import Image from 'next/image';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { SidebarBrandLockup } from '@/shared/components/ui/sidebar/SidebarBrandLockup';
import { SidebarNav } from '@/shared/components/ui/sidebar/SidebarNav';
import { SidebarUsageCounters } from '@/shared/components/ui/sidebar/SidebarUsageCounters';

interface SidebarDesktopProps {
  readonly isCollapsed: boolean;
  readonly onToggleCollapsed: () => void;
}

export function SidebarDesktop({ isCollapsed, onToggleCollapsed }: SidebarDesktopProps) {
  const { t } = useTranslation();

  return (
    <aside
      className={`hidden md:flex shrink-0 h-screen sticky top-0 flex-col bg-background2 border-r border-content2 overflow-hidden transition-[width] duration-200 ease-out ${isCollapsed ? 'w-[68px]' : 'w-[248px]'}`}
    >
      {renderBrand()}
      <div
        className={`flex-1 py-3.5 ${isCollapsed ? 'px-3 flex flex-col items-center overflow-hidden' : 'px-3 overflow-y-auto'}`}
      >
        <SidebarNav collapsed={isCollapsed} />
      </div>
      <SidebarUsageCounters isCollapsed={isCollapsed} />
    </aside>
  );

  function renderBrand() {
    if (isCollapsed) {
      return (
        <button
          aria-label={t('nav.expandSidebar')}
          className="h-14 flex items-center justify-center gap-1 border-b border-content2 shrink-0 w-full text-default-400 hover:text-foreground hover:bg-content2 transition-colors duration-200"
          onClick={onToggleCollapsed}
        >
          <Image alt="CertifiqueAI" className="rounded-md shrink-0" height={22} src="/icon.svg" width={22} />
          <IconChevronRight size={10} />
        </button>
      );
    }

    return (
      <div className="h-14 flex items-center gap-2 px-4 border-b border-content2 shrink-0">
        <SidebarBrandLockup />
        <button
          aria-label={t('nav.collapseSidebar')}
          className="p-1.5 text-default-400 hover:text-foreground transition-colors rounded-lg hover:bg-content2 shrink-0 ml-auto"
          onClick={onToggleCollapsed}
        >
          <IconChevronLeft size={14} />
        </button>
      </div>
    );
  }
}

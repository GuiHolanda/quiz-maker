'use client';

import { useState } from 'react';

import { SIDEBAR_COLLAPSED_LOCAL_STORAGE_KEY, SIDEBAR_COLLAPSED_COOKIE_KEY } from '@/config/constants';
import { SidebarDesktop } from '@/shared/components/ui/sidebar/SidebarDesktop';
import { SidebarMobileTopBar } from '@/shared/components/ui/sidebar/SidebarMobileTopBar';
import { SidebarMobileDrawer } from '@/shared/components/ui/sidebar/SidebarMobileDrawer';

interface SidebarProps {
  readonly defaultCollapsed?: boolean;
}

export function Sidebar({ defaultCollapsed = false }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem(SIDEBAR_COLLAPSED_LOCAL_STORAGE_KEY, String(next));
    document.cookie = `${SIDEBAR_COLLAPSED_COOKIE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
  };

  return (
    <>
      <SidebarDesktop isCollapsed={isCollapsed} onToggleCollapsed={toggleCollapsed} />
      <SidebarMobileTopBar onOpen={() => setIsMobileOpen(true)} />
      <SidebarMobileDrawer isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
    </>
  );
}

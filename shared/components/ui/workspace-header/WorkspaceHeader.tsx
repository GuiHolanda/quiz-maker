'use client';

import { useSession } from 'next-auth/react';

import { UsageBadge } from '@/shared/components/ui/UsageBadge';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { HeaderSearch } from '@/shared/components/ui/workspace-header/HeaderSearch';
import { NotificationsPopover } from '@/shared/components/ui/workspace-header/NotificationsPopover';
import { UserDropdown } from '@/shared/components/ui/workspace-header/UserDropdown';
import { Divider } from '@heroui/divider';

export function WorkspaceHeader() {
  const { status } = useSession();
  const { usage } = useUsageContext();

  return (
    <header className="hidden md:flex shrink-0 bg-background border-b border-divider px-6 py-3 items-center gap-4 z-20 h-14">
      <HeaderSearch />
      <div className="flex items-center space-x-4 ml-auto">
        {status === 'authenticated' && usage && <UsageBadge usage={usage} />}
        <NotificationsPopover />
        <Divider orientation="vertical" className="h-8" />
        <UserDropdown />
      </div>
    </header>
  );
}

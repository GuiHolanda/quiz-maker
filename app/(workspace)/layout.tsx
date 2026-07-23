import { cookies } from 'next/headers';

import { Sidebar } from '@/shared/components/ui/sidebar';
import { WorkspaceHeader } from '@/shared/components/ui/workspace-header';
import { AiChatWrapper } from '@/shared/components/ui/AiChatWrapper';
import { UsageProvider } from '@/features/providers/usage.provider';
import { NotificationsProvider } from '@/features/providers/notifications.provider';
import { SIDEBAR_COLLAPSED_COOKIE_KEY } from '@/config/constants';

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const defaultCollapsed = cookieStore.get(SIDEBAR_COLLAPSED_COOKIE_KEY)?.value === 'true';

  return (
    <NotificationsProvider>
      <UsageProvider>
        <div className="flex min-h-screen bg-background2">
          <Sidebar defaultCollapsed={defaultCollapsed} />
          <div className="flex flex-col flex-1 min-w-0">
            <WorkspaceHeader />
            <main className="flex-grow pt-14 md:pt-0">{children}</main>
          </div>
          <AiChatWrapper />
        </div>
      </UsageProvider>
    </NotificationsProvider>
  );
}

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { SessionProvider } from 'next-auth/react';

import { Sidebar } from '@/shared/components/ui/sidebar/Sidebar';
import { WorkspaceHeader } from '@/shared/components/ui/workspace-header/WorkspaceHeader';
import { AiChatWrapper } from '@/shared/components/ai-chat/AiChatWrapper';
import { AiChatUIProvider } from '@/features/providers/ai-chat-ui.provider';
import { UsageProvider } from '@/features/providers/usage.provider';
import { LimitModalProvider } from '@/features/providers/limit-modal.provider';
import { NotificationsProvider } from '@/features/providers/notifications.provider';
import { LanguageProvider } from '@/features/providers/language.provider';
import { SIDEBAR_COLLAPSED_COOKIE_KEY } from '@/config/constants';
import { auth } from '@/auth';
import { loadMessagesForPrefixes } from '@/lib/load-messages';
import { WORKSPACE_MESSAGE_PREFIXES } from '@/config/i18n-prefixes';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const [cookieStore, session, messages] = await Promise.all([
    cookies(),
    auth(),
    loadMessagesForPrefixes(WORKSPACE_MESSAGE_PREFIXES),
  ]);
  const defaultCollapsed = cookieStore.get(SIDEBAR_COLLAPSED_COOKIE_KEY)?.value === 'true';

  return (
    <SessionProvider session={session}>
      <LanguageProvider initialMessages={messages}>
        <NotificationsProvider>
          <UsageProvider>
            <LimitModalProvider>
              <AiChatUIProvider>
                <div className="flex min-h-screen bg-background2">
                  <Sidebar defaultCollapsed={defaultCollapsed} />
                  <div className="flex flex-col flex-1 min-w-0">
                    <WorkspaceHeader />
                    <main className="flex-grow pt-14 md:pt-0">{children}</main>
                  </div>
                  <AiChatWrapper />
                </div>
              </AiChatUIProvider>
            </LimitModalProvider>
          </UsageProvider>
        </NotificationsProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}

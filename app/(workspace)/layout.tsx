import { Sidebar } from '@/shared/components/ui/sidebar';
import { WorkspaceHeader } from '@/shared/components/ui/workspace-header';
import { AiChatWrapper } from '@/shared/components/ui/AiChatWrapper';
import { UsageProvider } from '@/features/providers/usage.provider';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <UsageProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <WorkspaceHeader />
          <main className="flex-grow pt-14 md:pt-0">{children}</main>
        </div>
        <AiChatWrapper />
      </div>
    </UsageProvider>
  );
}

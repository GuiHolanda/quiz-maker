import { Navbar } from '@/shared/components/ui/navbar';
import { Footer } from '@/shared/components/ui/footer';
import { AiChatWrapper } from '@/shared/components/ui/AiChatWrapper';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <AiChatWrapper />
    </div>
  );
}

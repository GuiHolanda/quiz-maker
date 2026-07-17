import { MarketingNavbar } from '@/shared/components/ui/marketing-navbar';
import { MarketingFooter } from '@/shared/components/ui/marketing-footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col min-h-screen bg-navy-900">
      <MarketingNavbar />
      <main className="flex-grow pt-20">{children}</main>
      <MarketingFooter />
    </div>
  );
}

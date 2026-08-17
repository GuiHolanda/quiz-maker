import { MarketingNavbar } from '@/shared/components/ui/marketing-navbar';
import { MarketingFooter } from '@/shared/components/ui/marketing-footer';

export default function SiteLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <>
      <MarketingNavbar />
      <main className="flex-grow pt-16">{children}</main>
      <MarketingFooter />
    </>
  );
}

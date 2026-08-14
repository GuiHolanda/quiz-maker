import { FocusedCtaNavbar } from '@/shared/components/ui/focused-cta-navbar';
import { MarketingFooter } from '@/shared/components/ui/marketing-footer';

export default function FocusedCtaLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <>
      <FocusedCtaNavbar />
      <main className="flex-grow pt-16">{children}</main>
      <MarketingFooter />
    </>
  );
}

import { SimuladoLandingNavbar } from '@/shared/components/ui/simulado-landing-navbar';
import { MarketingFooter } from '@/shared/components/ui/marketing-footer';

export default function SimuladoLandingLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <div data-theme="landing-light" className="relative flex flex-col min-h-screen bg-background">
      <SimuladoLandingNavbar />
      <main className="flex-grow pt-20">{children}</main>
      <MarketingFooter />
    </div>
  );
}

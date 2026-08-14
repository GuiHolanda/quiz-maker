import type { Metadata } from 'next';

import { HeroQuestionCard } from '@/app/(marketing)/components/home/HeroQuestionCard';
import { HeroStaticContent } from '@/app/(marketing)/components/home/HeroStaticContent';
import { StatsStrip } from '@/app/(marketing)/components/home/StatsStrip';
import { CertificationsSection } from '@/app/(marketing)/components/home/CertificationsSection';
import { ConcursosSection } from '@/app/(marketing)/components/home/ConcursosSection';
import { FeaturesSection } from '@/app/(marketing)/components/home/FeaturesSection';
import { HowItWorksSection } from '@/app/(marketing)/components/home/HowItWorksSection';
import { SimuladosDarkSection } from '@/app/(marketing)/components/home/SimuladosDarkSection';
import { ProgressSection } from '@/app/(marketing)/components/home/ProgressSection';
import { QualitySection } from '@/app/(marketing)/components/home/QualitySection';
import { HomepagePricingSection } from '@/app/(marketing)/components/home/HomepagePricingSection';
import { FaqSection } from '@/app/(marketing)/components/home/FaqSection';
import { CtaSectionCta } from '@/app/(marketing)/components/home/CtaSectionCta';

export const metadata: Metadata = {
  title: 'Questões com IA para Certificações e Concursos Públicos | CertifiqueAI',
  description:
    'Gere questões de prática sob demanda para AWS, Azure, OAB, CESPE e mais. IA calibrada para o formato real de cada exame.',
  openGraph: {
    title: 'Questões com IA para Certificações e Concursos Públicos',
    description:
      'Gere questões de prática sob demanda para AWS, Azure, OAB, CESPE e mais. IA calibrada para o formato real de cada exame.',
    url: 'https://www.certifiqueai.com',
    type: 'website',
  },
  alternates: { canonical: 'https://www.certifiqueai.com' },
};

export default function HeroPage() {
  return (
    <div>
      <HeroSection />
      <StatsStrip />
      <CertificationsSection />
      <ConcursosSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SimuladosDarkSection />
      <ProgressSection />
      <QualitySection />
      <HomepagePricingSection />
      <FaqSection />
      <CtaSectionShell />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="py-20 bg-mkt-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">
          <HeroStaticContent />
          <HeroQuestionCard />
        </div>
      </div>
    </section>
  );
}

function CtaSectionShell() {
  return (
    <div className="bg-mkt-surface border-t border-mkt-divider py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <CtaSectionCta />
      </div>
    </div>
  );
}

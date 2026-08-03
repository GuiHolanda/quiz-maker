import type { Metadata } from 'next';

import { TerminalDemo } from '@/app/(marketing)/components/TerminalDemo';
import { CtaSectionCta } from '@/app/(marketing)/components/CtaSectionCta';
import { HomepagePricingSection } from '@/app/(marketing)/components/HomepagePricingSection';
import { MarqueeDataStrip } from '@/app/(marketing)/components/MarqueeDataStrip';
import { StatsStrip } from '@/app/(marketing)/components/StatsStrip';
import { ExamGridSection } from '@/app/(marketing)/components/ExamGridSection';
import { FeaturesSection } from '@/app/(marketing)/components/FeaturesSection';
import { TestimonialsStrip } from '@/app/(marketing)/components/TestimonialsStrip';
import { HeroStaticContent } from '@/app/(marketing)/components/HeroStaticContent';

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
    <div className="bg-navy-900 text-[#e8edf3]">
      <MarqueeDataStrip />
      <HeroSection />
      <StatsStrip />
      <ExamGridSection />
      <FeaturesSection />
      <TestimonialsStrip />
      <HomepagePricingSection />
      <CtaSectionShell />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="pt-16 pb-24 relative overflow-hidden grid-bg">
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'rgba(0,212,255,0.04)', filter: 'blur(60px)' }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">
          <HeroStaticContent />
          <TerminalDemo />
        </div>
      </div>
    </section>
  );
}

function CtaSectionShell() {
  return (
    <div className="bg-navy-950 border-t border-navy-800/40 py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <CtaSectionCta />
      </div>
    </div>
  );
}

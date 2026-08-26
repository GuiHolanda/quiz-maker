import type { Metadata } from 'next';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

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
import { OG_IMAGES } from '@/config/og';
import { alternatesFor } from '@/lib/seo';
import { parseProperties } from '@/lib/properties-parser';
import { jsonLd } from '@/lib/json-ld';

export const metadata: Metadata = {
  title: 'Questões com IA para Certificações e Concursos Públicos',
  description:
    'Gere questões de prática sob demanda para AWS, Azure, OAB, CESPE e mais. IA calibrada para o formato real de cada exame.',
  openGraph: {
    title: 'Questões com IA para Certificações e Concursos Públicos',
    description:
      'Gere questões de prática sob demanda para AWS, Azure, OAB, CESPE e mais. IA calibrada para o formato real de cada exame.',
    url: 'https://www.certifiqueai.com',
    type: 'website',
    images: OG_IMAGES,
  },
  alternates: alternatesFor('/'),
};

async function loadPtMessages(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(join(process.cwd(), 'public', 'messages', 'pt.properties'), 'utf-8');
    return parseProperties(raw);
  } catch {
    return {};
  }
}

export default async function HeroPage() {
  const messages = await loadPtMessages();

  // No potentialAction/SearchAction: the site has no working search endpoint yet,
  // and declaring one Google might actually render as a sitelinks search box is
  // worse than omitting it.
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CertifiqueAI',
    url: 'https://www.certifiqueai.com',
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [1, 2, 3, 4, 5, 6, 7].map((n) => ({
      '@type': 'Question',
      name: messages[`homepage.faq.q${n}`],
      acceptedAnswer: { '@type': 'Answer', text: messages[`homepage.faq.a${n}`] },
    })),
  };

  // Points at real /simulado/[slug] landings rather than /register — a Course whose
  // url is a signup wall, not the content itself, is exactly what this used to be.
  const courseListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Course',
          name: 'AWS Solutions Architect (SAA-C03)',
          description: 'Questões de prática para o exame AWS Certified Solutions Architect Associate',
          provider: { '@type': 'Organization', name: 'CertifiqueAI', url: 'https://www.certifiqueai.com' },
          url: 'https://www.certifiqueai.com/simulado/aws-solutions-architect',
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: {
          '@type': 'Course',
          name: 'Microsoft Azure Fundamentals (AZ-900)',
          description: 'Questões de prática para o exame AZ-900',
          provider: { '@type': 'Organization', name: 'CertifiqueAI', url: 'https://www.certifiqueai.com' },
          url: 'https://www.certifiqueai.com/simulado/azure-fundamentals',
        },
      },
      {
        '@type': 'ListItem',
        position: 3,
        item: {
          '@type': 'Course',
          name: 'OAB 1ª Fase',
          description: 'Questões de prática para a primeira fase do Exame de Ordem, com gabarito comentado',
          provider: { '@type': 'Organization', name: 'CertifiqueAI', url: 'https://www.certifiqueai.com' },
          url: 'https://www.certifiqueai.com/simulado/oab',
        },
      },
    ],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(courseListSchema) }} />
      <HeroSection />
      <StatsStrip />
      <CertificationsSection />
      <ConcursosSection />
      <FeaturesSection />
      <QualitySection />
      <HowItWorksSection />
      <SimuladosDarkSection />
      <ProgressSection />
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

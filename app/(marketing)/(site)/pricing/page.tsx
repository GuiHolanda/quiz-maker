import type { Metadata } from 'next';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { PricingPeriodProvider } from '@/app/(marketing)/components/pricing/PricingPeriodContext';
import { PricingToggle } from '@/app/(marketing)/components/pricing/PricingToggle';
import { PricingCardList } from '@/app/(marketing)/components/pricing/PricingCardList';
import { BottomCtaCta } from '@/app/(marketing)/components/pricing/BottomCtaCta';
import { FeatureComparisonTable } from '@/app/(marketing)/components/pricing/FeatureComparisonTable';
import { PricingFaq } from '@/app/(marketing)/components/pricing/PricingFaq';
import { parseProperties } from '@/lib/properties-parser';
import { jsonLd } from '@/lib/json-ld';
import { OG_IMAGES } from '@/config/og';

export const metadata: Metadata = {
  title: 'Planos e Preços | CertifiqueAI',
  description:
    'Gratuito para começar. Planos Pro e Pro AI com mais questões, concursos públicos e assistente de estudos. Cancele quando quiser.',
  openGraph: {
    title: 'Planos e Preços | CertifiqueAI',
    description:
      'Gratuito para começar. Planos Pro e Pro AI com mais questões, concursos públicos e assistente de estudos. Cancele quando quiser.',
    url: 'https://www.certifiqueai.com/pricing',
    type: 'website',
    images: OG_IMAGES,
  },
  alternates: { canonical: 'https://www.certifiqueai.com/pricing' },
};

async function loadPtMessages(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(join(process.cwd(), 'public', 'messages', 'pt.properties'), 'utf-8');
    return parseProperties(raw);
  } catch {
    return {};
  }
}

export default async function PricingPage() {
  const messages = await loadPtMessages();

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [1, 2, 3, 4, 5].map((n) => ({
      '@type': 'Question',
      name: messages[`pricing.faq.q${n}`],
      acceptedAnswer: { '@type': 'Answer', text: messages[`pricing.faq.a${n}`] },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.certifiqueai.com' },
      { '@type': 'ListItem', position: 2, name: 'Planos e Preços', item: 'https://www.certifiqueai.com/pricing' },
    ],
  };

  return (
    <div className="text-mkt-text">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />

      <PricingPeriodProvider>
        <section className="py-20 px-6 text-center bg-mkt-bg border-b border-mkt-divider">
          <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
            <h1 className="ds-heading text-mkt-text text-3xl sm:text-4xl xl:text-5xl leading-tight text-wrap-balance">
              {messages['pricing.hero.title']}
            </h1>
            <p className="text-sm text-mkt-text opacity-60 leading-relaxed max-w-xl">
              {messages['pricing.hero.subtitle']}
            </p>
            <PricingToggle />
          </div>
        </section>

        <section className="px-6 py-20 bg-mkt-bg">
          <PricingCardList />
          <p className="text-center text-xs text-mkt-text opacity-50 mt-6">
            {messages['pricing.trust.noCardRequired']}
          </p>
        </section>
      </PricingPeriodProvider>

      <section className="py-16 px-6 bg-mkt-surface border-y border-mkt-divider">
        <div className="max-w-5xl mx-auto">
          <FeatureComparisonTable />
        </div>
      </section>

      <PricingFaq />

      <section className="py-20 px-6 bg-mkt-surface border-t border-mkt-divider">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="ds-heading text-mkt-text text-2xl sm:text-4xl mb-5">{messages['pricing.cta2.title']}</h2>
          <p className="text-sm text-mkt-text opacity-60 mb-8 max-w-lg mx-auto">{messages['pricing.cta2.subtitle']}</p>
          <BottomCtaCta />
          <p className="text-xs text-mkt-text opacity-50 mt-4">{messages['pricing.cta2.disclaimer']}</p>
        </div>
      </section>
    </div>
  );
}

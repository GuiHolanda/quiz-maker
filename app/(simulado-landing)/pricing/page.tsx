import type { Metadata } from 'next';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { PricingPeriodProvider } from '@/app/(marketing)/pricing/components/PricingPeriodContext';
import { PricingToggle } from '@/app/(marketing)/pricing/components/PricingToggle';
import { PricingCardList } from '@/app/(marketing)/pricing/components/PricingCardList';
import { BottomCtaCta } from '@/app/(marketing)/pricing/components/BottomCtaCta';
import { FeatureComparisonTable } from '@/app/(marketing)/pricing/components/FeatureComparisonTable';
import { PricingFaq } from '@/app/(marketing)/pricing/components/PricingFaq';
import { parseProperties } from '@/lib/properties-parser';

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
    <div className="text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <PricingPeriodProvider>
        <div className="relative overflow-hidden">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
            style={{ background: 'rgba(224,120,32,0.06)', filter: 'blur(60px)' }}
          />
          <section className="py-20 px-6 text-center relative z-10">
            <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
              <h1 className="font-sora font-extrabold text-white text-3xl sm:text-4xl xl:text-5xl leading-tight text-wrap-balance">
                {messages['pricing.hero.title']}
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xl">{messages['pricing.hero.subtitle']}</p>
              <PricingToggle />
            </div>
          </section>

          <section className="px-6 pb-20 relative z-10">
            <PricingCardList />
            <p className="text-center text-xs text-slate-400 mt-6">{messages['pricing.trust.noCardRequired']}</p>
          </section>
        </div>
      </PricingPeriodProvider>

      <section className="py-16 px-6 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <FeatureComparisonTable />
        </div>
      </section>

      <PricingFaq />

      <section className="py-20 px-6 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-sora font-extrabold text-slate-900 text-2xl sm:text-4xl mb-5">
            {messages['pricing.cta2.title']}
          </h2>
          <p className="text-sm text-slate-600 mb-8 max-w-lg mx-auto">{messages['pricing.cta2.subtitle']}</p>
          <BottomCtaCta />
          <p className="text-xs text-slate-600 mt-4">{messages['pricing.cta2.disclaimer']}</p>
        </div>
      </section>
    </div>
  );
}

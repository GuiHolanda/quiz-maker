import clsx from 'clsx';
import { Suspense } from 'react';

import { fontBarlow, fontBarlowCondensed } from '@/config/fonts';
import { jsonLd } from '@/lib/json-ld';
import { UtmCapture } from '@/app/(marketing)/components/UtmCapture';
import { LanguageProvider } from '@/features/providers/language.provider';
import { loadMessagesForPrefixes } from '@/lib/load-messages';
import { MARKETING_MESSAGE_PREFIXES } from '@/config/i18n-prefixes';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'EducationalOrganization'],
  name: 'CertifiqueAI',
  url: 'https://www.certifiqueai.com',
  logo: 'https://www.certifiqueai.com/icon.svg',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Categorias de Exames',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Course', name: 'Certificações de TI (AWS, Azure, SAP, CompTIA)' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Course', name: 'Concursos Públicos (CESPE, FCC, FGV)' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Course', name: 'Saúde (CRM, Conselhos de Enfermagem)' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Course', name: 'Finanças (CPA, CFP, CFA)' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Course', name: 'Direito (OAB, Especializações Jurídicas)' } },
    ],
  },
};

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const messages = await loadMessagesForPrefixes(MARKETING_MESSAGE_PREFIXES);

  return (
    <LanguageProvider initialMessages={messages}>
      <div
        className={clsx(
          'marketing-ds relative flex flex-col min-h-screen',
          fontBarlow.variable,
          fontBarlowCondensed.variable
        )}
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema) }} />
        <Suspense fallback={null}>
          <UtmCapture />
        </Suspense>
        {children}
      </div>
    </LanguageProvider>
  );
}

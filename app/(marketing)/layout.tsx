import { MarketingNavbar } from '@/shared/components/ui/marketing-navbar';
import { MarketingFooter } from '@/shared/components/ui/marketing-footer';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'EducationalOrganization'],
  name: 'CertifiqueAI',
  url: 'https://www.certifiqueai.com',
  logo: 'https://www.certifiqueai.com/icon.svg',
  sameAs: [],
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
        url: 'https://www.certifiqueai.com/register',
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
        url: 'https://www.certifiqueai.com/register',
      },
    },
    {
      '@type': 'ListItem',
      position: 3,
      item: {
        '@type': 'Course',
        name: 'Concursos Públicos — CESPE/CEBRASPE, FCC, FGV',
        description: 'Questões de prática para concursos públicos brasileiros com as principais bancas',
        provider: { '@type': 'Organization', name: 'CertifiqueAI', url: 'https://www.certifiqueai.com' },
        url: 'https://www.certifiqueai.com/register',
      },
    },
  ],
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid-bg relative flex flex-col min-h-screen bg-navy-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseListSchema) }} />
      <MarketingNavbar />
      <main className="flex-grow pt-20">{children}</main>
      <MarketingFooter />
    </div>
  );
}

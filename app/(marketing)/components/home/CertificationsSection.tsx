'use client';

import NextLink from 'next/link';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';

// The badge used to read "50+ trilhas", "18+ trilhas" and so on, summing to more
// than a hundred ready-made tracks. The catalog holds 18 templates, all of them
// certifications, and none in health, law or engineering. The distinction the
// badge now carries is the honest one: a track already in the catalog versus an
// exam the visitor configures from the syllabus, which the product does support.
const FEATURED = {
  titleKey: 'cloud',
  ready: true,
  exams: ['AWS SAA-C03', 'AWS DVA-C02', 'Azure AZ-900', 'Azure AZ-104', 'GCP ACE', 'CompTIA Security+', 'CKA', 'CCNA'],
};

const DOMAINS = [
  { titleKey: 'finance', ready: true, exams: ['CPA-10', 'CPA-20', 'CEA', 'CFP', 'CFA', 'FRM'] },
  { titleKey: 'health', ready: false, exams: ['Residência Médica', 'COREN', 'CRM', 'CRO', 'CFF', 'Revalida'] },
  { titleKey: 'law', ready: false, exams: ['OAB 1ª Fase', 'OAB 2ª Fase', 'Magistratura', 'MP', 'Defensoria'] },
  { titleKey: 'engineering', ready: false, exams: ['CREA', 'CONFEA', 'CAU', 'NR-10 / NR-35'] },
] as const;

// Only the chips with a real /simulado/[slug] landing behind them are links — a
// chip promising CFA coverage that lands on a Terraform page is worse than a chip
// that doesn't link anywhere.
const LANDING_SLUG_BY_LABEL: Record<string, string> = {
  'AWS SAA-C03': 'aws-solutions-architect',
  'AWS DVA-C02': 'aws-developer-associate',
  'Azure AZ-900': 'azure-fundamentals',
  'CompTIA Security+': 'comptia-security-plus',
  // No CKA entry: it's a 100% lab/performance exam, incompatible with this product's
  // multiple-choice question format, so no /simulado/kubernetes-cka landing was built —
  // linking the chip anyway would 404.
  CCNA: 'cisco-ccna',
  'CPA-10': 'cpa-10',
  'CPA-20': 'cpa-20',
  CEA: 'cea',
  CFP: 'cfp',
  CFA: 'cfa-level-1',
  FRM: 'frm-part-1',
  'OAB 1ª Fase': 'oab',
};

function ExamChip({ label }: { readonly label: string }) {
  const slug = LANDING_SLUG_BY_LABEL[label];
  const className = 'mono text-xs text-mkt-text opacity-60 px-2 py-0.5 border border-mkt-divider bg-mkt-surface';

  if (slug) {
    return (
      <NextLink
        className={`${className} hover:opacity-100 hover:border-mkt-accent transition-colors`}
        href={`/simulado/${slug}`}
      >
        {label}
      </NextLink>
    );
  }

  return <span className={className}>{label}</span>;
}

export function CertificationsSection() {
  const { t } = useTranslation();
  const coverageLabel = (ready: boolean) => t(ready ? 'homepage.certs.inCatalog' : 'homepage.certs.configurable');

  return (
    <section id="certificacoes" className="scroll-mt-24 py-20 bg-mkt-bg border-t border-mkt-divider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="kick mb-2">{t('homepage.certs.kick')}</span>
        <h2 className="ds-heading text-mkt-text text-3xl mb-3">{t('homepage.certs.title')}</h2>
        <p className="text-mkt-text opacity-60 text-base max-w-2xl mb-12 text-pretty">{t('homepage.certs.subtitle')}</p>

        <div className="blueprint bg-mkt-accent-100 p-6 mb-4">
          <BlueprintCorners />
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="kick mb-1">{t('homepage.certs.featuredProvider')}</span>
              <h3 className="ds-heading text-mkt-text text-2xl">{t(`homepage.certs.domain.${FEATURED.titleKey}`)}</h3>
            </div>
            <span className="mono text-sm text-mkt-accent font-medium shrink-0">{coverageLabel(FEATURED.ready)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {FEATURED.exams.map((exam) => (
              <ExamChip key={exam} label={exam} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-mkt-divider border border-mkt-divider">
          {DOMAINS.map((domain) => (
            <div key={domain.titleKey} className="bg-mkt-bg p-6">
              <div className="flex items-baseline justify-between gap-2 mb-3">
                <h3 className="ds-heading text-mkt-text text-lg">{t(`homepage.certs.domain.${domain.titleKey}`)}</h3>
                <span className="kick shrink-0">{coverageLabel(domain.ready)}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {domain.exams.map((exam) => (
                  <ExamChip key={exam} label={exam} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

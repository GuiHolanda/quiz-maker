'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { BlueprintCorners } from '@/app/(marketing)/components/BlueprintCorners';

const FEATURED = {
  title: 'TI & Cloud',
  tracks: '50+',
  exams: ['AWS SAA-C03', 'AWS DVA-C02', 'Azure AZ-900', 'Azure AZ-104', 'GCP ACE', 'CompTIA Security+', 'CKA', 'CCNA'],
};

const DOMAINS = [
  { title: 'Saúde', tracks: '18+', exams: ['Residência Médica', 'COREN', 'CRM', 'CRO', 'CFF', 'Revalida'] },
  { title: 'Direito & OAB', tracks: '12+', exams: ['OAB 1ª Fase', 'OAB 2ª Fase', 'Magistratura', 'MP', 'Defensoria'] },
  { title: 'Finanças', tracks: '15+', exams: ['CPA-10', 'CPA-20', 'CEA', 'CFP', 'CNPI', 'CFA'] },
  { title: 'Engenharia', tracks: '10+', exams: ['CREA', 'CONFEA', 'CAU', 'NR-10 / NR-35'] },
] as const;

function ExamChip({ label }: { readonly label: string }) {
  return (
    <span className="mono text-xs text-mkt-text opacity-60 px-2 py-0.5 border border-mkt-divider bg-mkt-surface">
      {label}
    </span>
  );
}

export function CertificationsSection() {
  const { t } = useTranslation();

  return (
    <section id="certificacoes" className="scroll-mt-24 py-20 bg-mkt-bg border-t border-mkt-divider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="kick mb-2">{t('homepage.certs.kick')}</span>
        <h2 className="ds-heading text-mkt-text text-3xl mb-3">{t('homepage.certs.title')}</h2>
        <p className="text-mkt-text opacity-60 text-base max-w-2xl mb-12">{t('homepage.certs.subtitle')}</p>

        <div className="blueprint bg-mkt-accent-100 p-6 mb-4">
          <BlueprintCorners />
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="kick mb-1">{t('homepage.certs.featuredProvider')}</span>
              <h3 className="ds-heading text-mkt-text text-2xl">{FEATURED.title}</h3>
            </div>
            <span className="mono text-sm text-mkt-accent font-medium shrink-0">
              {FEATURED.tracks} {t('homepage.certs.tracksLabel')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {FEATURED.exams.map((exam) => (
              <ExamChip key={exam} label={exam} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-mkt-divider border border-mkt-divider">
          {DOMAINS.map((domain) => (
            <div key={domain.title} className="bg-mkt-bg p-6">
              <div className="flex items-baseline justify-between gap-2 mb-3">
                <h3 className="ds-heading text-mkt-text text-lg">{domain.title}</h3>
                <span className="kick shrink-0">{domain.tracks} {t('homepage.certs.tracksLabel')}</span>
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

'use client';

import NextLink from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faCloud,
  faHeartPulse,
  faScaleBalanced,
  faChartLine,
  faGears,
  faWandMagicSparkles,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface Domain {
  readonly icon: IconDefinition;
  readonly title: string;
  readonly tracks: string;
  readonly exams: readonly string[];
}

const FEATURED: Domain = {
  icon: faCloud,
  title: 'TI & Cloud',
  tracks: '50+',
  exams: [
    'AWS SAA-C03',
    'AWS DVA-C02',
    'Azure AZ-900',
    'Azure AZ-104',
    'GCP ACE',
    'CompTIA Security+',
    'CKA (Kubernetes)',
    'Cisco CCNA',
  ],
};

const DOMAINS: readonly Domain[] = [
  {
    icon: faHeartPulse,
    title: 'Saúde',
    tracks: '18+',
    exams: ['Residência Médica', 'COREN', 'CRM', 'CRO', 'CFF', 'Revalida'],
  },
  {
    icon: faScaleBalanced,
    title: 'Direito & OAB',
    tracks: '12+',
    exams: ['OAB 1ª Fase', 'OAB 2ª Fase', 'Magistratura', 'Ministério Público', 'Defensoria'],
  },
  {
    icon: faChartLine,
    title: 'Finanças',
    tracks: '15+',
    exams: ['CPA-10', 'CPA-20', 'CEA', 'CFP', 'CNPI', 'CFA'],
  },
  {
    icon: faGears,
    title: 'Engenharia',
    tracks: '10+',
    exams: ['CREA', 'CONFEA', 'CAU', 'NR-10 / NR-35', 'Eng. de Segurança'],
  },
];

export function CertificationsSection() {
  const { t } = useTranslation();

  return (
    <section id="certificacoes" className="scroll-mt-24 py-20 bg-navy-950 border-t border-navy-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-sora font-bold text-white text-2xl sm:text-3xl text-balance mb-3">
          {t('homepage.certs.title')}
        </h2>
        <p className="text-navy-400 text-base max-w-2xl text-pretty mb-12">{t('homepage.certs.subtitle')}</p>

        {/* Featured domain — wide, exam chips */}
        <NextLink
          href="/register"
          aria-label={FEATURED.title}
          className="block group mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
        >
          <div className="border border-accent/20 rounded-xl p-6 bg-accent/5 hover:bg-accent/10 transition-colors duration-200">
            <div className="grid lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent/10 border border-accent/30 shrink-0">
                    <FontAwesomeIcon className="text-accent text-lg" icon={FEATURED.icon} />
                  </div>
                  <div>
                    <span className="text-xs text-navy-400 block">{t('homepage.certs.featuredProvider')}</span>
                    <h3 className="font-sora font-bold text-white text-xl leading-tight">{FEATURED.title}</h3>
                  </div>
                </div>
                <span className="font-mono text-sm text-accent font-medium">
                  {FEATURED.tracks} {t('homepage.certs.tracksLabel')}
                </span>
              </div>
              <div className="lg:col-span-2">
                <p className="text-xs text-navy-500 font-medium mb-3">{t('homepage.certs.examplesLabel')}</p>
                <div className="flex flex-wrap gap-2">
                  {FEATURED.exams.map((exam) => (
                    <span
                      key={exam}
                      className="font-mono text-xs text-navy-300 px-2.5 py-1 rounded-md border border-navy-700/60 bg-navy-950/60"
                    >
                      {exam}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </NextLink>

        {/* Supporting domains — exam lists */}
        <div className="grid sm:grid-cols-2 gap-4">
          {DOMAINS.map((domain) => (
            <NextLink
              key={domain.title}
              href="/register"
              aria-label={domain.title}
              className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
            >
              <div className="h-full border border-navy-700/60 rounded-xl p-6 bg-navy-900/40 hover:bg-navy-900/70 transition-colors duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 border border-navy-700 group-hover:border-accent/40 rounded-lg flex items-center justify-center transition-colors duration-200 shrink-0">
                      <FontAwesomeIcon
                        className="text-base text-navy-400 group-hover:text-accent transition-colors duration-200"
                        icon={domain.icon}
                      />
                    </div>
                    <h3 className="font-sora font-semibold text-white text-base">{domain.title}</h3>
                  </div>
                  <span className="font-mono text-xs text-navy-500">
                    {domain.tracks} {t('homepage.certs.tracksLabel')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {domain.exams.map((exam) => (
                    <span
                      key={exam}
                      className="font-mono text-xs text-navy-300 px-2 py-0.5 rounded border border-navy-800 bg-navy-950/60"
                    >
                      {exam}
                    </span>
                  ))}
                </div>
              </div>
            </NextLink>
          ))}
        </div>

        {/* Any certification — accent catch-all */}
        <NextLink
          href="/register"
          className="block group mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
        >
          <div className="border border-navy-700/60 rounded-xl p-6 bg-navy-950/40 hover:bg-navy-950/70 transition-colors duration-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent/10 border border-accent/30 shrink-0">
              <FontAwesomeIcon className="text-accent text-lg" icon={faWandMagicSparkles} />
            </div>
            <div className="flex-1">
              <h3 className="font-sora font-bold text-white text-base mb-1">{t('homepage.certs.anyTitle')}</h3>
              <p className="text-sm text-navy-400 leading-relaxed text-pretty">{t('homepage.certs.anyBody')}</p>
            </div>
            <span className="hidden sm:flex items-center gap-2 text-sm font-medium text-accent shrink-0 self-center">
              {t('homepage.certs.anyCta')}
              <FontAwesomeIcon
                className="text-xs group-hover:translate-x-1 transition-transform duration-200"
                icon={faArrowRight}
              />
            </span>
          </div>
        </NextLink>
      </div>
    </section>
  );
}

'use client';

import NextLink from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faCommentDots, faListCheck, faStopwatch } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { DEMO_QUIZ_SIZE } from '@/config/constants';
import type { ExamLandingConfig } from '@/shared/types';
import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';

import { ExamSampleQuestionCard } from './ExamSampleQuestionCard';
import { useDemoCta } from './useDemoCta.hook';

const PROOF_POINTS = [
  { key: 'fresh', icon: faListCheck },
  { key: 'explained', icon: faCommentDots },
  { key: 'diagnosis', icon: faBullseye },
  { key: 'timed', icon: faStopwatch },
] as const;

interface ExamLandingHeroProps {
  readonly config: ExamLandingConfig;
}

export function ExamLandingHero({ config }: ExamLandingHeroProps) {
  const { t } = useTranslation();
  const demoCta = useDemoCta(config);

  return (
    <section className="bg-mkt-bg border-b border-mkt-divider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-10 xl:gap-14 items-start">
          <div>
            <span className="kick">{t('landing.hero.kicker', { name: config.name, fullName: config.fullName })}</span>

            <h1 className="ds-heading text-mkt-text text-4xl sm:text-5xl xl:text-[56px] leading-[1.08] tracking-tight mt-4 text-balance">
              {config.heroHeadline}
            </h1>

            <p className="text-mkt-text opacity-70 text-[17px] leading-relaxed max-w-lg mt-5 text-pretty">
              {config.heroSubheadline}
            </p>

            <div className="flex flex-wrap gap-2.5 mt-7">
              <NextLink
                className="relative inline-flex items-center justify-center text-[15px] font-semibold bg-mkt-accent text-white px-6 py-3.5 hover:opacity-90 transition-opacity"
                href={demoCta.href}
              >
                <BlueprintCorners />
                {demoCta.label}
              </NextLink>

              <a
                className="inline-flex items-center justify-center text-[15px] border border-mkt-divider text-mkt-text px-5 py-3.5 hover:bg-mkt-surface transition-colors"
                href="#edital"
              >
                {t('landing.hero.ctaSecondary')}
              </a>
            </div>

            <p className="mono text-[11.5px] text-mkt-text opacity-50 mt-3.5">{t('landing.hero.ctaDisclaimer')}</p>

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5 mt-8 pt-6 border-t border-mkt-divider">
              {PROOF_POINTS.map((point) => (
                <div key={point.key} className="flex items-center gap-2.5 text-[13.5px] text-mkt-text opacity-70">
                  <FontAwesomeIcon className="text-mkt-accent text-xs shrink-0" icon={point.icon} />
                  <span>{t(`landing.hero.proof.${point.key}`, { count: DEMO_QUIZ_SIZE })}</span>
                </div>
              ))}
            </div>
          </div>

          <ExamSampleQuestionCard config={config} />
        </div>
      </div>
    </section>
  );
}

'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBookOpen,
  faCommentDots,
  faFileLines,
  faFlag,
  faShieldHalved,
  faTags,
} from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';
import { BlueprintFrame } from '@/app/(marketing)/components/shared/BlueprintFrame';

const GUARANTEES = [
  { key: 'syllabus', icon: faBookOpen },
  { key: 'review', icon: faShieldHalved },
  { key: 'explanations', icon: faCommentDots },
  { key: 'tagged', icon: faTags },
  { key: 'report', icon: faFlag },
  { key: 'notOfficial', icon: faFileLines },
] as const;

interface ExamTrustSectionProps {
  readonly config: ExamLandingConfig;
}

export function ExamTrustSection({ config }: ExamTrustSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="scroll-mt-24 bg-mkt-bg pb-16" id="confianca">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BlueprintFrame className="p-7 sm:p-8">
          <div className="grid lg:grid-cols-[.85fr_1.15fr] gap-10">
            <div>
              <span className="kick">{t('landing.trust.kick')}</span>
              <h2 className="ds-heading text-mkt-text text-2xl sm:text-3xl mt-3 text-balance">
                {t('landing.trust.heading', { name: config.name })}
              </h2>
              <p className="text-mkt-text opacity-70 text-[15px] leading-relaxed mt-3 text-pretty">
                {t('landing.trust.subheading')}
              </p>

              <div className="bg-mkt-surface border border-mkt-divider px-4 py-3.5 mt-5">
                <p className="mono text-[11.5px] leading-relaxed text-mkt-text opacity-65">
                  {t('landing.trust.disclaimer')}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-px bg-mkt-divider border border-mkt-divider self-start">
              {GUARANTEES.map((guarantee) => (
                <div key={guarantee.key} className="bg-mkt-bg p-5">
                  <FontAwesomeIcon className="text-mkt-accent-700 text-base" icon={guarantee.icon} />
                  <h3 className="ds-heading text-mkt-text text-[17px] leading-tight mt-2.5">
                    {t(`landing.trust.${guarantee.key}.title`)}
                  </h3>
                  <p className="text-mkt-text opacity-70 text-[13.5px] leading-relaxed mt-1.5 text-pretty">
                    {t(`landing.trust.${guarantee.key}.desc`, { name: config.name })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </BlueprintFrame>
      </div>
    </section>
  );
}

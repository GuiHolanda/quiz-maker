'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullseye,
  faLayerGroup,
  faLightbulb,
  faClipboardList,
  faBrain,
  faInfinity,
} from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';

const FEATURES = [
  { key: 'topics', icon: faBullseye },
  { key: 'difficulty', icon: faLayerGroup },
  { key: 'explanations', icon: faLightbulb },
  { key: 'simulados', icon: faClipboardList },
  { key: 'weakPoints', icon: faBrain },
  { key: 'infinite', icon: faInfinity },
] as const;

interface ExamFeaturesSectionProps {
  readonly config: ExamLandingConfig;
}

export function ExamFeaturesSection({ config }: ExamFeaturesSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-mkt-bg border-t border-mkt-divider py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
        <div className="max-w-2xl">
          <span className="kick mb-2">{t('landing.features.kick')}</span>
          <h2 className="ds-heading text-mkt-text text-3xl mt-1 mb-3">
            {t('landing.features.heading', { name: config.name })}
          </h2>
          <p className="text-mkt-text opacity-60 text-base leading-relaxed">{t('landing.features.subheading')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-mkt-divider border border-mkt-divider">
          {FEATURES.map((feature) => (
            <div key={feature.key} className="bg-mkt-bg p-7 flex flex-col gap-4">
              <div className="w-10 h-10 bg-mkt-accent-100 border border-mkt-accent flex items-center justify-center">
                <FontAwesomeIcon className="text-mkt-accent text-sm" icon={feature.icon} />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="ds-heading text-mkt-text text-lg">{t(`landing.features.${feature.key}.title`)}</h3>
                <p className="text-mkt-text opacity-55 text-sm leading-relaxed">
                  {t(`landing.features.${feature.key}.desc`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

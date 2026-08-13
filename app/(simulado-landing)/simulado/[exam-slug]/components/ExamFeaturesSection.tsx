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
    <section data-theme="dark" className="bg-background py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
        <div className="max-w-2xl mx-auto text-center flex flex-col gap-4">
          <h2 className="font-playfair font-extrabold text-white text-2xl sm:text-3xl lg:text-4xl">
            {t('landing.features.heading', { name: config.name })}
          </h2>
          <p className="text-default-400 text-base sm:text-lg leading-relaxed">
            {t('landing.features.subheading')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.key}
              className="flex flex-col gap-4 bg-content1 border border-divider rounded-2xl p-6"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <FontAwesomeIcon className="text-primary text-sm" icon={feature.icon} />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-foreground text-base">
                  {t(`landing.features.${feature.key}.title`)}
                </h3>
                <p className="text-default-500 text-sm leading-relaxed">
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

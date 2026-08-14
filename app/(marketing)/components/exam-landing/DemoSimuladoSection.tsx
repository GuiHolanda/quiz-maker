'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';
import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';
import { DemoQuizFlow } from './DemoQuizFlow';

interface DemoSimuladoSectionProps {
  readonly config: ExamLandingConfig;
}

export function DemoSimuladoSection({ config }: DemoSimuladoSectionProps) {
  const { t } = useTranslation();

  return (
    <section id="demo-simulado" className="scroll-mt-24 py-20 bg-mkt-bg border-t border-mkt-divider">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="kick mb-2">{t('landing.demo.kick')}</span>
          <h2 className="ds-heading text-mkt-text text-3xl mt-1">{t('landing.demo.sectionHeading')}</h2>
          <p className="text-mkt-text opacity-60 text-sm mt-3 max-w-md mx-auto">
            {t('landing.demo.sectionSubheading', { name: config.name })}
          </p>
        </div>

        <div className="blueprint bg-mkt-bg overflow-visible p-6 sm:p-8">
          <BlueprintCorners />
          <DemoQuizFlow config={config} />
        </div>
      </div>
    </section>
  );
}

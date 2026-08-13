'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';
import { DemoQuizFlow } from './DemoQuizFlow';

interface DemoSimuladoSectionProps {
  readonly config: ExamLandingConfig;
}

export function DemoSimuladoSection({ config }: DemoSimuladoSectionProps) {
  const { t } = useTranslation();

  return (
    <section data-theme="dark" id="demo-simulado" className="scroll-mt-20 py-16 bg-content2 border-y border-divider">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="font-playfair font-bold text-foreground text-2xl sm:text-3xl">
            {t('landing.demo.sectionHeading')}
          </h2>
          <p className="text-default-500 text-sm mt-3 max-w-md mx-auto">
            {t('landing.demo.sectionSubheading', { name: config.name })}
          </p>
        </div>

        <div className="bg-content1 border border-divider rounded-xl p-6 sm:p-8">
          <DemoQuizFlow config={config} />
        </div>
      </div>
    </section>
  );
}

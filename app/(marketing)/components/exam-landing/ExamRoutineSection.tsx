'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';

const STEPS = ['daily', 'explained', 'reinforce'] as const;

interface ExamRoutineSectionProps {
  readonly config: ExamLandingConfig;
}

export function ExamRoutineSection({ config }: ExamRoutineSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="scroll-mt-24 bg-mkt-bg border-t border-mkt-divider py-16" id="rotina">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="ds-heading text-mkt-text text-3xl sm:text-4xl text-balance">
          {t('landing.routine.heading', { name: config.name })}
        </h2>

        <div className="grid sm:grid-cols-3 gap-px bg-mkt-divider border border-mkt-divider mt-7">
          {STEPS.map((step, index) => (
            <div key={step} className="bg-mkt-bg px-6 py-7">
              <span className="mono text-xs text-mkt-accent-700">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="ds-heading text-mkt-text text-xl mt-2">{t(`landing.routine.${step}.title`)}</h3>
              <p className="text-mkt-text opacity-70 text-sm leading-relaxed mt-2.5 text-pretty">
                {t(`landing.routine.${step}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

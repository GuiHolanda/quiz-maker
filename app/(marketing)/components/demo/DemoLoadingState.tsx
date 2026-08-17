'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DemoCatalogExam } from '@/shared/types';
import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';

interface DemoLoadingStateProps {
  readonly exam: DemoCatalogExam;
  readonly onDone: () => void;
}

const STEP_TIMINGS_MS = [700, 1300, 1900] as const;
const DONE_MS = 2500;

export function DemoLoadingState({ exam, onDone }: DemoLoadingStateProps) {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    STEP_TIMINGS_MS.forEach((ms, i) => {
      timers.push(setTimeout(() => setActiveStep(i + 1), ms));
    });
    timers.push(setTimeout(onDone, DONE_MS));

    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  const steps = [t('demo.loading.step1'), t('demo.loading.step2'), t('demo.loading.step3'), t('demo.loading.step4')];

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="relative border border-mkt-divider p-10 w-full max-w-lg">
        <BlueprintCorners />

        <span className="kick">{t('demo.loading.kick')}</span>
        <h2 className="ds-heading text-mkt-text text-2xl mt-2">{exam.name}</h2>

        {/* Sweep progress bar */}
        <div className="mt-6 h-1 bg-mkt-divider overflow-hidden">
          <div
            className="h-full"
            style={{
              backgroundImage: 'linear-gradient(90deg, transparent 0%, var(--color-accent) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'sweep 1.1s linear infinite',
            }}
          />
        </div>

        {/* Step list */}
        <div className="mt-8 space-y-3">
          {steps.map((label, i) => {
            const isDone = i < activeStep;
            const isActive = i === activeStep;
            return (
              <div
                key={label}
                className={`flex items-center gap-3 transition-opacity duration-300 ${
                  isDone || isActive ? 'opacity-100' : 'opacity-25'
                }`}
              >
                <span className="mono text-xs w-4 text-mkt-accent flex-shrink-0">
                  {isDone ? '✓' : isActive ? '▸' : '·'}
                </span>
                <span className={`text-sm text-mkt-text ${isDone ? 'opacity-50' : ''}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

'use client';

import NextLink from 'next/link';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';
import { BlueprintFrame } from '@/app/(marketing)/components/shared/BlueprintFrame';
import { demoHrefForSlug } from '@/config/demo-links';

import {
  SIMULADO_PROGRESS_PERCENT,
  formatExamDuration,
  formatRemainingClock,
  simuladoRows,
} from './examLandingMetrics';

const BREAKDOWN_ROWS = 4;

interface ExamSimuladoSectionProps {
  readonly config: ExamLandingConfig;
}

export function ExamSimuladoSection({ config }: ExamSimuladoSectionProps) {
  const { t } = useTranslation();
  const rows = simuladoRows(config, BREAKDOWN_ROWS);

  return (
    <section className="scroll-mt-24 bg-mkt-accent-900 py-16" id="simulado">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-11 items-center">
          <div>
            <span className="mono text-[11px] uppercase tracking-[0.1em] text-mkt-accent-300">
              {t('landing.simulado.kick', { name: config.name })}
            </span>

            <h2 className="ds-heading text-mkt-bg text-3xl sm:text-4xl mt-3.5 text-balance">
              {t('landing.simulado.heading', {
                total: config.totalQuestions,
                duration: formatExamDuration(config.examDurationMinutes),
              })}
            </h2>

            <p className="text-mkt-accent-200 text-base leading-relaxed mt-3.5 text-pretty">
              {t('landing.simulado.subheading')}
            </p>

            <NextLink
              className="inline-flex items-center justify-center text-[15px] font-semibold bg-mkt-bg text-mkt-accent-900 px-6 py-3.5 mt-6 hover:opacity-90 transition-opacity"
              href={demoHrefForSlug(config.slug)}
            >
              {t('landing.simulado.cta', { name: config.name })}
            </NextLink>
          </div>

          <BlueprintFrame dark className="border-mkt-bg/30 p-5">
            <div className="mono flex items-center justify-between text-xs text-mkt-accent-200">
              <span>{t('landing.simulado.panelLabel', { name: config.name })}</span>
              <span className="text-mkt-bg">{formatRemainingClock(config.examDurationMinutes)}</span>
            </div>

            <div className="h-1 bg-mkt-bg/20 mt-3">
              <div className="h-1 bg-mkt-accent-300" style={{ width: `${SIMULADO_PROGRESS_PERCENT}%` }} />
            </div>

            <div className="flex flex-col gap-2.5 mt-5 text-sm">
              {rows.map((row) => (
                <div key={row.name} className="flex items-baseline justify-between gap-3.5">
                  <span className="text-mkt-accent-200">{row.name}</span>
                  <span className="mono text-mkt-bg shrink-0">{row.questionCount}</span>
                </div>
              ))}
            </div>
          </BlueprintFrame>
        </div>
      </div>
    </section>
  );
}

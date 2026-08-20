'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Spinner } from '@heroui/spinner';

import type { AutoConfigStage } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface SeedProgressCardProps {
  readonly variant: 'auto-config' | 'edital';
  readonly stage: AutoConfigStage | null;
  readonly elapsedLabel: string;
}

const STAGE_ORDER: readonly AutoConfigStage[] = ['research', 'review', 'format'];

// Shared with SeedLoadingScreen for the extraction log's stage-transition lines.
export const STAGE_HEADLINE_KEYS: Record<AutoConfigStage, string> = {
  research: 'exam.aiSeedStageResearch',
  review: 'exam.aiSeedStageReview',
  format: 'exam.aiSeedStageFormat',
};

const STAGE_ROW_KEYS: Record<AutoConfigStage, string> = {
  research: 'exam.loadingTaskResearch',
  review: 'exam.loadingTaskReview',
  format: 'exam.loadingTaskFormat',
};

type StageRowStatus = 'done' | 'active' | 'queued';

const STATUS_META_KEYS: Record<StageRowStatus, string> = {
  done: 'exam.loadingTaskDone',
  active: 'exam.loadingTaskActive',
  queued: 'exam.loadingTaskQueued',
};

// Auto-config has 3 real stages tracked server-side (stage: research|review|format, polled
// over SSE) — the fraction/bar/row list reflect exactly that, nothing simulated. Edital
// extraction is a single opaque HTTP call with no substeps, so it only shows elapsed time
// and an indeterminate bar.
export function SeedProgressCard({ variant, stage, elapsedLabel }: SeedProgressCardProps) {
  const { t } = useTranslation();
  const currentIndex = stage ? STAGE_ORDER.indexOf(stage) : -1;
  const headline = stage ? t(STAGE_HEADLINE_KEYS[stage]) : t('exam.loadingQueued');
  const stageNumber = stage ? currentIndex + 1 : 0;
  const completedPct = stage ? (currentIndex / STAGE_ORDER.length) * 100 : 0;

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-default-400">
            {t('exam.loadingProgressTitle')}
          </div>
          <div className="text-lg font-bold mt-2">{headline}</div>
        </div>
        <div className="text-right shrink-0">
          {variant === 'auto-config' && (
            <div className="font-mono text-2xl font-medium text-primary">{stageNumber}/3</div>
          )}
          <div className="font-mono text-[11px] text-default-400 mt-0.5">{elapsedLabel}</div>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-content2 mt-4 overflow-hidden flex">
        {variant === 'auto-config' ? (
          <>
            <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${completedPct}%` }} />
            <div className="w-1/3 h-full overflow-hidden">
              <div className="w-1/3 h-full bg-primary/40 step-sweep" />
            </div>
          </>
        ) : (
          <div className="w-full h-full overflow-hidden">
            <div className="w-1/3 h-full bg-primary step-sweep" />
          </div>
        )}
      </div>

      {variant === 'auto-config' && (
        <div className="mt-5 flex flex-col">
          {STAGE_ORDER.map((s, i) => {
            const status: StageRowStatus = i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'queued';

            return (
              <div
                key={s}
                className={`grid grid-cols-[22px_1fr_auto] gap-3 items-center py-3 border-t border-default-200 ${status === 'queued' ? 'opacity-50' : ''}`}
              >
                <div className="w-[22px] h-[22px] flex items-center justify-center">
                  {status === 'done' && (
                    <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center">
                      <FontAwesomeIcon className="w-3 h-3 text-success" icon={faCheck} />
                    </div>
                  )}
                  {status === 'active' && <Spinner size="sm" />}
                  {status === 'queued' && <div className="w-[7px] h-[7px] rounded-full bg-default-200" />}
                </div>
                <div
                  className={`text-sm ${status === 'queued' ? 'text-default-500' : 'font-semibold text-foreground'}`}
                >
                  {t(STAGE_ROW_KEYS[s])}
                </div>
                <div
                  className={`font-mono text-[11px] ${status === 'done' ? 'text-success' : status === 'active' ? 'text-primary' : 'text-default-400'}`}
                >
                  {t(STATUS_META_KEYS[status])}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

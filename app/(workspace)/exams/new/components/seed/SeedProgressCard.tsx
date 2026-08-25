'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Spinner } from '@heroui/spinner';

import type { AutoConfigStage, ExamType } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

// certification keeps its original 3-stage pipeline (research/review/format). public_exam now
// has two possible pipelines behind the scenes (PDF extraction vs. text research fallback —
// see runAutoConfigJob), so its 4 steps are described at a level that stays true for either:
// "locate" (find the PDF), "read" (extract or, on fallback, research), "finalize" (review +
// format). This keeps the stepper at a stable 4 rows without exposing which branch ran.
export type SeedStep = 'identify' | 'locate' | 'research' | 'review' | 'format' | 'read' | 'finalize';

const STEP_ORDER_BY_TYPE: Record<ExamType, readonly SeedStep[]> = {
  certification: ['identify', 'research', 'review', 'format'],
  public_exam: ['identify', 'locate', 'read', 'finalize'],
};

export const STEP_HEADLINE_KEYS: Record<SeedStep, string> = {
  identify: 'exam.loadingStageIdentify',
  locate: 'exam.loadingStageLocate',
  research: 'exam.aiSeedStageResearch',
  review: 'exam.aiSeedStageReview',
  format: 'exam.aiSeedStageFormat',
  read: 'exam.loadingStageRead',
  finalize: 'exam.loadingStageFinalize',
};

const STEP_ROW_KEYS: Record<SeedStep, string> = {
  identify: 'exam.loadingTaskIdentify',
  locate: 'exam.loadingTaskLocate',
  research: 'exam.loadingTaskResearch',
  review: 'exam.loadingTaskReview',
  format: 'exam.loadingTaskFormat',
  read: 'exam.loadingTaskRead',
  finalize: 'exam.loadingTaskFinalize',
};

type StepRowStatus = 'done' | 'active' | 'awaiting' | 'queued';

const STATUS_META_KEYS: Record<StepRowStatus, string> = {
  done: 'exam.loadingTaskDone',
  active: 'exam.loadingTaskActive',
  awaiting: 'exam.loadingTaskAwaiting',
  queued: 'exam.loadingTaskQueued',
};

const STATUS_META_COLORS: Record<StepRowStatus, string> = {
  done: 'text-success',
  active: 'text-primary',
  awaiting: 'text-primary',
  queued: 'text-default-400',
};

// certification's AutoConfigStage values line up 1:1 with SeedStep names, so stage flows
// through unchanged. public_exam's two stage-producing branches collapse into the same two
// steps: 'extract' (PDF branch) and 'research' (text fallback) both read as "read"; 'review'
// and 'format' — only ever emitted by the text fallback, since the PDF branch skips them
// entirely — both read as "finalize". Before the job's first progress event (stage: null),
// "locate" already finished as its own pre-job phase (see useExamSeed's 'locating-edital'
// state), so the first pipeline step to show as active is "read", not "locate" again.
export function stepFromStage(stage: AutoConfigStage | null, type: ExamType): SeedStep {
  // 'extract' never reaches this branch in practice (certification never runs the PDF
  // branch) — the cast just tells TS what runAutoConfigJob already guarantees at runtime.
  if (type === 'certification') return (stage ?? 'identify') as SeedStep;
  if (stage === 'review' || stage === 'format') return 'finalize';
  return 'read';
}

interface SeedProgressCardProps {
  readonly type: ExamType;
  readonly variant: 'auto-config' | 'edital';
  readonly step: SeedStep;
  readonly isAwaitingUser?: boolean;
  readonly elapsedLabel: string;
}

export function SeedProgressCard({ type, variant, step, isAwaitingUser = false, elapsedLabel }: SeedProgressCardProps) {
  const { t } = useTranslation();
  const stepOrder = STEP_ORDER_BY_TYPE[type];
  const currentIndex = stepOrder.indexOf(step);
  const completedPct = (currentIndex / stepOrder.length) * 100;

  return (
    <div className="bg-content1 border border-content2 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-default-500">{t('exam.loadingProgressTitle')}</div>
          <div className="text-lg font-bold mt-2">
            {t(isAwaitingUser ? STEP_ROW_KEYS[step] : STEP_HEADLINE_KEYS[step])}
          </div>
        </div>
        <div className="text-right shrink-0">
          {variant === 'auto-config' && (
            <div className="font-mono text-2xl font-medium text-primary">
              {currentIndex + 1}/{stepOrder.length}
            </div>
          )}
          <div className="font-mono text-[11px] text-default-400 mt-0.5">{elapsedLabel}</div>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-content2 mt-4 overflow-hidden flex">
        {variant === 'auto-config' ? (
          <>
            <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${completedPct}%` }} />
            <div className="w-1/4 h-full overflow-hidden">
              {isAwaitingUser ? null : <div className="w-1/3 h-full bg-primary/40 step-sweep" />}
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
          {stepOrder.map((rowStep, i) => {
            const status: StepRowStatus =
              i < currentIndex ? 'done' : i > currentIndex ? 'queued' : isAwaitingUser ? 'awaiting' : 'active';

            return (
              <div
                key={rowStep}
                className={`grid grid-cols-[22px_1fr_auto] gap-3 items-center py-3 border-t border-default-200 ${status === 'queued' ? 'opacity-50' : ''}`}
              >
                <div className="w-[22px] h-[22px] flex items-center justify-center">
                  {status === 'done' && (
                    <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center">
                      <FontAwesomeIcon className="w-3 h-3 text-success" icon={faCheck} />
                    </div>
                  )}
                  {status === 'active' && <Spinner size="sm" />}
                  {status === 'awaiting' && <div className="w-[7px] h-[7px] rounded-full bg-primary" />}
                  {status === 'queued' && <div className="w-[7px] h-[7px] rounded-full bg-default-200" />}
                </div>
                <div
                  className={`text-sm ${status === 'queued' ? 'text-default-500' : 'font-semibold text-foreground'}`}
                >
                  {t(STEP_ROW_KEYS[rowStep])}
                </div>
                <div className={`font-mono text-[11px] ${STATUS_META_COLORS[status]}`}>
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

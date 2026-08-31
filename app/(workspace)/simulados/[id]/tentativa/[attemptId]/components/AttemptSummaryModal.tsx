'use client';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightFromBracket, faFlag, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';

interface AttemptSummary {
  readonly answered: number;
  readonly skipped: number;
  readonly open: number;
  readonly remainingLabel: string | null;
}

interface AttemptSummaryModalProps {
  readonly variant: 'finish' | 'exit';
  readonly isOpen: boolean;
  readonly isBusy?: boolean;
  readonly summary: AttemptSummary;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
  readonly onDiscard?: () => void;
}

export function AttemptSummaryModal({
  variant,
  isOpen,
  isBusy,
  summary,
  onConfirm,
  onClose,
  onDiscard,
}: AttemptSummaryModalProps) {
  const { t } = useTranslation();
  const isFinish = variant === 'finish';
  const icon: IconDefinition = isFinish ? faFlag : faArrowRightFromBracket;

  const rows: { label: string; value: string; highlight?: boolean }[] = [
    { label: t('simulado.attempt.summaryAnswered'), value: `${summary.answered}` },
    { label: t('simulado.attempt.summarySkipped'), value: `${summary.skipped}` },
    { label: t('simulado.attempt.summaryOpen'), value: `${summary.open}`, highlight: summary.open > 0 },
  ];
  if (summary.remainingLabel) {
    rows.push({ label: t('simulado.attempt.summaryRemaining'), value: summary.remainingLabel });
  }

  const showPendingWarning = isFinish && summary.open > 0;
  const pendingWarning =
    summary.open === 1
      ? t('simulado.attempt.pendingWarningOne')
      : t('simulado.attempt.pendingWarningMany', { count: summary.open });

  const body = (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <FontAwesomeIcon icon={icon} />
        </span>
        <p className="text-sm leading-relaxed text-default-500 text-pretty">
          {isFinish ? t('simulado.attempt.finishBody') : t('simulado.attempt.exitBody')}
        </p>
      </div>

      <div className="divide-y divide-divider rounded-lg border border-divider px-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
            <span className="text-[13px] text-default-500">{row.label}</span>
            <span className={`font-mono text-sm ${row.highlight ? 'text-primary' : 'text-foreground'}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {showPendingWarning && (
        <div className="flex items-start gap-2.5 rounded-lg border border-primary/30 bg-primary/[0.08] p-3.5">
          <FontAwesomeIcon className="mt-0.5 shrink-0 text-xs text-primary" icon={faTriangleExclamation} />
          <span className="text-[13px] leading-snug text-foreground text-pretty">{pendingWarning}</span>
        </div>
      )}

      {!isFinish && onDiscard && (
        <Button
          className={`${buttonStyles.dangerFlat} w-full`}
          data-testid="attempt-discard-link"
          size="sm"
          onPress={onDiscard}
        >
          {t('simulado.attempt.discardLink')}
        </Button>
      )}
    </div>
  );

  return (
    <ConfirmModal
      body={body}
      cancelLabel={isFinish ? t('simulado.attempt.backToQuestions') : t('common.back')}
      confirmLabel={isFinish ? t('simulado.attempt.finishConfirm') : t('simulado.attempt.exitConfirm')}
      confirmTestId={isFinish ? 'confirm-finish-attempt-btn' : undefined}
      confirmVariant="primary"
      isLoading={isBusy}
      isOpen={isOpen}
      size="md"
      title={isFinish ? t('simulado.attempt.finishTitle') : t('simulado.attempt.exitTitle')}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

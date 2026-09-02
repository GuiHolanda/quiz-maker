'use client';

import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartColumn, faCopy, faPlay, faRotateRight, faTrash } from '@fortawesome/free-solid-svg-icons';

import { fmtTempo, UnifiedSimulado } from './normalizeSimulado';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import { scoreToneText } from '@/shared/lib/scoreTone';
import { buttonStyles } from '@/config/constants/buttonStyles';

export const SIMULADO_GRID_COLUMNS = 'minmax(220px,1.7fr) 90px 90px 140px 120px 100px 120px 130px 116px';

const ROW_GRID_CLASS = 'grid items-center gap-4 px-5 py-3.5';

const STATUS_COLOR = {
  answered: 'success',
  in_progress: 'warning',
  pending: 'default',
} as const;

interface SimuladoRowProps {
  readonly simulado: UnifiedSimulado;
  readonly isStarting: boolean;
  readonly onStart: (s: UnifiedSimulado) => void;
  readonly onViewResult: (s: UnifiedSimulado) => void;
  readonly onDuplicate: (s: UnifiedSimulado) => void;
  readonly onDelete: (s: UnifiedSimulado) => void;
  readonly onOpenHistory: (s: UnifiedSimulado) => void;
}

export function SimuladoRow({
  simulado: s,
  isStarting,
  onStart,
  onViewResult,
  onDuplicate,
  onDelete,
  onOpenHistory,
}: SimuladoRowProps) {
  const { t } = useTranslation();

  if (isStarting) {
    return (
      <div
        className="border-t border-divider"
        data-simulado-name={s.name ?? s.sourceLabel}
        data-testid="simulado-row"
        role="row"
      >
        <div className="flex flex-col gap-2 px-5 py-3.5" role="cell">
          <p className="text-xs font-medium text-primary">{t('simulado.preparingAttempt')}</p>
          <Progress isIndeterminate aria-label={t('simulado.preparingAttempt')} color="primary" size="sm" />
        </div>
      </div>
    );
  }

  const bestPercent =
    s.bestScore != null && s.totalQuestions > 0 ? Math.round((s.bestScore / s.totalQuestions) * 100) : null;
  const scoreMeta = resolveScoreMeta();

  return (
    <div
      className={`${ROW_GRID_CLASS} border-t border-divider transition-colors duration-150 hover:bg-background`}
      data-simulado-name={s.name ?? s.sourceLabel}
      data-testid="simulado-row"
      role="row"
      style={{ gridTemplateColumns: SIMULADO_GRID_COLUMNS }}
    >
      <div className="min-w-0" role="cell">
        <p className="truncate text-sm font-semibold text-foreground">{s.name ?? s.sourceLabel}</p>
        <p className="truncate text-xs text-default-500">{s.sourceLabel}</p>
      </div>

      <div className="text-center font-mono text-sm text-foreground" role="cell">
        {s.totalQuestions}
      </div>

      <div className="text-center font-mono text-sm text-foreground" role="cell">
        {s.durationMinutes == null ? t('simulado.table.timeFree') : fmtTempo(s.durationMinutes)}
      </div>

      <div role="cell">
        <Chip color={STATUS_COLOR[s.status]} size="sm" variant="flat">
          {statusLabel()}
        </Chip>
      </div>

      <div className="flex flex-col items-center gap-0.5" role="cell">
        <span className={`font-mono text-sm ${bestPercent == null ? 'text-default-400' : scoreToneText(bestPercent)}`}>
          {bestPercent == null ? '—' : `${bestPercent}%`}
        </span>
        {scoreMeta != null && <span className="text-[11px] text-default-400">{scoreMeta}</span>}
      </div>

      <div className="flex justify-center" role="cell">
        <Button
          aria-label={t('simulado.table.attemptsAria', { count: s.attemptCount })}
          className={`${buttonStyles.flat} font-mono`}
          data-testid="simulado-attempts-btn"
          size="sm"
          onPress={() => onOpenHistory(s)}
        >
          {s.attemptCount}
        </Button>
      </div>

      <div className="text-xs text-default-500" role="cell">
        <RelativeDate date={s.createdAt} />
      </div>

      <div className="text-xs text-default-500" role="cell">
        {s.lastFinishedAt ? <RelativeDate date={s.lastFinishedAt} /> : '—'}
      </div>

      <div className="flex justify-end gap-1" role="cell">
        {renderActions()}
      </div>
    </div>
  );

  function statusLabel(): string {
    if (s.status === 'answered') return t('simulado.statusAnswered');
    if (s.status === 'in_progress') return t('simulado.statusInProgress');

    return t('simulado.statusPending');
  }

  function resolveScoreMeta(): string | null {
    if (bestPercent == null) return t('simulado.table.noScore');
    if (s.durationMinutes == null || s.passingScorePercent == null) return null;

    return bestPercent >= s.passingScorePercent ? t('simulado.table.approved') : t('simulado.table.belowCut');
  }

  function renderActions() {
    const duplicateButton = (
      <Button
        isIconOnly
        aria-label={t('simulado.table.actionDuplicate')}
        className={buttonStyles.iconOnly.neutral}
        data-testid="simulado-duplicate-btn"
        size="sm"
        title={t('simulado.table.actionDuplicate')}
        variant="light"
        onPress={() => onDuplicate(s)}
      >
        <FontAwesomeIcon icon={faCopy} />
      </Button>
    );

    const deleteButton = (
      <Button
        isIconOnly
        aria-label={t('simulado.table.actionDelete')}
        className={buttonStyles.iconOnly.danger}
        data-testid="simulado-delete-btn"
        size="sm"
        title={t('simulado.table.actionDelete')}
        variant="light"
        onPress={() => onDelete(s)}
      >
        <FontAwesomeIcon icon={faTrash} />
      </Button>
    );

    if (s.status === 'answered') {
      return (
        <>
          <Button
            isIconOnly
            aria-label={t('simulado.table.actionViewResult')}
            className={buttonStyles.iconOnly.neutral}
            data-testid="simulado-view-result-btn"
            size="sm"
            title={t('simulado.table.actionViewResult')}
            variant="light"
            onPress={() => onViewResult(s)}
          >
            <FontAwesomeIcon icon={faChartColumn} />
          </Button>
          <Button
            isIconOnly
            aria-label={t('simulado.table.actionRetake')}
            className={buttonStyles.iconOnly.neutral}
            data-testid="simulado-start-btn"
            size="sm"
            title={t('simulado.table.actionRetake')}
            variant="light"
            onPress={() => onStart(s)}
          >
            <FontAwesomeIcon icon={faRotateRight} />
          </Button>
          {duplicateButton}
          {deleteButton}
        </>
      );
    }

    const startLabel =
      s.status === 'in_progress' ? t('simulado.table.actionContinue') : t('simulado.table.actionStart');

    return (
      <>
        <Button
          isIconOnly
          aria-label={startLabel}
          className={buttonStyles.iconOnly.neutral}
          data-testid="simulado-start-btn"
          size="sm"
          title={startLabel}
          variant="light"
          onPress={() => onStart(s)}
        >
          <FontAwesomeIcon icon={faPlay} />
        </Button>
        {duplicateButton}
        {deleteButton}
      </>
    );
  }
}

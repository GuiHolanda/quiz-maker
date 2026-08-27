'use client';

import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartColumn, faCopy, faPlay, faRotateRight, faTrash } from '@fortawesome/free-solid-svg-icons';

import { fmtTempo, UnifiedSimulado } from './normalizeSimulado';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface SimuladosTableProps {
  readonly rows: UnifiedSimulado[];
  readonly startingKey: string | null;
  readonly onStart: (s: UnifiedSimulado) => void;
  readonly onViewResult: (s: UnifiedSimulado) => void;
  readonly onDuplicate: (s: UnifiedSimulado) => void;
  readonly onDelete: (s: UnifiedSimulado) => void;
  readonly onOpenHistory: (s: UnifiedSimulado) => void;
}

const GRID_COLUMNS = 'minmax(220px,1.7fr) 90px 90px 140px 120px 100px 120px 130px 116px';

const STATUS_COLOR = {
  answered: 'success',
  in_progress: 'warning',
  pending: 'default',
} as const;

export function SimuladosTable({
  rows,
  startingKey,
  onStart,
  onViewResult,
  onDuplicate,
  onDelete,
  onOpenHistory,
}: SimuladosTableProps) {
  const { t } = useTranslation();

  const statusLabel = {
    answered: t('simulado.statusAnswered'),
    in_progress: t('simulado.statusInProgress'),
    pending: t('simulado.statusPending'),
  };

  return (
    <div className="overflow-x-auto rounded-xl bg-content1">
      <div
        className="grid min-w-[1220px] items-center gap-4 bg-content2 px-5 py-3 text-xs font-semibold text-default-500"
        style={{ gridTemplateColumns: GRID_COLUMNS }}
      >
        <span>{t('simulado.table.colSimulado')}</span>
        <span className="text-center">{t('simulado.table.colQuestions')}</span>
        <span className="text-center">{t('simulado.table.colTime')}</span>
        <span>{t('simulado.table.colStatus')}</span>
        <span className="text-center">{t('simulado.table.colBestScore')}</span>
        <span className="text-center">{t('simulado.table.colAttempts')}</span>
        <span>{t('simulado.table.colCreated')}</span>
        <span>{t('simulado.table.colLastAttempt')}</span>
        <span className="text-right">{t('simulado.table.colActions')}</span>
      </div>

      {rows.length === 0 ? (
        <div className="border-t border-divider px-5 py-10 text-center text-sm text-default-400">
          {t('simulado.table.empty')}
        </div>
      ) : (
        rows.map((s) => (startingKey === s.key ? renderStartingRow(s) : renderRow(s)))
      )}
    </div>
  );

  function renderStartingRow(s: UnifiedSimulado) {
    return (
      <div key={s.key} className="min-w-[1220px] border-t border-divider px-5 py-3.5">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-primary">{t('simulado.preparingAttempt')}</p>
          <Progress isIndeterminate aria-label={t('simulado.preparingAttempt')} color="primary" size="sm" />
        </div>
      </div>
    );
  }

  function renderRow(s: UnifiedSimulado) {
    const bestPercent =
      s.bestScore != null && s.totalQuestions > 0 ? Math.round((s.bestScore / s.totalQuestions) * 100) : null;
    const scoreMeta = resolveScoreMeta(s, bestPercent);

    return (
      <div
        key={s.key}
        className="grid min-w-[1220px] items-center gap-4 border-t border-divider px-5 py-3.5 transition-colors duration-150 hover:bg-background"
        data-testid="simulado-row"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{s.name ?? s.sourceLabel}</p>
          <p className="truncate text-xs text-default-500">{s.sourceLabel}</p>
        </div>

        <div className="text-center font-mono text-sm text-foreground">{s.totalQuestions}</div>

        <div className="text-center font-mono text-sm text-foreground">
          {s.durationMinutes == null ? t('simulado.table.timeFree') : fmtTempo(s.durationMinutes)}
        </div>

        <div>
          <Chip color={STATUS_COLOR[s.status]} size="sm" variant="flat">
            {statusLabel[s.status]}
          </Chip>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span
            className={`font-mono text-sm ${
              bestPercent == null ? 'text-default-400' : bestPercent >= 70 ? 'text-success' : 'text-danger'
            }`}
          >
            {bestPercent == null ? '—' : `${bestPercent}%`}
          </span>
          {scoreMeta != null && <span className="text-[11px] text-default-400">{scoreMeta}</span>}
        </div>

        <div className="text-center">
          <Button
            className="font-mono"
            data-testid="simulado-attempts-btn"
            size="sm"
            variant="light"
            onPress={() => onOpenHistory(s)}
          >
            {s.attemptCount}
          </Button>
        </div>

        <div className="text-xs text-default-500">
          <RelativeDate date={s.createdAt} />
        </div>

        <div className="text-xs text-default-500">
          {s.lastFinishedAt ? <RelativeDate date={s.lastFinishedAt} /> : '—'}
        </div>

        <div className="flex justify-end gap-1">{renderActions(s)}</div>
      </div>
    );
  }

  function resolveScoreMeta(s: UnifiedSimulado, bestPercent: number | null): string | null {
    if (bestPercent == null) return t('simulado.table.noScore');
    if (s.passingScorePercent == null) return null;

    return bestPercent >= s.passingScorePercent ? t('simulado.table.approved') : t('simulado.table.belowCut');
  }

  function renderActions(s: UnifiedSimulado) {
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

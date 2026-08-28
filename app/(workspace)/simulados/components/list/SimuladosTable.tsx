'use client';

import { SimuladoRow, SIMULADO_GRID_COLUMNS } from './SimuladoRow';
import { UnifiedSimulado } from './normalizeSimulado';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface SimuladosTableProps {
  readonly rows: UnifiedSimulado[];
  readonly startingKey: string | null;
  readonly onStart: (s: UnifiedSimulado) => void;
  readonly onViewResult: (s: UnifiedSimulado) => void;
  readonly onDuplicate: (s: UnifiedSimulado) => void;
  readonly onDelete: (s: UnifiedSimulado) => void;
  readonly onOpenHistory: (s: UnifiedSimulado) => void;
}

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

  const columnHeaders = [
    { label: t('simulado.table.colSimulado'), align: '' },
    { label: t('simulado.table.colQuestions'), align: 'text-center' },
    { label: t('simulado.table.colTime'), align: 'text-center' },
    { label: t('simulado.table.colStatus'), align: '' },
    { label: t('simulado.table.colBestScore'), align: 'text-center' },
    { label: t('simulado.table.colAttempts'), align: 'text-center' },
    { label: t('simulado.table.colCreated'), align: '' },
    { label: t('simulado.table.colLastAttempt'), align: '' },
    { label: t('simulado.table.colActions'), align: 'text-right' },
  ];

  return (
    <div className="overflow-x-auto rounded-xl bg-content1">
      <div aria-label={t('simulado.table.sectionTitle')} className="min-w-[1220px]" role="table">
        <div
          className="grid items-center gap-4 bg-content2 px-5 py-3 text-xs font-semibold text-default-500"
          role="row"
          style={{ gridTemplateColumns: SIMULADO_GRID_COLUMNS }}
        >
          {columnHeaders.map((column) => (
            <span key={column.label} className={column.align} role="columnheader">
              {column.label}
            </span>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="border-t border-divider" role="row">
            <div className="px-5 py-10 text-center text-sm text-default-400" role="cell">
              {t('simulado.table.empty')}
            </div>
          </div>
        ) : (
          rows.map((s) => (
            <SimuladoRow
              key={s.key}
              isStarting={startingKey === s.key}
              simulado={s}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onOpenHistory={onOpenHistory}
              onStart={onStart}
              onViewResult={onViewResult}
            />
          ))
        )}
      </div>
    </div>
  );
}

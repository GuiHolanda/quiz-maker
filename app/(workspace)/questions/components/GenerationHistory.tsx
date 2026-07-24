'use client';

import { useEffect, useState } from 'react';
import { Chip } from '@heroui/chip';

import type { GenerationHistoryItem, GenerationHistoryResponse } from '@/shared/types';
import { getGenerationHistory } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { EmptyState } from '@/shared/components/ui/EmptyState';

const LIMIT = 10;

export function GenerationHistory() {
  const { t } = useTranslation();
  const [data, setData] = useState<GenerationHistoryResponse | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getGenerationHistory(page, LIMIT)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, [page]);

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-primary">{t('generate.historySection')}</h2>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-content2 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!data || data.items.length === 0) && (
        <EmptyState title={t('generate.historyEmpty')} />
      )}

      {!isLoading && data && data.items.length > 0 && (
        <>
          <div className="flex flex-col divide-y divide-divider">
            {data.items.map((item) => renderRow(item))}
          </div>
          {data.total > LIMIT && (
            <PaginationControls
              currentPage={page}
              totalPages={Math.ceil(data.total / LIMIT)}
              onChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );

  function renderRow(item: GenerationHistoryItem) {
    const statusColor: 'success' | 'warning' | 'danger' | 'default' =
      item.status === 'done' ? 'success'
      : item.status === 'awaiting_review' ? 'warning'
      : item.status === 'error' || item.status === 'cancelled' ? 'danger'
      : 'default';

    const statusLabel =
      item.status === 'done' ? t('simulado.statusAnswered')
      : item.status === 'awaiting_review' ? t('generate.statusAwaitingReview')
      : item.status === 'cancelled' ? t('generate.statusCancelled')
      : t('generate.statusError');

    const totalTokens = (item.inputTokens ?? 0) + (item.outputTokens ?? 0);

    return (
      <div key={item.id} className="flex items-center gap-3 py-3 text-sm flex-wrap">
        <Chip color={item.type === 'full_exam' ? 'primary' : 'default'} size="sm" variant="flat">
          {item.type === 'full_exam' ? t('generate.historyTypeFullExam') : t('generate.historyTypeIndividual')}
        </Chip>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-foreground font-medium truncate">{item.refName ?? '—'}</span>
          {item.topicName && (
            <span className="text-default-400 text-xs truncate">{item.topicName}</span>
          )}
        </div>
        <span className="text-default-500 text-xs whitespace-nowrap">{item.questionsSaved}q</span>
        {totalTokens > 0 && (
          <span className="text-default-400 text-xs whitespace-nowrap">
            {t('generate.historyTokens', { count: totalTokens })}
          </span>
        )}
        <span className="text-default-400 text-xs whitespace-nowrap">
          <RelativeDate date={item.createdAt} />
        </span>
        <Chip color={statusColor} size="sm" variant="flat">
          {statusLabel}
        </Chip>
      </div>
    );
  }
}

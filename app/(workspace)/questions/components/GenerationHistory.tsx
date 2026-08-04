'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Chip } from '@heroui/chip';
import { Button } from '@heroui/button';
import { Badge } from '@heroui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardList,
  faGraduationCap,
  faCheckCircle,
  faFloppyDisk,
  faHistory,
  faSliders,
  faArrowDownWideShort,
  faArrowUpWideShort,
} from '@fortawesome/free-solid-svg-icons';

import type {
  GenerationHistoryItem,
  GenerationHistoryResponse,
  GenerationHistoryFilters,
  GenerationHistoryFilterOptions,
} from '@/shared/types';
import { EMPTY_HISTORY_FILTERS } from '@/shared/types';
import { getGenerationHistory, getGenerationHistoryFilters } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { GenerationHistoryFiltersBar, hasActiveHistoryFilters } from './GenerationHistoryFiltersBar';

const LIMIT = 10;

interface GenerationHistoryProps {
  readonly refreshKey?: number;
}

export function GenerationHistory({ refreshKey = 0 }: GenerationHistoryProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<GenerationHistoryResponse | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<GenerationHistoryFilters>(EMPTY_HISTORY_FILTERS);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<GenerationHistoryFilterOptions>({
    sources: [],
    topics: [],
  });

  const hasRunning = data?.items.some((item) => item.status === 'running' || item.status === 'queued') ?? false;

  useEffect(() => {
    getGenerationHistoryFilters()
      .then(setFilterOptions)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    getGenerationHistory(page, LIMIT, filters)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, [page, filters, refreshKey]);

  useEffect(() => {
    if (!hasRunning) return;
    const id = setInterval(() => {
      getGenerationHistory(page, LIMIT, filters)
        .then(setData)
        .catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [hasRunning, page, filters]);

  function handleFilterChange<K extends keyof GenerationHistoryFilters>(key: K, value: GenerationHistoryFilters[K]) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleClearFilters() {
    setPage(1);
    setFilters((prev) => ({ ...EMPTY_HISTORY_FILTERS, sort: prev.sort }));
  }

  function toggleSort() {
    setPage(1);
    setFilters((prev) => ({ ...prev, sort: prev.sort === 'desc' ? 'asc' : 'desc' }));
  }

  const hasActiveFilters = hasActiveHistoryFilters(filters);

  return (
    <section aria-labelledby="history-heading" className="mt-4">
      {renderSectionHeader()}

      <AnimatePresence initial={false}>
        {isFiltersOpen && (
          <motion.div
            key="filters-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden mb-3"
          >
            <GenerationHistoryFiltersBar
              filters={filters}
              filterOptions={filterOptions}
              onFilterChange={handleFilterChange}
              onClear={handleClearFilters}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        aria-live="polite"
        aria-atomic="false"
        className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-4"
      >
        {isLoading && <SkeletonListLoader count={5} />}

        {!isLoading && (!data || data.items.length === 0) && (
          <EmptyState title={t('generate.historyEmpty')} description={t('generate.historyEmptyDescription')} />
        )}

        {!isLoading && data && data.items.length > 0 && (
          <div className="flex flex-col divide-y divide-divider" role="list">
            {data.items.map((item) => renderHistoryRow(item))}
          </div>
        )}
      </div>

      {!isLoading && data && data.total > LIMIT && renderPagination(data.total)}
    </section>
  );

  function renderSectionHeader() {
    return (
      <div className="flex items-center gap-3 mb-3">
        <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FontAwesomeIcon className="w-3.5 h-3.5 text-primary" icon={faHistory} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground" id="history-heading">
            {t('generate.historySection')}
          </h2>
          <p className="text-sm text-default-500 mt-0.5">{t('generate.historySectionSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            isIconOnly
            aria-label={filters.sort === 'desc' ? t('generate.historySortNewest') : t('generate.historySortOldest')}
            className={buttonStyles.flat}
            size="sm"
            onPress={toggleSort}
          >
            <FontAwesomeIcon
              className="w-3.5 h-3.5"
              icon={filters.sort === 'desc' ? faArrowDownWideShort : faArrowUpWideShort}
            />
          </Button>
          <Badge color="danger" content="" isInvisible={!hasActiveFilters} size="sm" shape="circle">
            <Button
              aria-label={t('generate.historyFilters')}
              className={buttonStyles.flat}
              size="sm"
              startContent={<FontAwesomeIcon className="w-3.5 h-3.5" icon={faSliders} />}
              onPress={() => setIsFiltersOpen((prev) => !prev)}
            >
              {t('generate.historyFilters')}
            </Button>
          </Badge>
        </div>
      </div>
    );
  }

  function renderHistoryRow(item: GenerationHistoryItem) {
    const isConcurso = item.domain === 'public_exam';
    const icon = isConcurso ? faClipboardList : faGraduationCap;

    return (
      <div key={item.id} role="listitem" className="flex items-center gap-4 py-3.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FontAwesomeIcon className="w-3.5 h-3.5 text-primary" icon={icon} />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium text-foreground truncate leading-snug">
            {item.topicName ?? item.refName ?? '—'}
          </span>
          {item.topicName && (
            <span className="text-xs text-default-400 truncate leading-snug mt-0.5">
              {item.refName}
              {item.refRole ? ` · ${item.refRole}` : ''}
            </span>
          )}
        </div>

        {renderStatPair(item.questionsGenerated, item.questionsSaved)}

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-default-400 whitespace-nowrap hidden sm:block">
            <RelativeDate date={item.createdAt} />
          </span>
          <Chip color={statusColor(item.status)} size="sm" variant="flat">
            {statusLabel(item.status, t)}
          </Chip>
        </div>
      </div>
    );
  }

  function renderPagination(total: number) {
    const totalPages = Math.ceil(total / LIMIT);
    return (
      <div className="flex items-center justify-between gap-4 px-1 pt-1">
        <span className="text-xs text-default-400 tabular-nums">
          {t('generate.historyPageInfo', { page, totalPages, total })}
        </span>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <PaginationControls currentPage={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>
    );
  }

  function renderStatPair(generated: number, saved: number) {
    return (
      <div className="hidden md:flex items-center gap-4 shrink-0">
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1 text-default-500">
            <FontAwesomeIcon className="w-3 h-3" icon={faCheckCircle} />
            <span className="text-sm font-semibold tabular-nums">{generated}</span>
          </div>
          <span className="text-xs text-default-400">{t('generate.historyGeneratedLabel')}</span>
        </div>
        <div className="w-px h-6 bg-divider" />
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1 text-success">
            <FontAwesomeIcon className="w-3 h-3" icon={faFloppyDisk} />
            <span className="text-sm font-semibold tabular-nums">{saved}</span>
          </div>
          <span className="text-xs text-default-400">{t('generate.historySavedLabel')}</span>
        </div>
      </div>
    );
  }
}

function statusColor(status: GenerationHistoryItem['status']): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'done') return 'success';
  if (status === 'awaiting_review') return 'warning';
  if (status === 'error') return 'danger';
  if (status === 'cancelled') return 'default';
  return 'default';
}

function statusLabel(status: GenerationHistoryItem['status'], t: (key: string) => string): string {
  if (status === 'done') return t('generate.statusDone');
  if (status === 'awaiting_review') return t('generate.statusAwaitingReview');
  if (status === 'cancelled') return t('generate.statusCancelled');
  if (status === 'running') return t('generate.statusRunning');
  if (status === 'queued') return t('generate.statusQueued');
  return t('generate.statusError');
}

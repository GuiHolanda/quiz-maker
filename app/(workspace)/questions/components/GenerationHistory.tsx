'use client';

import { useEffect, useState } from 'react';
import { Chip } from '@heroui/chip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardList,
  faGraduationCap,
  faCheckCircle,
  faFloppyDisk,
  faHistory,
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
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { SectionHeader } from '@/shared/components/ui/SectionHeader';
import { IllustratedEmptyState } from '@/shared/components/ui/IllustratedEmptyState';
import { EntityListShell } from '@/shared/components/ui/EntityListShell';
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

      <EntityListShell
        totalItems={data?.total}
        isLoading={isLoading}
        skeleton={<SkeletonListLoader count={5} />}
        emptyState={
          <IllustratedEmptyState
            icon={faHistory}
            title={t('generate.historyEmpty')}
            description={t('generate.historyEmptyDescription')}
          />
        }
        filterContent={
          <GenerationHistoryFiltersBar
            filterOptions={filterOptions}
            filters={filters}
            onClear={handleClearFilters}
            onFilterChange={handleFilterChange}
          />
        }
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        isFiltersOpen={isFiltersOpen}
        onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
        sort={filters.sort}
        sortAscLabel={t('generate.historySortOldest')}
        sortDescLabel={t('generate.historySortNewest')}
        onToggleSort={toggleSort}
        paginationLabel={t('common.generations')}
        pagination={
          data && data.total > LIMIT
            ? {
                currentPage: page,
                totalPages: Math.ceil(data.total / LIMIT),
                totalItems: data.total,
                itemsPerPage: LIMIT,
                onPageChange: setPage,
                onItemsPerPageChange: () => {},
              }
            : undefined
        }
      >
        {data && data.items.length > 0 && (
          <div aria-live="polite" aria-atomic="false" className="bg-content1 border border-content2 rounded-xl p-6">
            <div className="flex flex-col divide-y divide-divider" role="list">
              {data.items.map((item) => renderHistoryRow(item))}
            </div>
          </div>
        )}
      </EntityListShell>
    </section>
  );

  function renderSectionHeader() {
    return (
      <SectionHeader
        className="mb-3"
        icon={faHistory}
        subtitle={t('generate.historySectionSubtitle')}
        title={t('generate.historySection')}
      />
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
          <span className="text-sm text-foreground truncate leading-snug font-semibold">
            {item.topicName ?? item.refName ?? '—'}
          </span>
          {item.topicName && (
            <span className="text-xs text-default-400 truncate leading-snug mt-0.5 font-semibold">
              {item.refName}
              {item.refRole ? ` - ${item.refRole}` : ''}
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

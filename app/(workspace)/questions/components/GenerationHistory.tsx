'use client';

import { useEffect, useState } from 'react';
import { Chip } from '@heroui/chip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faGraduationCap, faHistory } from '@fortawesome/free-solid-svg-icons';

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
          <div aria-atomic="false" aria-live="polite" className="overflow-hidden rounded-xl bg-content1">
            <div role="list">{data.items.map((item) => renderHistoryRow(item))}</div>
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
    const title = item.topicName ?? item.refName ?? '—';
    const subtitle = item.topicName ? `${item.refName ?? ''}${item.refRole ? ` · ${item.refRole}` : ''}` : null;

    return (
      <div
        key={item.id}
        className="flex items-center gap-4 border-t border-divider px-5 py-3.5 first:border-t-0 md:grid md:grid-cols-[38px_minmax(0,1fr)_96px_96px_minmax(0,auto)] md:gap-5"
        role="listitem"
      >
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[9px] bg-primary/10 text-primary">
          <FontAwesomeIcon className="h-4 w-4" icon={icon} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[14.5px] font-semibold leading-snug text-foreground">{title}</span>
          {subtitle && <span className="mt-0.5 truncate text-[13px] leading-snug text-default-500">{subtitle}</span>}
        </div>

        {renderStat(item.questionsGenerated, t('generate.historyGeneratedColumn'), false)}
        {renderStat(item.questionsSaved, t('generate.historySavedColumn'), true)}

        <div className="flex shrink-0 items-center gap-3 md:justify-end">
          <span className="hidden whitespace-nowrap text-[13px] text-default-500 sm:block">
            <RelativeDate date={item.createdAt} />
          </span>
          <Chip color={statusColor(item.status)} size="sm" variant="flat">
            {statusLabel(item.status, t)}
          </Chip>
        </div>
      </div>
    );
  }

  function renderStat(value: number, label: string, isSaved: boolean) {
    const valueColor = value > 0 ? (isSaved ? 'text-success' : 'text-foreground') : 'text-default-400';

    return (
      <div className={`hidden flex-col items-center md:flex ${isSaved ? 'border-l border-divider' : ''}`}>
        <span className={`font-mono text-[15px] font-medium tabular-nums ${valueColor}`}>{value}</span>
        <span className="mt-0.5 text-xs text-default-400">{label}</span>
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

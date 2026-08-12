'use client';

import React, { Suspense, useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';

import { PageHeader } from '@/shared/components/ui/PageHeader';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { IllustratedEmptyState } from '@/shared/components/ui/IllustratedEmptyState';
import { EntityListShell } from '@/shared/components/ui/EntityListShell';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { getQuestionBank, deleteBrowseQuestion } from '@/features/connectors';
import { notify } from '@/shared/lib/notify';
import type { UnifiedQuestion, QuestionBankResponse } from '@/shared/types';
import { QuestionBankCard } from './components/QuestionBankCard';
import { QuestionBankFiltersBar, EMPTY_FILTERS, hasActiveFilters } from './components/QuestionBankFiltersBar';
import type { QuestionBankFilters } from './components/QuestionBankFiltersBar';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';

const DEFAULT_PAGE_SIZE = 10;

type DeleteTarget = { id: number; type: 'certification' | 'public_exam' } | null;

export default function QuestionBankPage() {
  return (
    <Suspense>
      <QuestionBankContent />
    </Suspense>
  );
}

function QuestionBankContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [filters, setFilters] = useState<QuestionBankFilters>(() => {
    const searchFromUrl = searchParams.get('search') ?? '';
    const topicFromUrl = searchParams.get('topic');
    return {
      ...EMPTY_FILTERS,
      search: searchFromUrl,
      topic: topicFromUrl ? [topicFromUrl] : [],
    };
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [result, setResult] = useState<QuestionBankResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Debounce search: defer only the search string so dropdowns remain instant
  const deferredSearch = useDeferredValue(filters.search);
  const debouncedFilters: QuestionBankFilters = { ...filters, search: deferredSearch };

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (currentFilters: QuestionBankFilters, currentPage: number, currentPageSize: number) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      setLoadError(false);
      try {
        const data = await getQuestionBank({
          type: currentFilters.type === 'all' ? undefined : currentFilters.type,
          search: currentFilters.search || undefined,
          source: currentFilters.source.length > 0 ? currentFilters.source : undefined,
          topic: currentFilters.topic.length > 0 ? currentFilters.topic : undefined,
          difficulty: currentFilters.difficulty.length > 0 ? currentFilters.difficulty : undefined,
          hasAnswer:
            currentFilters.hasAnswer === 'true' ? true : currentFilters.hasAnswer === 'false' ? false : undefined,
          hasExplanation:
            currentFilters.hasExplanation === 'true'
              ? true
              : currentFilters.hasExplanation === 'false'
                ? false
                : undefined,
          sort: currentFilters.sort,
          page: currentPage,
          pageSize: currentPageSize,
        });
        setResult(data);
      } catch (e: unknown) {
        const err = e as { message?: string };
        if (
          err?.message === 'canceled' ||
          err?.message === 'Request aborted' ||
          (err as { code?: string })?.code === 'ERR_CANCELED'
        )
          return;
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(debouncedFilters, page, pageSize);
  }, [
    debouncedFilters.search,
    filters.type,
    filters.source.join(','),
    filters.topic.join(','),
    filters.difficulty.join(','),
    filters.hasAnswer,
    filters.hasExplanation,
    filters.sort,
    page,
    pageSize,
  ]);

  function handleFilterChange<K extends keyof QuestionBankFilters>(key: K, value: QuestionBankFilters[K]) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleClearFilters() {
    setPage(1);
    setFilters((prev) => ({ ...EMPTY_FILTERS, sort: prev.sort }));
  }

  function toggleSort() {
    setPage(1);
    setFilters((prev) => ({ ...prev, sort: prev.sort === 'desc' ? 'asc' : 'desc' }));
  }

  function handlePageSizeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setPage(1);
    setPageSize(Number(e.target.value));
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteBrowseQuestion(deleteTarget.id);
      notify.success(t('questionBank.deleteSuccess'));
      setDeleteTarget(null);
      // If deleted item was the last on a page > 1, go back one page
      const isLastOnPage = result?.questions.length === 1;
      const nextPage = isLastOnPage && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      else load(debouncedFilters, page, pageSize);
    } catch {
      notify.error(t('questionBank.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / pageSize)) : 1;
  const questions: UnifiedQuestion[] = result?.questions ?? [];
  const activeFilters = hasActiveFilters(filters);
  const shouldShowFilterPanel = !loadError && (questions.length > 0 || activeFilters);

  return (
    <PageHeader
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem href="/">{t('nav.dashboard')}</BreadcrumbItem>
          <BreadcrumbItem>{t('nav.questionBank')}</BreadcrumbItem>
        </Breadcrumbs>
      }
      subtitle={t('questionBank.subtitle')}
      title={t('questionBank.title')}
    >
      <EntityListShell
        totalItems={result?.total}
        isLoading={isLoading}
        skeleton={<SkeletonListLoader count={5} height="h-[480px]" />}
        emptyState={renderEmptyState()}
        filterContent={
          shouldShowFilterPanel ? (
            <QuestionBankFiltersBar
              filters={filters}
              onClear={handleClearFilters}
              onFilterChange={handleFilterChange}
            />
          ) : undefined
        }
        hasActiveFilters={activeFilters}
        onClearFilters={handleClearFilters}
        isFiltersOpen={isFiltersOpen}
        onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
        sort={filters.sort}
        sortAscLabel={t('questionBank.sortOldest')}
        sortDescLabel={t('questionBank.sortNewest')}
        onToggleSort={toggleSort}
        paginationLabel={t('nav.questions')}
        pagination={
          questions.length > 0
            ? {
                currentPage: page,
                totalPages,
                totalItems: result?.total ?? 0,
                itemsPerPage: pageSize,
                onPageChange: setPage,
                onItemsPerPageChange: handlePageSizeChange,
              }
            : undefined
        }
      >
        {questions.length > 0 && (
          <div className="flex flex-col">
            {questions.map((q) => (
              <QuestionBankCard
                key={`${q.type}-${q.id}`}
                question={q}
                onDeleteRequest={(id, type) => setDeleteTarget({ id, type })}
              />
            ))}
          </div>
        )}
      </EntityListShell>

      {renderDeleteModal()}
    </PageHeader>
  );

  function renderEmptyState() {
    if (loadError) {
      return (
        <EmptyState
          title={t('questionBank.loadErrorTitle')}
          description={t('questionBank.loadErrorDescription')}
          action={{
            label: t('common.retry'),
            onPress: () => load(debouncedFilters, page, pageSize),
          }}
        />
      );
    }

    if (activeFilters) {
      return (
        <EmptyState
          title={t('questionBank.noResultsTitle')}
          description={t('questionBank.noResultsDescription')}
          action={{ label: t('questionBank.clearFilters'), onPress: handleClearFilters }}
        />
      );
    }

    return (
      <IllustratedEmptyState
        icon={faLayerGroup}
        title={t('questionBank.emptyTitle')}
        description={t('questionBank.emptyDescription')}
        action={{ label: t('questionBank.emptyCta'), href: '/questions?type=certification' }}
      />
    );
  }

  function renderDeleteModal() {
    return (
      <ConfirmModal
        body={<p className="text-sm text-default-500">{t('browse.singleDeleteConfirmBody')}</p>}
        confirmLabel={t('common.delete')}
        confirmTestId="confirm-delete-btn"
        isLoading={isDeleting}
        isOpen={deleteTarget !== null}
        title={t('browse.singleDeleteConfirmTitle')}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    );
  }
}

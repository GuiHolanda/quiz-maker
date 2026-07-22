'use client';

import React, { useCallback, useDeferredValue, useEffect, useId, useRef, useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';

import { PageHeader } from '@/shared/components/ui/PageHeader';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { PaginationControls } from '@/shared/components/ui/PaginationControls';
import { ItemsPerPageSelect } from '@/shared/components/ui/ItemsPerPageSelect';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { getQuestionBank, deleteBrowseQuestion, deletePublicExamBrowseQuestion } from '@/features/connectors';
import { notify } from '@/shared/lib/notify';
import { buttonStyles } from '@/config/constants/buttonStyles';
import type { UnifiedQuestion, QuestionBankResponse } from '@/shared/types';
import { QuestionBankCard } from './components/QuestionBankCard';
import {
  QuestionBankFiltersBar,
  EMPTY_FILTERS,
  hasActiveFilters,
} from './components/QuestionBankFiltersBar';
import type { QuestionBankFilters } from './components/QuestionBankFiltersBar';

const DEFAULT_PAGE_SIZE = 10;

type DeleteTarget = { id: number; type: 'certification' | 'public_exam' } | null;

export default function QuestionBankPage() {
  const { t } = useTranslation();
  const deleteModalTitleId = useId();

  const [filters, setFilters] = useState<QuestionBankFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [result, setResult] = useState<QuestionBankResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
            currentFilters.hasAnswer === 'true'
              ? true
              : currentFilters.hasAnswer === 'false'
                ? false
                : undefined,
          hasExplanation:
            currentFilters.hasExplanation === 'true'
              ? true
              : currentFilters.hasExplanation === 'false'
                ? false
                : undefined,
          page: currentPage,
          pageSize: currentPageSize,
        });
        setResult(data);
      } catch (e: unknown) {
        const err = e as { message?: string };
        if (err?.message === 'canceled' || err?.message === 'Request aborted' || (err as { code?: string })?.code === 'ERR_CANCELED') return;
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    load(debouncedFilters, page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilters.search, filters.type, filters.source.join(','), filters.topic.join(','), filters.difficulty.join(','), filters.hasAnswer, filters.hasExplanation, page, pageSize]);

  function handleFilterChange<K extends keyof QuestionBankFilters>(
    key: K,
    value: QuestionBankFilters[K],
  ) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleClearFilters() {
    setPage(1);
    setFilters(EMPTY_FILTERS);
  }

  function handlePageSizeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setPage(1);
    setPageSize(Number(e.target.value));
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'certification') {
        await deleteBrowseQuestion(deleteTarget.id);
      } else {
        await deletePublicExamBrowseQuestion(deleteTarget.id);
      }
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

  return (
    <PageHeader subtitle={t('questionBank.subtitle')} title={t('questionBank.title')}>
      <div className="flex flex-col gap-4">
        <QuestionBankFiltersBar
          filters={filters}
          onClear={handleClearFilters}
          onFilterChange={handleFilterChange}
        />

        {renderContent()}

        {!isLoading && questions.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              onChange={(p) => setPage(p)}
            />
            <ItemsPerPageSelect
              isDisabled={isLoading}
              value={pageSize}
              onChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>

      {renderDeleteModal()}
    </PageHeader>
  );

  function renderContent() {
    if (isLoading) {
      return <SkeletonListLoader count={5} height="h-[480px]" />;
    }

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

    if (questions.length === 0) {
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
        <EmptyState
          title={t('questionBank.emptyTitle')}
          description={t('questionBank.emptyDescription')}
          action={{
            label: t('questionBank.emptyCta'),
            href: '/questions?type=certification',
            icon: faLayerGroup,
          }}
        />
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <p className="text-xs text-default-400">
          {t('questionBank.totalCount', { count: result?.total ?? 0 })}
        </p>
        {questions.map((q) => (
          <QuestionBankCard
            key={`${q.type}-${q.id}`}
            question={q}
            onDeleteRequest={(id, type) => setDeleteTarget({ id, type })}
          />
        ))}
      </div>
    );
  }

  function renderDeleteModal() {
    return (
      <Modal
        aria-labelledby={deleteModalTitleId}
        isOpen={deleteTarget !== null}
        size="sm"
        onClose={() => !isDeleting && setDeleteTarget(null)}
      >
        <ModalContent>
          <ModalHeader id={deleteModalTitleId} className="text-sm font-semibold">
            {t('browse.singleDeleteConfirmTitle')}
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500">{t('browse.singleDeleteConfirmBody')}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              className={buttonStyles.secondary}
              isDisabled={isDeleting}
              size="sm"
              variant="bordered"
              onPress={() => setDeleteTarget(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              className={buttonStyles.danger}
              isLoading={isDeleting}
              size="sm"
              onPress={handleConfirmDelete}
            >
              {t('common.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }
}

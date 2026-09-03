'use client';

import type { ChangeEvent } from 'react';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@heroui/button';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import NextLink from 'next/link';

import { PageHeader } from '@/shared/components/ui/PageHeader';
import { PaginationBar } from '@/shared/components/ui/PaginationBar';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { IllustratedEmptyState } from '@/shared/components/ui/IllustratedEmptyState';
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { deleteBrowseQuestion, getExamQuestionExplanation, getQuestionBank } from '@/features/connectors';
import { notify } from '@/shared/lib/notify';
import { writeSimuladoPrefill } from '@/app/(workspace)/simulados/components/create/simuladoPrefill';
import type { QuestionBankResponse, QuestionBankSort, UnifiedQuestion } from '@/shared/types';

import { QuestionBankSummary } from './QuestionBankSummary';
import { QuestionBankToolbar } from './QuestionBankToolbar';
import { QuestionBankBulkBar } from './QuestionBankBulkBar';
import { QuestionBankCard } from './QuestionBankCard';
import { buildSimuladoPrefillFromQuestions } from './simuladoFromSelection';
import {
  EMPTY_FILTERS,
  hasActiveFilters,
  QuestionBankFiltersBar,
  type QuestionBankFilters,
} from './QuestionBankFiltersBar';

const DEFAULT_PAGE_SIZE = 10;

export function QuestionBankContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<QuestionBankFilters>(() => ({
    ...EMPTY_FILTERS,
    search: searchParams.get('search') ?? '',
    topic: searchParams.get('topic') ?? '',
  }));
  const [sort, setSort] = useState<QuestionBankSort>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [result, setResult] = useState<QuestionBankResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [selected, setSelected] = useState<Map<number, UnifiedQuestion>>(new Map());
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [generatingExplanationId, setGeneratingExplanationId] = useState<number | null>(null);

  const deferredSearch = useDeferredValue(filters.search);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (
      currentFilters: QuestionBankFilters,
      currentSort: QuestionBankSort,
      currentPage: number,
      currentPageSize: number
    ) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      setLoadError(false);
      try {
        const data = await getQuestionBank({
          search: currentFilters.search || undefined,
          source: currentFilters.certification ? [currentFilters.certification] : undefined,
          topic: currentFilters.topic ? [currentFilters.topic] : undefined,
          difficulty: currentFilters.difficulty ? [currentFilters.difficulty] : undefined,
          explanation: currentFilters.explanation || undefined,
          situation: currentFilters.situation || undefined,
          sort: currentSort,
          page: currentPage,
          pageSize: currentPageSize,
        });
        setResult(data);
      } catch (e: unknown) {
        const err = e as { message?: string; code?: string };
        if (err?.message === 'canceled' || err?.message === 'Request aborted' || err?.code === 'ERR_CANCELED') return;
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load({ ...filters, search: deferredSearch }, sort, page, pageSize);
  }, [
    deferredSearch,
    filters.certification,
    filters.topic,
    filters.difficulty,
    filters.explanation,
    filters.situation,
    sort,
    page,
    pageSize,
  ]);

  const questions = useMemo(() => result?.questions ?? [], [result]);
  const summary = result?.summary ?? null;
  const activeFilters = hasActiveFilters({ ...filters, search: deferredSearch });
  const totalPages = result ? Math.max(1, Math.ceil(result.total / pageSize)) : 1;
  const selectedQuestions = useMemo(() => Array.from(selected.values()), [selected]);
  const canCreateSimulado = buildSimuladoPrefillFromQuestions(selectedQuestions) !== null;
  const allOnPageSelected = questions.length > 0 && questions.every((q) => selected.has(q.id));

  function patchFilter<K extends keyof QuestionBankFilters>(key: K, value: QuestionBankFilters[K]) {
    setPage(1);
    setSelected(new Map());
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setPage(1);
    setSelected(new Map());
    setFilters(EMPTY_FILTERS);
  }

  function changeSort(next: QuestionBankSort) {
    setPage(1);
    setSort(next);
  }

  function changePageSize(e: ChangeEvent<HTMLSelectElement>) {
    setPage(1);
    setPageSize(Number(e.target.value));
  }

  function toggleSelect(question: UnifiedQuestion) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(question.id)) next.delete(question.id);
      else next.set(question.id, question);
      return next;
    });
  }

  function toggleSelectPage() {
    setSelected((prev) => {
      const next = new Map(prev);
      if (allOnPageSelected) questions.forEach((q) => next.delete(q.id));
      else questions.forEach((q) => next.set(q.id, q));
      return next;
    });
  }

  function toggleOpen(id: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function confirmSingleDelete() {
    if (deleteTargetId == null) return;
    setIsDeleting(true);
    try {
      await deleteBrowseQuestion(deleteTargetId);
      notify.success(t('questionBank.deleteSuccess'));
      finishDelete([deleteTargetId]);
      setDeleteTargetId(null);
    } catch {
      notify.error(t('questionBank.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  }

  async function confirmBulkDelete() {
    const ids = Array.from(selected.keys());
    if (ids.length === 0) return;
    setIsDeleting(true);
    try {
      const outcomes = await Promise.allSettled(ids.map((id) => deleteBrowseQuestion(id)));
      const deleted = ids.filter((_, index) => outcomes[index].status === 'fulfilled');
      if (deleted.length > 0) notify.success(t('browse.bulkDeleteSuccess'));
      if (deleted.length < ids.length) notify.error(t('questionBank.deleteError'));
      finishDelete(deleted);
      setIsBulkDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  function finishDelete(deletedIds: number[]) {
    setSelected((prev) => {
      const next = new Map(prev);
      deletedIds.forEach((id) => next.delete(id));
      return next;
    });
    const isLastOnPage = questions.length === deletedIds.length;
    const nextPage = isLastOnPage && page > 1 ? page - 1 : page;
    if (nextPage !== page) setPage(nextPage);
    else load({ ...filters, search: deferredSearch }, sort, page, pageSize);
  }

  async function generateExplanation(question: UnifiedQuestion) {
    setGeneratingExplanationId(question.id);
    try {
      await getExamQuestionExplanation(question.id);
      notify.success(t('questionBank.explanationGenerated'));
      await load({ ...filters, search: deferredSearch }, sort, page, pageSize);
    } catch {
      notify.error(t('questionBank.explanationError'));
    } finally {
      setGeneratingExplanationId(null);
    }
  }

  function createSimulado() {
    const prefill = buildSimuladoPrefillFromQuestions(selectedQuestions);
    if (!prefill) {
      notify.error(t('questionBank.createSimuladoMultiExam'));
      return;
    }
    writeSimuladoPrefill(prefill);
    router.push('/simulados');
  }

  return (
    <PageHeader
      action={
        <Button
          as={NextLink}
          className={buttonStyles.primary}
          href="/questions?type=certification"
          startContent={<FontAwesomeIcon aria-hidden="true" className="w-3.5 h-3.5" icon={faWandMagicSparkles} />}
        >
          {t('questionBank.generateQuestions')}
        </Button>
      }
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem href="/">{t('nav.dashboard')}</BreadcrumbItem>
          <BreadcrumbItem>{t('nav.questionBank')}</BreadcrumbItem>
        </Breadcrumbs>
      }
      subtitle={t('questionBank.subtitle')}
      title={t('questionBank.title')}
    >
      <div className="flex flex-col gap-5">{renderBody()}</div>

      <ConfirmModal
        body={<p className="text-sm text-default-500">{t('browse.singleDeleteConfirmBody')}</p>}
        confirmLabel={t('common.delete')}
        confirmTestId="confirm-delete-btn"
        isLoading={isDeleting}
        isOpen={deleteTargetId !== null}
        title={t('browse.singleDeleteConfirmTitle')}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmSingleDelete}
      />
      <ConfirmModal
        body={<p className="text-sm text-default-500">{t('browse.bulkDeleteConfirmBody', { count: selected.size })}</p>}
        confirmLabel={t('common.delete')}
        confirmTestId="confirm-bulk-delete-btn"
        isLoading={isDeleting}
        isOpen={isBulkDeleteOpen}
        title={t('browse.bulkDeleteConfirmTitle')}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
      />
    </PageHeader>
  );

  function renderBody() {
    if (!result && isLoading) {
      return (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-content1 animate-pulse" />
            ))}
          </div>
          <SkeletonListLoader count={4} height="h-40" />
        </>
      );
    }

    if (loadError) {
      return (
        <EmptyState
          action={{
            label: t('common.retry'),
            onPress: () => load({ ...filters, search: deferredSearch }, sort, page, pageSize),
          }}
          description={t('questionBank.loadErrorDescription')}
          title={t('questionBank.loadErrorTitle')}
        />
      );
    }

    if (summary && summary.saved === 0) {
      return (
        <IllustratedEmptyState
          action={{ label: t('questionBank.emptyCta'), href: '/questions?type=certification' }}
          description={t('questionBank.emptyDescription')}
          icon={faLayerGroup}
          title={t('questionBank.emptyTitle')}
        />
      );
    }

    return (
      <>
        {summary && <QuestionBankSummary summary={summary} />}
        <QuestionBankFiltersBar
          filters={filters}
          summary={summary}
          onClear={clearFilters}
          onFilterChange={patchFilter}
        />
        <QuestionBankToolbar
          allOnPageSelected={allOnPageSelected}
          filteredTotal={result?.total ?? 0}
          pageSize={pageSize}
          savedTotal={summary?.saved ?? 0}
          sort={sort}
          onPageSizeChange={changePageSize}
          onSortChange={changeSort}
          onToggleSelectPage={toggleSelectPage}
        />
        {selected.size > 0 && (
          <QuestionBankBulkBar
            canCreateSimulado={canCreateSimulado}
            count={selected.size}
            onBulkDelete={() => setIsBulkDeleteOpen(true)}
            onCreateSimulado={createSimulado}
          />
        )}

        {isLoading ? (
          <SkeletonListLoader count={4} height="h-40" />
        ) : questions.length === 0 ? (
          <EmptyState
            action={activeFilters ? { label: t('questionBank.clearFilters'), onPress: clearFilters } : undefined}
            description={t('questionBank.noResultsDescription')}
            title={t('questionBank.noResultsTitle')}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {questions.map((question) => (
              <QuestionBankCard
                key={question.id}
                isGeneratingExplanation={generatingExplanationId === question.id}
                open={openIds.has(question.id)}
                question={question}
                selected={selected.has(question.id)}
                onDeleteRequest={() => setDeleteTargetId(question.id)}
                onGenerateExplanation={() => generateExplanation(question)}
                onToggleOpen={() => toggleOpen(question.id)}
                onToggleSelect={() => toggleSelect(question)}
              />
            ))}
          </div>
        )}

        {questions.length > 0 && (
          <PaginationBar
            itemLabel={t('common.questions')}
            page={page}
            perPage={pageSize}
            total={result?.total ?? 0}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </>
    );
  }
}

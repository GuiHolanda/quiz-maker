'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Button } from '@heroui/button';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faGraduationCap, faLayerGroup } from '@fortawesome/free-solid-svg-icons';

import { SimuladoHistoryModal } from './SimuladoHistoryModal';
import { SimuladosTable } from './SimuladosTable';
import { SimuladosToolbar } from './SimuladosToolbar';
import { normalizeMock, UnifiedSimulado } from './normalizeSimulado';
import { writeSimuladoPrefill } from '../create/simuladoPrefill';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useMockExamsContext } from '@/features/providers/mockExams.provider';
import { deleteMockExam, ensureMockExamAnswers, getMockExam, startMockExamAttempt } from '@/features/connectors';
import { usePaginatedItems } from '@/features/hooks/usePaginatedItems.hook';
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';
import { IllustratedEmptyState } from '@/shared/components/ui/IllustratedEmptyState';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { notify } from '@/shared/lib/notify';

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'answered';
type SortOption = 'recent' | 'oldest' | 'bestScore' | 'name';

const PAGE_BTN_BASE = 'h-9 min-w-9 rounded-lg border bg-transparent px-3 font-mono text-xs';
const PAGE_BTN_ACTIVE = 'border-primary bg-primary/10 text-primary';
const PAGE_BTN_IDLE = 'border-divider text-default-500 data-[hover=true]:bg-content2 data-[hover=true]:text-foreground';

function extractMessage(error: unknown): string | undefined {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
}

function bestScoreRatio(simulado: UnifiedSimulado): number {
  if (simulado.bestScore == null) return -1;

  return simulado.bestScore / Math.max(simulado.totalQuestions, 1);
}

export function SimuladosCreatedSection() {
  const { t } = useTranslation();
  const mock = useMockExamsContext();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [exam, setExam] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOption>('recent');
  const [deleteTarget, setDeleteTarget] = useState<UnifiedSimulado | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<UnifiedSimulado | null>(null);
  const [startingKey, setStartingKey] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    mock.refresh();
  }, [mock.refresh]);

  const isLoading = mock.isLoading;

  const simulados = useMemo<UnifiedSimulado[]>(() => mock.mockExams.map(normalizeMock), [mock.mockExams]);

  const examOptions = useMemo(() => {
    const labels = new Set(simulados.map((simulado) => simulado.sourceLabel));

    return Array.from(labels).sort((a, b) => a.localeCompare(b));
  }, [simulados]);

  const hasActiveFilters = search.trim() !== '' || exam !== 'all' || status !== 'all';

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return simulados.filter((simulado) => {
      if (exam !== 'all' && simulado.sourceLabel !== exam) return false;
      if (status !== 'all' && simulado.status !== status) return false;
      if (query) {
        const haystack = `${simulado.name ?? ''} ${simulado.sourceLabel}`.toLowerCase();

        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [simulados, deferredSearch, exam, status]);

  const sorted = useMemo(() => {
    const list = [...filtered];

    switch (sort) {
      case 'oldest':
        return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'bestScore':
        return list.sort((a, b) => bestScoreRatio(b) - bestScoreRatio(a));
      case 'name':
        return list.sort((a, b) => (a.name ?? a.sourceLabel).localeCompare(b.name ?? b.sourceLabel));
      default:
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [filtered, sort]);

  const { pageItems, page, totalPages, perPage, setPage, setPerPage } = usePaginatedItems(sorted);

  const from = sorted.length === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, sorted.length);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  function clearFilters() {
    setSearch('');
    setExam('all');
    setStatus('all');
  }

  function viewResult(s: UnifiedSimulado) {
    if (s.lastAttemptId != null) {
      router.push(`/simulados/${s.id}/resultado/${s.lastAttemptId}`);

      return;
    }

    setHistoryTarget(s);
  }

  async function handleStart(s: UnifiedSimulado) {
    setStartingKey(s.key);
    try {
      if (s.openAttemptId != null) {
        router.push(`/simulados/${s.id}/tentativa/${s.openAttemptId}`);

        return;
      }

      ensureMockExamAnswers(s.id).catch(() => {});
      const attempt = await startMockExamAttempt(s.id);

      router.push(`/simulados/${s.id}/tentativa/${attempt.id}`);
    } catch (error: unknown) {
      notify.error(t('toast.error'), extractMessage(error) ?? t('toast.somethingWrong'));
      setStartingKey(null);
    }
  }

  async function handleDuplicate(s: UnifiedSimulado) {
    if (duplicatingId != null) return;

    const listItem = mock.mockExams.find((item) => item.id === s.id);

    if (!listItem) return;

    setDuplicatingId(s.id);
    try {
      const full = await getMockExam(s.id);

      writeSimuladoPrefill({
        examId: listItem.exam.id,
        name: listItem.name ?? undefined,
        totalQuestions: listItem.totalQuestions,
        durationMinutes: listItem.durationMinutes,
        questionSource: listItem.questionSource,
        sections: full.sections.map((section) => ({
          sectionName: section.sectionName,
          questionCount: section.questionCount,
        })),
      });
      window.dispatchEvent(new CustomEvent('simulado-prefill'));
      notify.success(t('simulado.table.duplicated'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: unknown) {
      notify.error(t('toast.error'), extractMessage(error) ?? t('toast.somethingWrong'));
    } finally {
      setDuplicatingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteMockExam(deleteTarget.id);
      mock.removeMockExam(deleteTarget.id);
      const removedName = deleteTarget.name ?? deleteTarget.sourceLabel;

      setDeleteTarget(null);
      notify.success(t('simulado.deleted'), t('simulado.deletedDescription', { name: removedName }));
    } catch (error: unknown) {
      notify.error(t('toast.error'), extractMessage(error) ?? t('toast.somethingWrong'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="border-t border-divider pt-8">
      <div className="flex items-start gap-3.5">
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-primary/10 text-primary">
          <FontAwesomeIcon icon={faLayerGroup} />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-[22px] font-bold text-foreground">{t('simulado.table.sectionTitle')}</h2>
          <p className="max-w-[820px] text-sm text-default-500">{t('simulado.table.sectionSubtitle')}</p>
        </div>
      </div>

      {renderBody()}

      <ConfirmModal
        body={
          <p className="text-sm text-default-500">
            {t('simulado.deleteConfirm', {
              name: deleteTarget?.name ?? deleteTarget?.sourceLabel ?? '',
            })}
          </p>
        }
        confirmLabel={t('common.delete')}
        confirmTestId="confirm-delete-btn"
        isLoading={isDeleting}
        isOpen={!!deleteTarget}
        title={t('simulado.deleteTitle')}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <SimuladoHistoryModal simulado={historyTarget} onClose={() => setHistoryTarget(null)} />
    </section>
  );

  function renderBody() {
    if (isLoading) {
      return (
        <div className="mt-6">
          <SkeletonListLoader count={5} height="h-14" />
        </div>
      );
    }

    if (mock.mockExams.length === 0) {
      return (
        <div className="mt-6">
          <IllustratedEmptyState
            description={t('simulado.noSimuladosDescription')}
            icon={faGraduationCap}
            title={t('simulado.noSimulados')}
          />
        </div>
      );
    }

    return (
      <>
        <div className="mt-6">
          <SimuladosToolbar
            exam={exam}
            examOptions={examOptions}
            hasActiveFilters={hasActiveFilters}
            perPage={perPage}
            search={search}
            sort={sort}
            status={status}
            onClear={clearFilters}
            onExam={setExam}
            onPerPage={setPerPage}
            onSearch={setSearch}
            onSort={setSort}
            onStatus={setStatus}
          />
        </div>

        <div className="mt-4">
          <SimuladosTable
            rows={pageItems}
            startingKey={startingKey}
            onDelete={setDeleteTarget}
            onDuplicate={handleDuplicate}
            onOpenHistory={setHistoryTarget}
            onStart={handleStart}
            onViewResult={viewResult}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-default-400">
            {t('simulado.table.count', { from, to, total: sorted.length, page, pages: totalPages })}
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              className={`${PAGE_BTN_BASE} ${PAGE_BTN_IDLE}`}
              data-testid="simulado-pagination-prev"
              isDisabled={page <= 1}
              size="sm"
              startContent={<FontAwesomeIcon icon={faChevronLeft} />}
              variant="bordered"
              onPress={() => setPage(page - 1)}
            >
              {t('simulado.table.prev')}
            </Button>

            {pageNumbers.map((pageNumber) => (
              <Button
                key={pageNumber}
                className={`${PAGE_BTN_BASE} ${pageNumber === page ? PAGE_BTN_ACTIVE : PAGE_BTN_IDLE}`}
                size="sm"
                variant="bordered"
                onPress={() => setPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            ))}

            <Button
              className={`${PAGE_BTN_BASE} ${PAGE_BTN_IDLE}`}
              data-testid="simulado-pagination-next"
              endContent={<FontAwesomeIcon icon={faChevronRight} />}
              isDisabled={page >= totalPages}
              size="sm"
              variant="bordered"
              onPress={() => setPage(page + 1)}
            >
              {t('simulado.table.next')}
            </Button>
          </div>
        </div>
      </>
    );
  }
}

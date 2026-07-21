'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Input } from '@heroui/input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { Progress } from '@heroui/progress';
import { Select, SelectItem } from '@heroui/select';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSliders, faXmark, faMagnifyingGlass, faTrash } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useCertSimuladosContext } from '@/features/providers/certSimulados.provider';
import { useMockExamsContext } from '@/features/providers/mockExams.provider';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import {
  deleteCertSimulado,
  deleteMockExam,
  ensureCertSimuladoAnswers,
  ensureMockExamAnswers,
  startCertSimuladoAttempt,
  startMockExamAttempt,
} from '@/features/connectors';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { notify } from '@/shared/lib/notify';
import { CertSimuladoListItem, MockExamListItem, SimuladoType } from '@/shared/types';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { inputProperties } from '@/config/constants/inputStyles';

type TypeFilter = 'all' | SimuladoType;
type StatusFilter = 'all' | 'answered' | 'pending' | 'in_progress';
type CountFilter = 'all' | 'upTo10' | '11to20' | '21to40' | '41plus';

interface AttemptRow {
  id: number;
  score: number | null;
  finishedAt: string | null;
}

interface UnifiedSimulado {
  key: string;
  id: number;
  type: SimuladoType;
  name: string | null;
  sourceLabel: string;
  totalQuestions: number;
  attemptCount: number;
  bestScore: number | null;
  openAttemptId: number | null;
  attempts: AttemptRow[];
  status: 'answered' | 'pending' | 'in_progress';
}

interface Filters {
  search: string;
  type: TypeFilter;
  sources: string[];
  count: CountFilter;
  status: StatusFilter;
}

const EMPTY_FILTERS: Filters = { search: '', type: 'all', sources: [], count: 'all', status: 'all' };

function scoreColor(percent: number): 'success' | 'warning' | 'danger' {
  if (percent >= 70) return 'success';
  if (percent >= 50) return 'warning';

  return 'danger';
}

function matchesCount(total: number, filter: CountFilter): boolean {
  switch (filter) {
    case 'upTo10':
      return total <= 10;
    case '11to20':
      return total >= 11 && total <= 20;
    case '21to40':
      return total >= 21 && total <= 40;
    case '41plus':
      return total >= 41;
    default:
      return true;
  }
}

function basePath(type: SimuladoType): string {
  return type === 'certification' ? '/certifications/simulados' : '/public-exams/simulados';
}

interface SimuladosListTabProps {
  readonly onCreateNew?: () => void;
}

export function SimuladosListTab({ onCreateNew }: SimuladosListTabProps = {}) {
  const { t } = useTranslation();
  const { usage } = useUsageContext();
  const cert = useCertSimuladosContext();
  const mock = useMockExamsContext();
  const router = useRouter();

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [deleteTarget, setDeleteTarget] = useState<UnifiedSimulado | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [startingKey, setStartingKey] = useState<string | null>(null);
  const [historyTarget, setHistoryTarget] = useState<UnifiedSimulado | null>(null);

  useEffect(() => {
    cert.refresh();
    mock.refresh();
  }, [cert.refresh, mock.refresh]);

  const hasConcursoAccess = !usage || usage.publicExamsLimit !== 0;
  const isLoading = cert.isLoading || mock.isLoading;

  // Type filter only has meaning when both verticals can appear in the list
  const showTypeFilter = hasConcursoAccess;

  const simulados = useMemo<UnifiedSimulado[]>(() => {
    const fromCert: UnifiedSimulado[] = cert.simulados.map((s) => normalizeCert(s));
    const fromMock: UnifiedSimulado[] = mock.mockExams.map((m) => normalizeMock(m));

    return [...fromCert, ...fromMock].sort((a, b) => b.id - a.id || a.key.localeCompare(b.key));
  }, [cert.simulados, mock.mockExams]);

  const sourceOptions = useMemo(() => {
    const relevant = filters.type === 'all' ? simulados : simulados.filter((s) => s.type === filters.type);
    const labels = new Set(relevant.map((s) => s.sourceLabel));

    return Array.from(labels).sort((a, b) => a.localeCompare(b));
  }, [simulados, filters.type]);

  const activeFilterCount =
    (filters.search.trim() !== '' ? 1 : 0) +
    (filters.type !== 'all' ? 1 : 0) +
    (filters.sources.length > 0 ? 1 : 0) +
    (filters.count !== 'all' ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0);

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return simulados.filter((s) => {
      if (filters.type !== 'all' && s.type !== filters.type) return false;
      if (filters.sources.length > 0 && !filters.sources.includes(s.sourceLabel)) return false;
      if (filters.status !== 'all' && s.status !== filters.status) return false;
      if (!matchesCount(s.totalQuestions, filters.count)) return false;
      if (query) {
        const haystack = `${s.name ?? ''} ${s.sourceLabel}`.toLowerCase();

        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [simulados, filters]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };

      // Changing type invalidates source selections that no longer apply
      if (key === 'type') next.sources = [];

      return next;
    });
  }

  async function handleStart(s: UnifiedSimulado) {
    setStartingKey(s.key);
    try {
      if (s.openAttemptId != null) {
        router.push(`${basePath(s.type)}/${s.id}/tentativa/${s.openAttemptId}`);

        return;
      }
      // fire-and-forget: finishAttempt guarantees answers before scoring if this fails
      if (s.type === 'certification') {
        ensureCertSimuladoAnswers(s.id).catch(() => {});
        const attempt = await startCertSimuladoAttempt(s.id);

        router.push(`${basePath(s.type)}/${s.id}/tentativa/${attempt.id}`);
      } else {
        ensureMockExamAnswers(s.id).catch(() => {});
        const attempt = await startMockExamAttempt(s.id);

        router.push(`${basePath(s.type)}/${s.id}/tentativa/${attempt.id}`);
      }
    } catch (e: unknown) {
      notify.error(
        t('toast.error'),
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('toast.somethingWrong')
      );
      setStartingKey(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'certification') {
        await deleteCertSimulado(deleteTarget.id);
        cert.removeSimulado(deleteTarget.id);
      } else {
        await deleteMockExam(deleteTarget.id);
        mock.removeMockExam(deleteTarget.id);
      }
      const removedName = deleteTarget.name ?? deleteTarget.sourceLabel;

      setDeleteTarget(null);
      notify.success(t('simulado.deleted'), t('simulado.deletedDescription', { name: removedName }));
    } catch (e: unknown) {
      notify.error(
        t('toast.error'),
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('toast.somethingWrong')
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) return <SkeletonListLoader />;

  if (simulados.length === 0) {
    return (
      <EmptyState
        action={onCreateNew ? { label: t('simulado.tabNew'), onPress: onCreateNew } : undefined}
        description={t('simulado.noSimuladosDescription')}
        title={t('simulado.noSimulados')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {renderFilter()}

      {filtered.length === 0 ? (
        <EmptyState
          action={{ label: t('simulado.clearFilter'), onPress: () => setFilters(EMPTY_FILTERS) }}
          description={t('simulado.noResultsForFilterDescription')}
          title={t('simulado.noResultsForFilter')}
        />
      ) : (
        <div className="flex flex-col gap-4">{filtered.map((s) => renderCard(s))}</div>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => !isDeleting && setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>{t('simulado.deleteTitle')}</ModalHeader>
          <ModalBody>
            <p className="text-default-500 text-sm">
              {t('simulado.deleteConfirm', { name: deleteTarget?.name ?? deleteTarget?.sourceLabel ?? '' })}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              className={buttonStyles.secondary}
              isDisabled={isDeleting}
              variant="bordered"
              onPress={() => setDeleteTarget(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button className={buttonStyles.danger} isLoading={isDeleting} onPress={handleDelete}>
              {t('common.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={!!historyTarget} size="lg" onClose={() => setHistoryTarget(null)}>
        <ModalContent>{historyTarget && renderHistoryModal(historyTarget)}</ModalContent>
      </Modal>
    </div>
  );

  function renderFilter() {
    return (
      <div className="bg-content1 border border-default-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <FontAwesomeIcon className="w-3.5 h-3.5 text-default-400 shrink-0" icon={faSliders} />
          <span className="text-xs font-semibold text-default-500">{t('simulado.filters')}</span>
          {activeFilterCount > 0 && (
            <Button
              className={`${buttonStyles.flat} ml-auto h-7 px-3 text-xs`}
              size="sm"
              startContent={<FontAwesomeIcon className="w-3 h-3" icon={faXmark} />}
              onPress={() => setFilters(EMPTY_FILTERS)}
            >
              {t('simulado.clearFilter')}
            </Button>
          )}
        </div>

        {/* Row 1: search + source */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            {...inputProperties.input}
            label={t('simulado.filterSearchLabel')}
            placeholder={t('simulado.filterSearchPlaceholder')}
            startContent={<FontAwesomeIcon className="w-3.5 h-3.5 text-default-400" icon={faMagnifyingGlass} />}
            value={filters.search}
            onValueChange={(v) => updateFilter('search', v)}
          />
          <Select
            {...inputProperties.select}
            isDisabled={sourceOptions.length === 0}
            label={t('simulado.filterSourceLabel')}
            placeholder={t('simulado.filterSourcePlaceholder')}
            selectionMode="multiple"
            selectedKeys={new Set(filters.sources)}
            onSelectionChange={(keys) => updateFilter('sources', Array.from(keys) as string[])}
          >
            {sourceOptions.map((src) => (
              <SelectItem key={src}>{src}</SelectItem>
            ))}
          </Select>
        </div>

        {/* Row 2: type + count + status */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${showTypeFilter ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}
        >
          {showTypeFilter && (
            <Select
              {...inputProperties.select}
              label={t('simulado.filterByType')}
              placeholder={t('simulado.filterAll')}
              selectedKeys={filters.type !== 'all' ? new Set([filters.type]) : new Set([])}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as TypeFilter | undefined;

                updateFilter('type', val ?? 'all');
              }}
            >
              <SelectItem key="certification">{t('simulado.filterCertifications')}</SelectItem>
              <SelectItem key="concurso">{t('simulado.filterConcursos')}</SelectItem>
            </Select>
          )}

          <Select
            {...inputProperties.select}
            label={t('simulado.filterCountLabel')}
            placeholder={t('simulado.filterCountPlaceholder')}
            selectedKeys={filters.count !== 'all' ? new Set([filters.count]) : new Set([])}
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as CountFilter | undefined;

              updateFilter('count', val ?? 'all');
            }}
          >
            <SelectItem key="upTo10">{t('simulado.filterCountUpTo')}</SelectItem>
            <SelectItem key="11to20">{t('simulado.filterCount11to20')}</SelectItem>
            <SelectItem key="21to40">{t('simulado.filterCount21to40')}</SelectItem>
            <SelectItem key="41plus">{t('simulado.filterCount41plus')}</SelectItem>
          </Select>

          <Select
            {...inputProperties.select}
            label={t('simulado.filterStatusLabel')}
            placeholder={t('simulado.filterStatusPlaceholder')}
            selectedKeys={filters.status !== 'all' ? new Set([filters.status]) : new Set([])}
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as StatusFilter | undefined;

              updateFilter('status', val ?? 'all');
            }}
          >
            <SelectItem key="pending">{t('simulado.statusPending')}</SelectItem>
            <SelectItem key="in_progress">{t('simulado.statusInProgress')}</SelectItem>
            <SelectItem key="answered">{t('simulado.statusAnswered')}</SelectItem>
          </Select>
        </div>
      </div>
    );
  }

  function renderCard(s: UnifiedSimulado) {
    const isAnswered = s.attemptCount > 0;
    const isInProgress = s.openAttemptId != null;
    const isStarting = startingKey === s.key;
    const attempts =
      s.attemptCount === 1
        ? t('simulado.attempt', { count: s.attemptCount })
        : t('simulado.attempts', { count: s.attemptCount });

    return (
      <div
        key={s.key}
        data-testid="simulado-card"
        className={`bg-content1 border rounded-xl p-4 flex flex-col transition-all duration-300 ${
          isStarting ? 'border-primary' : startingKey !== null ? 'border-default-200 opacity-40' : 'border-default-200'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <p className="font-semibold truncate">{s.name ?? s.sourceLabel}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Chip color={s.type === 'certification' ? 'primary' : 'secondary'} size="sm" variant="flat">
              {s.type === 'certification' ? t('simulado.typeCertification') : t('simulado.typeConcurso')}
            </Chip>
            <Chip color={isInProgress ? 'warning' : isAnswered ? 'success' : 'default'} size="sm" variant="flat">
              {isInProgress
                ? t('simulado.statusInProgress')
                : isAnswered
                  ? t('simulado.statusAnswered')
                  : t('simulado.statusPending')}
            </Chip>
          </div>
        </div>

        <div className="flex justify-between gap-3 mt-1">
          <p className="text-default-400 text-sm truncate">{s.sourceLabel}</p>
          <p className="text-default-400 text-sm shrink-0">
            {s.totalQuestions} questões · {attempts}
            {s.bestScore !== null && ` · ${t('simulado.bestScore', { score: s.bestScore, total: s.totalQuestions })}`}
          </p>
        </div>

        {isStarting ? (
          <div className="mt-6 flex flex-col gap-2">
            <p className="text-xs text-primary font-medium">{t('simulado.preparingAttempt')}</p>
            <Progress isIndeterminate aria-label={t('simulado.preparingAttempt')} color="primary" size="sm" />
          </div>
        ) : (
          <div className="flex flex-wrap justify-between gap-2 border-t border-default-100 mt-4 pt-4">
            <div className="flex gap-2">
              <Button
                className={buttonStyles.primarySm}
                isDisabled={startingKey !== null}
                size="sm"
                onPress={() => handleStart(s)}
              >
                {isInProgress ? t('simulado.continue') : isAnswered ? t('simulado.tryAgain') : t('simulado.respond')}
              </Button>
              {isAnswered && (
                <Button
                  className={buttonStyles.secondary}
                  size="sm"
                  variant="bordered"
                  onPress={() => setHistoryTarget(s)}
                >
                  {t('simulado.viewResults')}
                </Button>
              )}
            </div>
            <Button
              isIconOnly
              aria-label={t('simulado.delete')}
              className={buttonStyles.iconOnly.danger}
              size="sm"
              variant="light"
              onPress={() => setDeleteTarget(s)}
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </div>
        )}
      </div>
    );
  }

  function renderHistoryModal(s: UnifiedSimulado) {
    return (
      <>
        <ModalHeader className="flex flex-col gap-1">
          <p>{t('simulado.attemptHistory')}</p>
          <p className="text-default-400 text-sm font-normal">{s.name ?? s.sourceLabel}</p>
        </ModalHeader>
        <ModalBody>
          {s.attempts.length === 0 ? (
            <p className="text-default-400 text-sm">{t('simulado.noAttempts')}</p>
          ) : (
            <div className="flex flex-col gap-2">{s.attempts.map((a, i) => renderAttemptRow(s, a, i))}</div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button className={buttonStyles.secondary} variant="bordered" onPress={() => setHistoryTarget(null)}>
            {t('common.cancel')}
          </Button>
        </ModalFooter>
      </>
    );
  }

  function renderAttemptRow(s: UnifiedSimulado, attempt: AttemptRow, i: number) {
    const score = attempt.score ?? 0;
    const percent = s.totalQuestions > 0 ? Math.round((score / s.totalQuestions) * 100) : 0;
    const date = attempt.finishedAt
      ? new Date(attempt.finishedAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

    return (
      <div
        key={attempt.id}
        className="flex items-center justify-between gap-3 py-3 border-b border-default-100 last:border-0"
      >
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold">{t('simulado.attemptNumber', { n: s.attempts.length - i })}</p>
          <p className="text-xs text-default-400">{date}</p>
        </div>
        <Chip className="font-semibold" color={scoreColor(percent)} size="sm" variant="flat">
          {t('simulado.attemptScore', { correct: score, total: s.totalQuestions, percent })}
        </Chip>
        <Button
          className={buttonStyles.secondary}
          size="sm"
          variant="bordered"
          onPress={() => {
            setHistoryTarget(null);
            router.push(`${basePath(s.type)}/${s.id}/resultado/${attempt.id}`);
          }}
        >
          {t('simulado.viewAttempt')}
        </Button>
      </div>
    );
  }
}

function normalizeCert(s: CertSimuladoListItem): UnifiedSimulado {
  return {
    key: `certification-${s.id}`,
    id: s.id,
    type: 'certification',
    name: s.name,
    sourceLabel: s.certLabel,
    totalQuestions: s.totalQuestions,
    attemptCount: s.attemptCount,
    bestScore: s.bestScore,
    openAttemptId: s.openAttemptId,
    attempts: s.attempts.map((a) => ({ id: a.id, score: a.score, finishedAt: a.finishedAt })),
    status: deriveStatus(s.openAttemptId, s.attemptCount),
  };
}

function normalizeMock(m: MockExamListItem): UnifiedSimulado {
  return {
    key: `concurso-${m.id}`,
    id: m.id,
    type: 'concurso',
    name: m.name,
    sourceLabel: m.publicExam.name,
    totalQuestions: m.totalQuestions,
    attemptCount: m.attemptCount,
    bestScore: m.bestScore,
    openAttemptId: m.openAttemptId,
    attempts: m.attempts.map((a) => ({ id: a.id, score: a.score, finishedAt: a.finishedAt })),
    status: deriveStatus(m.openAttemptId, m.attemptCount),
  };
}

function deriveStatus(openAttemptId: number | null, attemptCount: number): UnifiedSimulado['status'] {
  if (openAttemptId != null) return 'in_progress';
  if (attemptCount > 0) return 'answered';

  return 'pending';
}

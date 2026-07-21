'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { Progress } from '@heroui/progress';
import { Tab, Tabs } from '@heroui/tabs';
import { useRouter } from 'next/navigation';

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
import { CertSimuladoListItem, MockExamListItem } from '@/shared/types';
import { buttonStyles } from '@/config/constants/buttonStyles';

type SimuladoType = 'certification' | 'concurso';
type TypeFilter = 'all' | SimuladoType;

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
}

function scoreColor(percent: number): 'success' | 'warning' | 'danger' {
  if (percent >= 70) return 'success';
  if (percent >= 50) return 'warning';

  return 'danger';
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

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
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

  const simulados = useMemo<UnifiedSimulado[]>(() => {
    const fromCert: UnifiedSimulado[] = cert.simulados.map((s) => normalizeCert(s));
    const fromMock: UnifiedSimulado[] = mock.mockExams.map((m) => normalizeMock(m));

    return [...fromCert, ...fromMock].sort((a, b) => b.id - a.id || a.key.localeCompare(b.key));
  }, [cert.simulados, mock.mockExams]);

  const filtered = useMemo(
    () => (typeFilter === 'all' ? simulados : simulados.filter((s) => s.type === typeFilter)),
    [simulados, typeFilter],
  );

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
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('toast.somethingWrong'),
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
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('toast.somethingWrong'),
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
      {hasConcursoAccess && renderFilter()}

      {filtered.length === 0 ? (
        <EmptyState
          action={{ label: t('simulado.filterAll'), onPress: () => setTypeFilter('all') }}
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
      <Tabs
        aria-label={t('simulado.filterAll')}
        classNames={{
          tabList: 'bg-content2 border border-default-200 rounded-xl p-1 gap-1',
          tab: 'text-default-400 data-[selected=true]:text-foreground data-[selected=true]:font-semibold',
          cursor: 'bg-primary rounded-xl',
        }}
        selectedKey={typeFilter}
        size="sm"
        onSelectionChange={(key) => setTypeFilter(key as TypeFilter)}
      >
        <Tab key="all" title={t('simulado.filterAll')} />
        <Tab key="certification" title={t('simulado.filterCertifications')} />
        <Tab key="concurso" title={t('simulado.filterConcursos')} />
      </Tabs>
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
        className={`bg-content1 border rounded-xl p-4 flex flex-col transition-all duration-300 ${
          isStarting
            ? 'border-primary'
            : startingKey !== null
              ? 'border-default-200 opacity-40'
              : 'border-default-200'
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
            <Chip color={isInProgress ? 'warning' : isAnswered ? 'success' : 'warning'} size="sm" variant="flat">
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
          <div className="flex flex-wrap justify-between gap-2 mt-8">
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
            <Button className={buttonStyles.danger} size="sm" onPress={() => setDeleteTarget(s)}>
              {t('simulado.delete')}
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
            <p className="text-default-400 text-sm">{t('simulado.noSimulados')}</p>
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
  };
}

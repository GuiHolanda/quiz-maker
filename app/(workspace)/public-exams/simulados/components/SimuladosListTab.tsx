'use client';

import { useEffect, useState } from 'react';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { Progress } from '@heroui/progress';
import { useRouter } from 'next/navigation';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { useMockExamsContext } from '@/features/providers/mockExams.provider';
import { deleteMockExam, ensureMockExamAnswers, startMockExamAttempt } from '@/features/connectors';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { notify } from '@/shared/lib/notify';
import { MockExamListItem } from '@/shared/types';

type AttemptSummary = MockExamListItem['attempts'][number];

function scoreColor(percent: number): 'success' | 'warning' | 'danger' {
  if (percent >= 70) return 'success';
  if (percent >= 50) return 'warning';

  return 'danger';
}

interface SimuladosListTabProps {
  readonly onCreateNew?: () => void;
}

export function SimuladosListTab({ onCreateNew }: SimuladosListTabProps = {}) {
  const { t } = useTranslation();
  const { mockExams, isLoading, removeMockExam, refresh } = useMockExamsContext();
  const [deleteTarget, setDeleteTarget] = useState<MockExamListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [historyTarget, setHistoryTarget] = useState<MockExamListItem | null>(null);
  const router = useRouter();

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleStart(mockExam: MockExamListItem) {
    setStartingId(mockExam.id);
    try {
      if (mockExam.openAttemptId != null) {
        router.push(`/public-exams/simulados/${mockExam.id}/tentativa/${mockExam.openAttemptId}`);
        return;
      }
      // fire-and-forget: se falhar, finishAttempt garante os answers antes de calcular o score
      ensureMockExamAnswers(mockExam.id).catch(() => {});
      const attempt = await startMockExamAttempt(mockExam.id);

      router.push(`/public-exams/simulados/${mockExam.id}/tentativa/${attempt.id}`);
    } catch (e: unknown) {
      notify.error(
        t('toast.error'),
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('toast.somethingWrong')
      );
      setStartingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteMockExam(deleteTarget.id);
      removeMockExam(deleteTarget.id);
      const removedName = deleteTarget.name ?? deleteTarget.publicExam.name;

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

  if (isLoading) {
    return <SkeletonListLoader />;
  }

  if (!mockExams.length) {
    return (
      <EmptyState
        action={onCreateNew ? { label: t('simulado.tabNew'), onPress: onCreateNew } : undefined}
        description={t('simulado.noSimuladosDescription')}
        title={t('simulado.noSimulados')}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">{mockExams.map((m) => renderCard(m))}</div>

      <Modal isOpen={!!deleteTarget} onClose={() => !isDeleting && setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>{t('simulado.deleteTitle')}</ModalHeader>
          <ModalBody>
            <p className="text-default-500 text-sm">{t('simulado.deleteConfirm', { name: deleteTarget?.name ?? deleteTarget?.publicExam?.name ?? '' })}</p>
          </ModalBody>
          <ModalFooter>
            <Button className={buttonStyles.secondary} isDisabled={isDeleting} variant="bordered" onPress={() => setDeleteTarget(null)}>
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
    </>
  );

  function renderCard(m: MockExamListItem) {
    const isAnswered = m.attemptCount > 0;
    const isInProgress = m.openAttemptId != null;
    const isStarting = startingId === m.id;
    const attempts =
      m.attemptCount === 1
        ? t('simulado.attempt', { count: m.attemptCount })
        : t('simulado.attempts', { count: m.attemptCount });

    return (
      <div
        key={m.id}
        className={`bg-content1 border rounded-xl p-4 flex flex-col transition-all duration-300 ${
          isStarting
            ? 'border-primary shadow-[0_0_0_1px] shadow-primary/20'
            : startingId !== null
              ? 'border-default-200 opacity-40'
              : 'border-default-200'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold">{m.name ?? m.publicExam.name}</p>

          <Chip color={isInProgress ? 'warning' : isAnswered ? 'success' : 'warning'} size="sm" variant="flat">
            {isInProgress
              ? t('simulado.statusInProgress')
              : isAnswered
                ? t('simulado.statusAnswered')
                : t('simulado.statusPending')}
          </Chip>
        </div>

        <div className="flex justify-between mt-1">
          <p className="text-default-400 text-sm">{m.publicExam.name}</p>
          <p className="text-default-400 text-sm">
            {m.totalQuestions} questões · {attempts}
            {m.bestScore !== null && ` · ${t('simulado.bestScore', { score: m.bestScore, total: m.totalQuestions })}`}
          </p>
        </div>

        {isStarting ? (
          <div className="mt-6 flex flex-col gap-2">
            <p className="text-xs text-primary font-medium">{t('simulado.preparingAttempt')}</p>
            <Progress isIndeterminate aria-label={t('simulado.preparingAttempt')} color="primary" size="sm" />
          </div>
        ) : (
          <div className="flex flex-wrap justify-between mt-4">
            <div className="flex gap-2">
              <Button
                className={buttonStyles.primarySm}
                isDisabled={startingId !== null}
                size="sm"
                onPress={() => handleStart(m)}
              >
                {isInProgress ? t('simulado.continue') : isAnswered ? t('simulado.tryAgain') : t('simulado.respond')}
              </Button>
              {isAnswered && (
                <Button className={buttonStyles.secondary} size="sm" variant="bordered" onPress={() => setHistoryTarget(m)}>
                  {t('simulado.viewResults')}
                </Button>
              )}
            </div>
            <Button
              className="p-1.5 text-default-400 hover:text-danger hover:bg-danger/10 transition-colors"
              variant="light"
              onPress={() => setDeleteTarget(m)}
            >
              <FontAwesomeIcon className="w-5 h-5" icon={faTrash} />
            </Button>
          </div>
        )}
      </div>
    );
  }

  function renderHistoryModal(m: MockExamListItem) {
    return (
      <>
        <ModalHeader className="flex flex-col gap-1">
          <p>{t('simulado.attemptHistory')}</p>
          <p className="text-default-400 text-sm font-normal">{m.name ?? m.publicExam.name}</p>
        </ModalHeader>
        <ModalBody>
          {m.attempts.length === 0 ? (
            <p className="text-default-400 text-sm">{t('simulado.noSimulados')}</p>
          ) : (
            <div className="flex flex-col gap-2">{m.attempts.map((attempt, i) => renderAttemptRow(m, attempt, i))}</div>
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

  function renderAttemptRow(m: MockExamListItem, attempt: AttemptSummary, i: number) {
    const score = attempt.score ?? 0;
    const percent = m.totalQuestions > 0 ? Math.round((score / m.totalQuestions) * 100) : 0;
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
          <p className="text-sm font-semibold">{t('simulado.attemptNumber', { n: m.attempts.length - i })}</p>
          <p className="text-xs text-default-400">{date}</p>
        </div>
        <Chip className="font-semibold" color={scoreColor(percent)} size="sm" variant="flat">
          {t('simulado.attemptScore', { correct: score, total: m.totalQuestions, percent })}
        </Chip>
        <Button
          className={buttonStyles.secondary}
          size="sm"
          variant="bordered"
          onPress={() => {
            setHistoryTarget(null);
            router.push(`/public-exams/simulados/${m.id}/resultado/${attempt.id}`);
          }}
        >
          {t('simulado.viewAttempt')}
        </Button>
      </div>
    );
  }
}

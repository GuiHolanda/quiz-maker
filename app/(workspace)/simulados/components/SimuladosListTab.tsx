'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { useRouter } from 'next/navigation';
import { addToast } from '@heroui/toast';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useMockExamsContext } from '@/features/providers/mockExams.provider';
import { deleteMockExam, startMockExamAttempt } from '@/features/connectors';
import { MockExamListItem } from '@/shared/types';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type AttemptSummary = MockExamListItem['attempts'][number];

function scoreColor(percent: number): 'success' | 'warning' | 'danger' {
  if (percent >= 70) return 'success';
  if (percent >= 50) return 'warning';
  return 'danger';
}

export function SimuladosListTab() {
  const { t } = useTranslation();
  const { mockExams, removeMockExam } = useMockExamsContext();
  const [deleteTarget, setDeleteTarget] = useState<MockExamListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [historyTarget, setHistoryTarget] = useState<MockExamListItem | null>(null);
  const router = useRouter();

  async function handleStart(mockExam: MockExamListItem) {
    setStartingId(mockExam.id);
    try {
      const attempt = await startMockExamAttempt(mockExam.id);
      router.push(`/simulados/${mockExam.id}/tentativa/${attempt.id}`);
    } catch (e: unknown) {
      addToast({
        title: t('toast.error'),
        description:
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('toast.somethingWrong'),
        color: 'danger',
      });
      setStartingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteMockExam(deleteTarget.id);
      removeMockExam(deleteTarget.id);
      setDeleteTarget(null);
      addToast({ title: t('toast.success'), description: t('simulado.pageTitle'), color: 'success' });
    } catch (e: unknown) {
      addToast({
        title: t('toast.error'),
        description:
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('toast.somethingWrong'),
        color: 'danger',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  if (!mockExams.length) {
    return <p className="text-default-400 text-sm">{t('simulado.noSimulados')}</p>;
  }

  return (
    <>
      <div className="flex flex-col gap-4">{mockExams.map((m) => renderCard(m))}</div>

      <Modal isOpen={!!deleteTarget} onClose={() => !isDeleting && setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>{t('simulado.deleteConfirm')}</ModalHeader>
          <ModalBody>
            <p className="text-default-500">{deleteTarget?.name}</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" isDisabled={isDeleting} onPress={() => setDeleteTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button color="danger" isLoading={isDeleting} onPress={handleDelete}>
              {t('common.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={!!historyTarget} onClose={() => setHistoryTarget(null)} size="lg">
        <ModalContent>{historyTarget && renderHistoryModal(historyTarget)}</ModalContent>
      </Modal>
    </>
  );

  function renderCard(m: MockExamListItem) {
    const isAnswered = m.attemptCount > 0;
    const attempts =
      m.attemptCount === 1
        ? t('simulado.attempt', { count: m.attemptCount })
        : t('simulado.attempts', { count: m.attemptCount });

    return (
      <div key={m.id} className="bg-content1 border border-default-200 rounded-xl p-4 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold">{m.name ?? m.publicExam.name}</p>

          <Chip size="sm" color={isAnswered ? 'success' : 'warning'} variant="flat">
            {isAnswered ? t('simulado.statusAnswered') : t('simulado.statusPending')}
          </Chip>
        </div>
        
        <div className="flex justify-between mt-1">
          <p className="text-default-400 text-sm">{m.publicExam.name}</p>
          <p className="text-default-400 text-sm">
            {m.totalQuestions} questões · {attempts}
            {m.bestScore !== null && ` · ${t('simulado.bestScore', { score: m.bestScore, total: m.totalQuestions })}`}
          </p>
        </div>
        <div className="flex flex-wrap justify-between mt-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              color="primary"
              isLoading={startingId === m.id}
              isDisabled={startingId !== null}
              onPress={() => handleStart(m)}
            >
              {isAnswered ? t('simulado.tryAgain') : t('simulado.respond')}
            </Button>
            {isAnswered && (
              <Button size="sm" variant="bordered" onPress={() => setHistoryTarget(m)}>
                {t('simulado.viewResults')}
              </Button>
            )}
          </div>
          <Button
            variant="light"
            onPress={() => setDeleteTarget(m)}
            className="p-1.5 text-default-400 hover:text-danger hover:bg-danger/10 transition-colors"
          >
            <FontAwesomeIcon icon={faTrash} className="w-5 h-5" />
          </Button>
        </div>
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
          <Button variant="light" onPress={() => setHistoryTarget(null)}>
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
        <Chip size="sm" color={scoreColor(percent)} variant="flat" className="font-semibold">
          {t('simulado.attemptScore', { correct: score, total: m.totalQuestions, percent })}
        </Chip>
        <Button
          size="sm"
          variant="bordered"
          onPress={() => {
            setHistoryTarget(null);
            router.push(`/simulados/${m.id}/resultado/${attempt.id}`);
          }}
        >
          {t('simulado.viewAttempt')}
        </Button>
      </div>
    );
  }
}

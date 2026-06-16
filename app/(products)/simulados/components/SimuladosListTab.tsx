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

export function SimuladosListTab() {
  const { t } = useTranslation();
  const { mockExams, removeMockExam } = useMockExamsContext();
  const [deleteTarget, setDeleteTarget] = useState<MockExamListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [startingId, setStartingId] = useState<number | null>(null);
  const router = useRouter();

  async function handleStart(mockExam: MockExamListItem) {
    setStartingId(mockExam.id);
    try {
      const attempt = await startMockExamAttempt(mockExam.id);
      router.push(`/simulados/${mockExam.id}/tentativa/${attempt.id}`);
    } catch (e: unknown) {
      addToast({
        title: t('toast.error'),
        description: (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('toast.somethingWrong'),
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
        description: (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('toast.somethingWrong'),
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
      <div className="flex flex-col gap-4">
        {mockExams.map((m) => renderCard(m))}
      </div>

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
    </>
  );

  function renderCard(m: MockExamListItem) {
    const isAnswered = m.attemptCount > 0;
    const attempts =
      m.attemptCount === 1
        ? t('simulado.attempt', { count: m.attemptCount })
        : t('simulado.attempts', { count: m.attemptCount });

    return (
      <div key={m.id} className="border border-default-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{m.name ?? m.publicExam.name}</p>
            <p className="text-default-400 text-sm">
              {m.publicExam.name} · {m.totalQuestions} questões · {attempts}
              {m.bestScore !== null &&
                ` · ${t('simulado.bestScore', { score: m.bestScore, total: m.totalQuestions })}`}
            </p>
          </div>
          <Chip size="sm" color={isAnswered ? 'success' : 'warning'} variant="flat">
            {isAnswered ? t('simulado.statusAnswered') : t('simulado.statusPending')}
          </Chip>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            color="primary"
            isLoading={startingId === m.id}
            isDisabled={startingId !== null}
            onPress={() => handleStart(m)}
          >
            {isAnswered ? t('simulado.tryAgain') : t('simulado.respond')}
          </Button>
          {isAnswered && m.lastAttemptId && (
            <Button
              size="sm"
              variant="bordered"
              onPress={() => router.push(`/simulados/${m.id}/resultado/${m.lastAttemptId}`)}
            >
              {t('simulado.viewLastResult')}
            </Button>
          )}
          <Button size="sm" variant="light" color="danger" onPress={() => setDeleteTarget(m)}>
            {t('common.delete')}
          </Button>
        </div>
      </div>
    );
  }
}

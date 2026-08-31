'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { UnifiedSimulado } from './normalizeSimulado';
import { writeSimuladoPrefill } from '../create/simuladoPrefill';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useMockExamsContext } from '@/features/providers/mockExams.provider';
import { deleteMockExam, ensureMockExamAnswers, getMockExam, startMockExamAttempt } from '@/features/connectors';
import { notify } from '@/shared/lib/notify';

function extractMessage(error: unknown): string | undefined {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
}

export function useSimuladoActions() {
  const { t } = useTranslation();
  const mock = useMockExamsContext();
  const router = useRouter();

  const [deleteTarget, setDeleteTarget] = useState<UnifiedSimulado | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<UnifiedSimulado | null>(null);
  const [startingKey, setStartingKey] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);

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

  return {
    startingKey,
    deleteTarget,
    setDeleteTarget,
    isDeleting,
    historyTarget,
    setHistoryTarget,
    viewResult,
    handleStart,
    handleDuplicate,
    handleDelete,
  };
}

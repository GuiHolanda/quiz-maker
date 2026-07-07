'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';

import { SimuladoQuestionList } from '@/shared/components/SimuladoQuestionList';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useAttemptProgress } from '@/features/hooks/useAttemptProgress.hook';
import { getCertSimulado, finishCertSimuladoAttempt } from '@/features/connectors';
import { CertSimulado, CertSimuladoAttemptAnswer, SimuladoQuestion } from '@/shared/types';
import { BusyDialog } from '@/shared/components/ui/BusyDialog';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { notify } from '@/shared/lib/notify';
import { buttonStyles } from '@/config/constants/buttonStyles';

export default function CertSimuladoTentativaPage() {
  const { t } = useTranslation();
  const params = useParams<{ id: string; attemptId: string }>();
  const router = useRouter();
  const [simulado, setSimulado] = useState<CertSimulado | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [hasPendingDrafts, setHasPendingDrafts] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingNavTarget, setPendingNavTarget] = useState<string | null>(null);

  const { answers, handleAnswerChange, clearProgress } = useAttemptProgress(Number(params.attemptId));

  useEffect(() => {
    getCertSimulado(Number(params.id)).then(setSimulado);
  }, [params.id]);

  useEffect(() => {
    if (!hasPendingDrafts) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasPendingDrafts]);

  if (!simulado) {
    return (
      <PageHeader subtitle="" title="">
        <SkeletonListLoader count={5} height="h-32" />
      </PageHeader>
    );
  }

  const questions: SimuladoQuestion[] = simulado.questions.map((sq) => ({
    id: sq.question.id,
    simuladoQuestionId: sq.id,
    text: sq.question.text,
    correctCount: sq.question.correctCount,
    options: sq.question.options as Record<string, string>,
  }));

  function handleCancel() {
    const target = '/certifications/simulados';
    if (hasPendingDrafts) {
      setPendingNavTarget(target);
      setShowExitConfirm(true);
      return;
    }
    clearProgress();
    router.push(target);
  }

  function handleConfirmExit() {
    clearProgress();
    router.push(pendingNavTarget!);
  }

  async function handleFinish() {
    setIsFinishing(true);
    try {
      let score = 0;
      const attemptAnswers: CertSimuladoAttemptAnswer[] = simulado!.questions.map((sq) => {
        const selected = answers[sq.question.id] ?? [];
        const correctOptions: string[] = (sq.question.answer?.correctOptions as string[]) ?? [];
        const isCorrect =
          correctOptions.length > 0 &&
          selected.length === correctOptions.length &&
          selected.every((s) => correctOptions.includes(s));

        if (isCorrect) score += 1;

        return { simuladoQuestionId: sq.id, selectedOptions: selected };
      });

      await finishCertSimuladoAttempt(Number(params.id), Number(params.attemptId), {
        answers: attemptAnswers,
        score,
      });
      clearProgress();
      router.push(`/certifications/simulados/${params.id}/resultado/${params.attemptId}`);
    } catch (e: unknown) {
      notify.error(
        t('toast.error'),
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('toast.somethingWrong')
      );
      setIsFinishing(false);
    }
  }

  const title = simulado.name ?? simulado.certLabel;
  const subtitle = t('simulado.progress', {
    answered: Object.keys(answers).length,
    total: questions.length,
  });

  return (
    <>
      <BusyDialog isOpen={isFinishing} />
      <Modal isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)}>
        <ModalContent>
          <ModalHeader>{t('simulado.exitWithPendingTitle')}</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500">{t('simulado.exitWithPendingBody')}</p>
          </ModalBody>
          <ModalFooter>
            <Button className={buttonStyles.secondary} variant="bordered" onPress={() => setShowExitConfirm(false)}>
              {t('common.back')}
            </Button>
            <Button className={buttonStyles.dangerFlat} onPress={handleConfirmExit}>
              {t('simulado.exitAndLose')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <PageHeader subtitle={subtitle} title={title}>
        <SimuladoQuestionList
          answers={answers}
          questions={questions}
          onAnswerChange={handleAnswerChange}
          onCancel={handleCancel}
          onFinish={handleFinish}
          onPendingChange={setHasPendingDrafts}
        />
      </PageHeader>
    </>
  );
}

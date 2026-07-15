'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';

import { SimuladoQuestionList } from '@/shared/components/SimuladoQuestionList';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useAttemptProgress } from '@/features/hooks/useAttemptProgress.hook';
import { useNavigationGuard } from '@/features/hooks/useNavigationGuard.hook';
import { getMockExam, finishMockExamAttempt, discardMockExamAttempt } from '@/features/connectors';
import { MockExam, MockExamAttemptAnswer } from '@/shared/types';
import { BusyDialog } from '@/shared/components/ui/BusyDialog';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { notify } from '@/shared/lib/notify';
import { buttonStyles } from '@/config/constants/buttonStyles';

export default function SimuladoTentativaPage() {
  const { t } = useTranslation();
  const params = useParams<{ id: string; attemptId: string }>();
  const router = useRouter();
  const [mockExam, setMockExam] = useState<MockExam | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [hasPendingDrafts, setHasPendingDrafts] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const pendingProceedRef = useRef<(() => void) | null>(null);

  const { answers, handleAnswerChange, clearProgress } = useAttemptProgress(Number(params.attemptId));

  const handleBlockedNav = useCallback((proceed: () => void) => {
    pendingProceedRef.current = proceed;
    setShowExitConfirm(true);
  }, []);

  const { bypassNext } = useNavigationGuard(hasPendingDrafts, handleBlockedNav);

  useEffect(() => {
    getMockExam(Number(params.id)).then(setMockExam);
  }, [params.id]);

  if (!mockExam) {
    return (
      <PageHeader subtitle="" title="">
        <SkeletonListLoader count={5} height="h-32" />
      </PageHeader>
    );
  }

  const questions = mockExam.questions.map((mq) => ({
    id: mq.publicExamQuestion.id,
    simuladoQuestionId: mq.id,
    text: mq.publicExamQuestion.text,
    correctCount: mq.publicExamQuestion.correctCount,
    options: mq.publicExamQuestion.options as Record<string, string>,
  }));

  function handleCancel() {
    setShowDiscardConfirm(true);
  }

  async function handleConfirmDiscard() {
    setIsDiscarding(true);
    try {
      await discardMockExamAttempt(Number(params.id), Number(params.attemptId));
      clearProgress();
      setShowDiscardConfirm(false);
      bypassNext();
      router.push('/public-exams/simulados');
    } catch (e: unknown) {
      notify.error(
        t('toast.error'),
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('toast.somethingWrong')
      );
      setIsDiscarding(false);
    }
  }

  function handleModalBack() {
    pendingProceedRef.current = null;
    setShowExitConfirm(false);
  }

  function handleConfirmExit() {
    setShowExitConfirm(false);
    const proceed = pendingProceedRef.current;

    pendingProceedRef.current = null;
    if (proceed) {
      proceed();
      return;
    }
    bypassNext();
    router.push('/public-exams/simulados');
  }

  async function handleFinish() {
    setIsFinishing(true);
    try {
      const attemptAnswers: MockExamAttemptAnswer[] = mockExam!.questions.map((mq) => {
        const selected = answers[mq.publicExamQuestion.id] ?? [];

        return { mockExamQuestionId: mq.id, selectedOptions: selected };
      });

      await finishMockExamAttempt(Number(params.id), Number(params.attemptId), { answers: attemptAnswers });
      clearProgress();
      bypassNext();
      router.push(`/public-exams/simulados/${params.id}/resultado/${params.attemptId}`);
    } catch (e: unknown) {
      notify.error(
        t('toast.error'),
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('toast.somethingWrong')
      );
      setIsFinishing(false);
    }
  }

  const title = mockExam.name ?? mockExam.publicExam.name;
  const subtitle = t('simulado.progress', {
    answered: Object.keys(answers).length,
    total: questions.length,
  });

  return (
    <>
      <BusyDialog isOpen={isFinishing} />
      <Modal isOpen={showDiscardConfirm} onClose={() => !isDiscarding && setShowDiscardConfirm(false)}>
        <ModalContent>
          <ModalHeader>{t('simulado.discardAttemptTitle')}</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500">{t('simulado.discardAttemptBody')}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              className={buttonStyles.secondary}
              isDisabled={isDiscarding}
              variant="bordered"
              onPress={() => setShowDiscardConfirm(false)}
            >
              {t('common.back')}
            </Button>
            <Button className={buttonStyles.danger} isLoading={isDiscarding} onPress={handleConfirmDiscard}>
              {t('simulado.discardAttempt')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={showExitConfirm} onClose={handleModalBack}>
        <ModalContent>
          <ModalHeader>{t('simulado.exitWithPendingTitle')}</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500">{t('simulado.exitWithPendingBody')}</p>
          </ModalBody>
          <ModalFooter>
            <Button className={buttonStyles.secondary} variant="bordered" onPress={handleModalBack}>
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

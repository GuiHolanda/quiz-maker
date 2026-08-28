'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';

import { SimuladoQuestionList } from '@/shared/components/SimuladoQuestionList';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useAttemptProgress } from '@/features/hooks/useAttemptProgress.hook';
import { useAttemptDeadline } from '@/features/hooks/useAttemptDeadline.hook';
import { useNavigationGuard } from '@/features/hooks/useNavigationGuard.hook';
import { getMockExam, finishMockExamAttempt, discardMockExamAttempt } from '@/features/connectors';
import { MockExam, MockExamAttemptAnswer } from '@/shared/types';
import { BusyDialog } from '@/shared/components/ui/BusyDialog';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { notify } from '@/shared/lib/notify';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';

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
  const finishingRef = useRef(false);

  const { answers, handleAnswerChange, clearProgress } = useAttemptProgress(Number(params.attemptId));

  const handleBlockedNav = useCallback((proceed: () => void) => {
    pendingProceedRef.current = proceed;
    setShowExitConfirm(true);
  }, []);

  const { bypassNext } = useNavigationGuard(hasPendingDrafts, handleBlockedNav);

  useEffect(() => {
    getMockExam(Number(params.id)).then(setMockExam);
  }, [params.id]);

  const currentAttempt = mockExam?.attempts.find((attempt) => attempt.id === Number(params.attemptId)) ?? null;

  const {
    enabled: timerOn,
    remainingMs,
    label: remainingLabel,
  } = useAttemptDeadline({
    startedAt: currentAttempt?.startedAt ?? null,
    durationMinutes: mockExam?.durationMinutes ?? null,
    onExpire: () => handleFinish(),
  });

  if (!mockExam) {
    return (
      <PageHeader
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem href="/">{t('nav.dashboard')}</BreadcrumbItem>
            <BreadcrumbItem href="/simulados">{t('nav.simulados')}</BreadcrumbItem>
            <BreadcrumbItem>{t('nav.simuladoAttempt')}</BreadcrumbItem>
          </Breadcrumbs>
        }
        subtitle=""
        title=""
      >
        <SkeletonListLoader count={5} height="h-32" />
      </PageHeader>
    );
  }

  const questions = mockExam.questions.map((mq) => ({
    id: mq.examQuestion.id,
    simuladoQuestionId: mq.id,
    text: mq.examQuestion.text,
    correctCount: mq.examQuestion.correctCount,
    options: mq.examQuestion.options as Record<string, string>,
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
      router.push('/simulados');
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
    router.push('/simulados');
  }

  async function handleFinish() {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setIsFinishing(true);
    try {
      const attemptAnswers: MockExamAttemptAnswer[] = mockExam!.questions.map((mq) => {
        const selected = answers[mq.examQuestion.id] ?? [];

        return { mockExamQuestionId: mq.id, selectedOptions: selected };
      });

      await finishMockExamAttempt(Number(params.id), Number(params.attemptId), { answers: attemptAnswers });
      clearProgress();
      bypassNext();
      router.push(`/simulados/${params.id}/resultado/${params.attemptId}`);
    } catch (e: unknown) {
      finishingRef.current = false;
      notify.error(
        t('toast.error'),
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('toast.somethingWrong')
      );
      setIsFinishing(false);
    }
  }

  const title = mockExam.name ?? mockExam.exam.name;
  const subtitle = t('simulado.progress', {
    answered: Object.keys(answers).length,
    total: questions.length,
  });

  const timer = timerOn ? (
    <span
      aria-live="polite"
      data-testid="simulado-timer"
      className={`font-mono text-sm font-semibold tabular-nums ${
        remainingMs < 60_000 ? 'text-danger' : remainingMs < 5 * 60_000 ? 'text-warning' : 'text-default-500'
      }`}
    >
      {t('simulado.timer.remaining', { time: remainingLabel })}
    </span>
  ) : undefined;

  return (
    <>
      <BusyDialog isOpen={isFinishing} />
      <ConfirmModal
        body={<p className="text-sm text-default-500">{t('simulado.discardAttemptBody')}</p>}
        cancelLabel={t('common.back')}
        confirmLabel={t('simulado.discardAttempt')}
        confirmTestId="confirm-discard-attempt-btn"
        isLoading={isDiscarding}
        isOpen={showDiscardConfirm}
        title={t('simulado.discardAttemptTitle')}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={handleConfirmDiscard}
      />
      <ConfirmModal
        body={<p className="text-sm text-default-500">{t('simulado.exitWithPendingBody')}</p>}
        cancelLabel={t('common.back')}
        confirmLabel={t('simulado.exitAndLose')}
        confirmVariant="dangerFlat"
        isOpen={showExitConfirm}
        title={t('simulado.exitWithPendingTitle')}
        onClose={handleModalBack}
        onConfirm={handleConfirmExit}
      />
      <PageHeader
        action={timer}
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem href="/">{t('nav.dashboard')}</BreadcrumbItem>
            <BreadcrumbItem href="/simulados">{t('nav.simulados')}</BreadcrumbItem>
            <BreadcrumbItem>{t('nav.simuladoAttempt')}</BreadcrumbItem>
          </Breadcrumbs>
        }
        subtitle={subtitle}
        title={title}
      >
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

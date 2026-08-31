'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useAttemptProgress } from '@/features/hooks/useAttemptProgress.hook';
import { useAttemptDeadline } from '@/features/hooks/useAttemptDeadline.hook';
import { useNavigationGuard } from '@/features/hooks/useNavigationGuard.hook';
import { discardMockExamAttempt, finishMockExamAttempt, getMockExam } from '@/features/connectors';
import { MockExam, MockExamAttemptAnswer } from '@/shared/types';
import { BusyDialog } from '@/shared/components/ui/BusyDialog';
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { notify } from '@/shared/lib/notify';

import { AttemptTopBar } from './AttemptTopBar';
import { AttemptQuestionPanel } from './AttemptQuestionPanel';
import { AttemptNavigatorCard } from './AttemptNavigatorCard';
import { AttemptProgressCard } from './AttemptProgressCard';
import { AttemptSummaryModal } from './AttemptSummaryModal';
import { useAttemptPause } from './useAttemptPause.hook';
import { AttemptQuestion, useAttemptRunner } from './useAttemptRunner.hook';
import { formatElapsed, formatMMSS, formatPerQuestion } from './attemptFormat';

const CRITICAL_MS = 5 * 60_000;

interface AttemptShellProps {
  readonly mockExamId: number;
  readonly attemptId: number;
}

export function AttemptShell({ mockExamId, attemptId }: AttemptShellProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [mockExam, setMockExam] = useState<MockExam | null>(null);
  const [modal, setModal] = useState<'finish' | 'exit' | 'discard' | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const finishingRef = useRef(false);
  const pendingProceedRef = useRef<(() => void) | null>(null);

  const { answers, handleAnswerChange, clearProgress } = useAttemptProgress(attemptId);
  const { paused, pauseOffsetMs, togglePause, clearPause } = useAttemptPause(attemptId);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    getMockExam(mockExamId).then(setMockExam);
  }, [mockExamId]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const currentAttempt = mockExam?.attempts.find((attempt) => attempt.id === attemptId) ?? null;

  const questions: AttemptQuestion[] = useMemo(
    () =>
      (mockExam?.questions ?? []).map((mq) => ({
        mockExamQuestionId: mq.id,
        examQuestionId: mq.examQuestion.id,
        order: mq.order,
        text: mq.examQuestion.text,
        correctCount: mq.examQuestion.correctCount,
        topic: mq.examQuestion.topic ?? mq.examQuestion.sectionName ?? '',
        options: mq.examQuestion.options as Record<string, string>,
      })),
    [mockExam]
  );

  const runner = useAttemptRunner(questions, answers);

  const handleBlockedNav = useCallback((proceed: () => void) => {
    pendingProceedRef.current = proceed;
    setModal('exit');
  }, []);

  const { bypassNext } = useNavigationGuard(Boolean(currentAttempt) && !currentAttempt?.finishedAt, handleBlockedNav);

  const handleFinish = useCallback(async () => {
    if (finishingRef.current || !mockExam) return;
    finishingRef.current = true;
    setModal(null);
    setIsFinishing(true);
    try {
      const attemptAnswers: MockExamAttemptAnswer[] = mockExam.questions.map((mq) => ({
        mockExamQuestionId: mq.id,
        selectedOptions: answers[mq.examQuestion.id] ?? [],
      }));
      await finishMockExamAttempt(mockExamId, attemptId, { answers: attemptAnswers });
      clearProgress();
      clearPause();
      bypassNext();
      router.push(`/simulados/${mockExamId}/resultado/${attemptId}`);
    } catch (e: unknown) {
      finishingRef.current = false;
      setIsAutoSubmitting(false);
      setIsFinishing(false);
      notify.error(
        t('toast.error'),
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('toast.somethingWrong')
      );
    }
  }, [mockExam, answers, mockExamId, attemptId, clearProgress, clearPause, bypassNext, router, t]);

  const handleExpire = useCallback(() => {
    if (finishingRef.current) return;
    setIsAutoSubmitting(true);
    handleFinish();
  }, [handleFinish]);

  const timed = mockExam?.durationMinutes != null;
  const {
    remainingMs,
    elapsedMs,
    label: remainingLabel,
  } = useAttemptDeadline({
    startedAt: currentAttempt?.startedAt ?? null,
    durationMinutes: mockExam?.durationMinutes ?? null,
    onExpire: handleExpire,
    nowOffsetMs: pauseOffsetMs,
  });

  const handleSelect = useCallback(
    (optionKey: string) => {
      const question = runner.currentQuestion;
      if (!question) return;
      const current = answers[question.examQuestionId] ?? [];
      const isMulti = question.correctCount > 1;
      const next = isMulti
        ? current.includes(optionKey)
          ? current.filter((key) => key !== optionKey)
          : [...current, optionKey]
        : [optionKey];
      handleAnswerChange(question.examQuestionId, next);
    },
    [runner, answers, handleAnswerChange]
  );

  const handleNext = useCallback(() => {
    if (runner.isLast) {
      setModal('finish');
      return;
    }
    runner.next();
  }, [runner]);

  const handleExitConfirm = useCallback(() => {
    setModal(null);
    const proceed = pendingProceedRef.current;
    pendingProceedRef.current = null;
    bypassNext();
    if (proceed) {
      proceed();
      return;
    }
    router.push('/simulados');
  }, [bypassNext, router]);

  const handleModalClose = useCallback(() => {
    pendingProceedRef.current = null;
    setModal(null);
  }, []);

  const handleDiscardConfirm = useCallback(async () => {
    setIsDiscarding(true);
    try {
      await discardMockExamAttempt(mockExamId, attemptId);
      clearProgress();
      clearPause();
      bypassNext();
      router.push('/simulados');
    } catch (e: unknown) {
      notify.error(
        t('toast.error'),
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('toast.somethingWrong')
      );
      setIsDiscarding(false);
    }
  }, [mockExamId, attemptId, clearProgress, clearPause, bypassNext, router, t]);

  const currentQuestion = runner.currentQuestion;

  if (!mounted) return null;

  if (!mockExam || !currentQuestion) {
    return createPortal(
      <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
        <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-12">
          <SkeletonListLoader count={4} height="h-32" />
        </div>
      </div>,
      document.body
    );
  }

  const title = mockExam.name ?? mockExam.exam.name;
  const metaLine = timed
    ? t('simulado.attempt.metaTimed', {
        exam: mockExam.exam.name,
        count: questions.length,
        minutes: mockExam.durationMinutes ?? 0,
      })
    : t('simulado.attempt.metaUntimed', { exam: mockExam.exam.name, count: questions.length });
  const critical = Boolean(timed) && remainingMs <= CRITICAL_MS;
  const elapsedLabel = formatElapsed(elapsedMs);
  const perQuestionLabel = formatPerQuestion(remainingMs, runner.openCount);
  const selected = answers[currentQuestion.examQuestionId] ?? [];

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <AttemptTopBar
        critical={critical}
        metaLine={metaLine}
        onExit={() => setModal('exit')}
        onTogglePause={togglePause}
        paused={paused}
        progressPercent={runner.progressPercent}
        remainingLabel={remainingLabel}
        remainingMs={remainingMs}
        timed={Boolean(timed)}
        title={title}
      />

      <div className="mx-auto max-w-[1520px] px-4 py-8 md:px-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <AttemptQuestionPanel
            key={currentQuestion.mockExamQuestionId}
            answeredCount={runner.answeredCount}
            index={runner.currentIndex + 1}
            isFirst={runner.isFirst}
            isLast={runner.isLast}
            multi={currentQuestion.correctCount > 1}
            onNext={handleNext}
            onPrev={runner.prev}
            onSelect={handleSelect}
            onSkip={runner.skip}
            openCount={runner.openCount}
            question={currentQuestion}
            selected={selected}
            topic={currentQuestion.topic}
            total={runner.total}
          />

          <div className="flex flex-col gap-4 lg:sticky lg:top-24">
            <AttemptProgressCard
              answeredCount={runner.answeredCount}
              critical={critical}
              elapsedLabel={elapsedLabel}
              onFinish={() => setModal('finish')}
              perQuestionLabel={perQuestionLabel}
              progressPercent={runner.progressPercent}
              remainingLabel={remainingLabel}
              timed={Boolean(timed)}
              total={runner.total}
            />
            <AttemptNavigatorCard
              counts={{
                answered: runner.answeredCount,
                skipped: runner.skippedCount,
                unvisited: runner.unvisitedCount,
              }}
              currentNumber={runner.currentIndex + 1}
              items={runner.navigatorItems}
              onJump={runner.goTo}
              percentLabel={`${runner.progressPercent}%`}
            />
          </div>
        </div>
      </div>

      <span aria-live="polite" className="sr-only" role="status">
        {t('simulado.attempt.questionCounter', { current: runner.currentIndex + 1, total: runner.total })}
      </span>

      <AttemptSummaryModal
        isBusy={isFinishing}
        isOpen={modal === 'finish'}
        onClose={handleModalClose}
        onConfirm={handleFinish}
        summary={{
          answered: runner.answeredCount,
          skipped: runner.skippedCount,
          open: runner.openCount,
          remainingLabel: timed ? formatMMSS(remainingMs) : null,
        }}
        variant="finish"
      />
      <AttemptSummaryModal
        isOpen={modal === 'exit'}
        onClose={handleModalClose}
        onConfirm={handleExitConfirm}
        onDiscard={() => setModal('discard')}
        summary={{
          answered: runner.answeredCount,
          skipped: runner.skippedCount,
          open: runner.openCount,
          remainingLabel: timed ? formatMMSS(remainingMs) : null,
        }}
        variant="exit"
      />
      <ConfirmModal
        body={<p className="text-sm text-default-500">{t('simulado.discardAttemptBody')}</p>}
        cancelLabel={t('common.back')}
        confirmLabel={t('simulado.discardAttempt')}
        confirmTestId="confirm-discard-attempt-btn"
        isLoading={isDiscarding}
        isOpen={modal === 'discard'}
        title={t('simulado.discardAttemptTitle')}
        onClose={() => setModal('exit')}
        onConfirm={handleDiscardConfirm}
      />

      <BusyDialog isOpen={isFinishing} label={isAutoSubmitting ? t('simulado.timer.autoSubmitting') : undefined} />
    </div>,
    document.body
  );
}

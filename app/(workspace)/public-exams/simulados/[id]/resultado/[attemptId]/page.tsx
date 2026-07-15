'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { Progress } from '@heroui/progress';
import { Skeleton } from '@heroui/skeleton';

import { ResultQuestionCard } from '@/shared/components/ResultQuestionCard';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import {
  ensureMockExamAnswers,
  getMockExamAttemptResult,
  startMockExamAttempt,
  getQuestionExplanation,
} from '@/features/connectors';
import { MockExamResult, SimuladoResultQuestion } from '@/shared/types';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { buttonStyles } from '@/config/constants/buttonStyles';

function scoreColor(percent: number): 'success' | 'warning' | 'danger' {
  if (percent >= 70) return 'success';
  if (percent >= 50) return 'warning';

  return 'danger';
}

const scoreTextColor = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
} as const;

export default function SimuladoResultadoPage() {
  const { t } = useTranslation();
  const params = useParams<{ id: string; attemptId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<MockExamResult | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = await getMockExamAttemptResult(Number(params.id), Number(params.attemptId));

      if (cancelled) return;

      const hasMissingAnswer = data.questions.some((mq) => !mq.publicExamQuestion.answer);

      if (hasMissingAnswer) {
        try {
          await ensureMockExamAnswers(Number(params.id));
          const refreshed = await getMockExamAttemptResult(Number(params.id), Number(params.attemptId));

          if (!cancelled) setResult(refreshed);

          return;
        } catch {
          // fall back to whatever we already have — better partial than blank
        }
      }
      setResult(data);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [params.id, params.attemptId]);

  if (!result) {
    return (
      <PageHeader subtitle="" title={t('simulado.scoreTitle')}>
        <div className="flex flex-col gap-4">
          <Progress
            isIndeterminate
            aria-label={t('simulado.calculating')}
            classNames={{ label: 'text-xs font-extrabold' }}
            color="primary"
            label={t('simulado.calculating')}
            size="sm"
          />
          <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6">
            <Skeleton className="h-3 w-24 rounded-lg" />
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-4 w-12 rounded-lg" />
              </div>
              <div className="hidden sm:block self-stretch border-r border-default-200" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 flex-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <Skeleton className="h-3 w-16 rounded-lg" />
                    <Skeleton className="h-4 w-20 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-default-200 pt-4 flex gap-3">
              <Skeleton className="h-9 w-32 rounded-lg" />
              <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-36 rounded-lg" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-content1 border border-default-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <Skeleton className="h-4 flex-1 max-w-48 rounded-lg" />
                <Skeleton className="h-6 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </PageHeader>
    );
  }

  const total = result.questions.length;
  const correct = result.attempt.score ?? 0;
  const errors = total - correct;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const color = scoreColor(percent);

  const answersMap = new Map(result.attempt.answers.map((a) => [a.mockExamQuestionId, a.selectedOptions]));

  const mappedQuestions: SimuladoResultQuestion[] = result.questions.map((mq) => ({
    id: mq.publicExamQuestion.id,
    simuladoQuestionId: mq.id,
    order: mq.order,
    groupLabel: mq.publicExamQuestion.subject ?? t('simulado.unknownSubject'),
    text: mq.publicExamQuestion.text,
    correctCount: mq.publicExamQuestion.correctCount,
    options: mq.publicExamQuestion.options as Record<string, string>,
    answer: mq.publicExamQuestion.answer
      ? { correctOptions: mq.publicExamQuestion.answer.correctOptions as string[] }
      : null,
  }));

  const questionsBySubject = mappedQuestions.reduce<Record<string, SimuladoResultQuestion[]>>((acc, q) => {
    if (!acc[q.groupLabel]) acc[q.groupLabel] = [];
    acc[q.groupLabel].push(q);

    return acc;
  }, {});

  const finishedAt = result.attempt.finishedAt
    ? new Date(result.attempt.finishedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  async function handleTryAgain() {
    setIsStarting(true);
    try {
      const attempt = await startMockExamAttempt(Number(params.id));

      router.push(`/public-exams/simulados/${params.id}/tentativa/${attempt.id}`);
    } finally {
      setIsStarting(false);
    }
  }

  const examName = result.mockExam.name ?? result.mockExam.publicExam.name;

  return (
    <>
      <PageHeader subtitle={examName} title={t('simulado.scoreTitle')}>
        <div className="flex flex-col gap-6">
          {renderInfoCard()}
          {renderSubjectAccordion()}
        </div>
      </PageHeader>
    </>
  );

  function renderInfoCard() {
    return (
      <div className="bg-content1 border border-default-200 rounded-xl p-6">
        <p className="text-xs font-semibold text-primary mb-4">{t('simulado.resultInfo')}</p>

        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className={`text-3xl font-extrabold ${scoreTextColor[color]}`}>
              {t('simulado.scoreGeneral', { correct, total })}
            </div>
            <p className="text-sm text-default-500">{t('simulado.scorePercent', { percent })}</p>
          </div>

          <div className="hidden sm:block self-stretch border-r border-default-200" />

          <div className="grid grid-cols-2 gap-x-8 gap-y-3 flex-1">
            {renderStat(t('simulado.totalQuestions'), String(total))}
            {renderStat(t('simulado.dateLabel'), finishedAt)}
            {renderStat(t('simulado.correct'), String(correct), 'text-success')}
            {renderStat(t('simulado.errorsLabel'), String(errors), 'text-danger')}
          </div>
        </div>

        <div className="border-t border-default-200 mt-6 pt-4 flex gap-3">
          <Button className={buttonStyles.primary} isLoading={isStarting} onPress={handleTryAgain}>
            {t('simulado.tryAgain')}
          </Button>
          <Button variant="bordered" onPress={() => router.push('/public-exams/simulados')}>
            {t('simulado.backToList')}
          </Button>
        </div>
      </div>
    );
  }

  function renderStat(label: string, value: string, valueClass = 'text-foreground') {
    return (
      <div className="flex flex-col gap-0.5">
        <p className="text-xs text-default-400">{label}</p>
        <p className={`text-sm font-semibold ${valueClass}`}>{value}</p>
      </div>
    );
  }

  function renderSubjectAccordion() {
    return (
      <div>
        <h2 className="font-semibold mb-3 text-foreground">{t('simulado.bySubject')}</h2>
        <Accordion
          className="flex flex-col gap-2 px-0"
          itemClasses={{
            base: 'bg-content1 border border-default-200 rounded-xl',
            title: 'text-sm font-semibold text-foreground',
            titleWrapper: 'flex-1 min-w-0',
            trigger: 'px-4 py-3 hover:bg-default-100 rounded-xl transition-colors duration-200',
            content: 'px-4 pb-4',
            indicator: 'text-default-400',
          }}
          showDivider={false}
        >
          {result!.subjectBreakdown.map((s) => {
            const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
            const questions = questionsBySubject[s.subjectName] ?? [];

            return (
              <AccordionItem
                key={s.subjectName}
                aria-label={s.subjectName}
                title={
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="truncate flex-1 min-w-0">{s.subjectName}</span>
                    <Chip className="shrink-0 font-semibold" color={scoreColor(pct)} size="sm" variant="flat">
                      {s.correct}/{s.total} — {pct}%
                    </Chip>
                  </div>
                }
              >
                <div className="flex flex-col gap-2 pt-1">
                  {questions.map((q, i) => (
                    <ResultQuestionCard
                      key={q.simuladoQuestionId}
                      localIndex={i}
                      question={q}
                      selected={answersMap.get(q.simuladoQuestionId) ?? []}
                      showDivider={i > 0}
                      onLoadExplanation={getQuestionExplanation}
                    />
                  ))}
                </div>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    );
  }
}

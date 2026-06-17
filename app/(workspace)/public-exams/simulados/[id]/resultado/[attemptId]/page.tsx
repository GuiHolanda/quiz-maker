'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { getMockExamAttemptResult, startMockExamAttempt } from '@/features/connectors';
import { MockExamResult, MockExamQuestion } from '@/shared/types';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { ResultQuestionCard } from './components/ResultQuestionCard';

function scoreColor(percent: number): 'success' | 'warning' | 'danger' {
  if (percent >= 70) return 'success';
  if (percent >= 50) return 'warning';
  return 'danger';
}

export default function SimuladoResultadoPage() {
  const { t } = useTranslation();
  const params = useParams<{ id: string; attemptId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<MockExamResult | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    getMockExamAttemptResult(Number(params.id), Number(params.attemptId)).then(setResult);
  }, [params.id, params.attemptId]);

  if (!result) return null;

  const total = result.questions.length;
  const correct = result.attempt.score ?? 0;
  const errors = total - correct;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const color = scoreColor(percent);

  const answersMap = new Map(result.attempt.answers.map((a) => [a.mockExamQuestionId, a.selectedOptions]));

  const questionsBySubject = result.questions.reduce<Record<string, MockExamQuestion[]>>((acc, mq) => {
    const subject = mq.publicExamQuestion.subject ?? t('simulado.unknownSubject');
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(mq);
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
      router.push(`/simulados/${params.id}/tentativa/${attempt.id}`);
    } finally {
      setIsStarting(false);
    }
  }

  const examName = result.mockExam.name ?? result.mockExam.publicExam.name;

  return (
    <>
      <PageHeader title={t('simulado.scoreTitle')} subtitle={examName}>
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
            <Chip color={color} variant="flat" className="text-2xl px-6 py-4 h-auto font-bold">
              {t('simulado.scoreGeneral', { correct, total })}
            </Chip>
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
          <Button color="primary" isLoading={isStarting} onPress={handleTryAgain}>
            {t('simulado.tryAgain')}
          </Button>
          <Button variant="bordered" onPress={() => router.push('/simulados')}>
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
          showDivider={false}
          className="flex flex-col gap-2 px-0"
          itemClasses={{
            base: 'bg-content1 border border-default-200 rounded-xl',
            title: 'text-sm font-semibold text-foreground',
            titleWrapper: 'flex-1 min-w-0',
            trigger: 'px-4 py-3 hover:bg-default-100 rounded-xl transition-colors duration-200',
            content: 'px-4 pb-4',
            indicator: 'text-default-400',
          }}
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
                    <Chip size="sm" color={scoreColor(pct)} variant="flat" className="shrink-0 font-semibold">
                      {s.correct}/{s.total} — {pct}%
                    </Chip>
                  </div>
                }
              >
                <div className="flex flex-col gap-2 pt-1">
                  {questions.map((mq, i) => (
                    <ResultQuestionCard
                      key={mq.id}
                      mq={mq}
                      selected={answersMap.get(mq.id) ?? []}
                      localIndex={i}
                      showDivider={i > 0}
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

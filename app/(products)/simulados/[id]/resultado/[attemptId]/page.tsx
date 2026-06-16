'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { getMockExamAttemptResult, startMockExamAttempt } from '@/features/connectors';
import { MockExamResult } from '@/shared/types';

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
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const color = scoreColor(percent);
  const answersMap = new Map(result.attempt.answers.map((a) => [a.mockExamQuestionId, a.selectedOptions]));

  async function handleTryAgain() {
    setIsStarting(true);
    try {
      const attempt = await startMockExamAttempt(Number(params.id));
      router.push(`/simulados/${params.id}/tentativa/${attempt.id}`);
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 flex flex-col gap-8">
      {renderScoreHeader()}
      {renderSubjectBreakdown()}
      {renderQuestionReview()}
      {renderActions()}
    </div>
  );

  function renderScoreHeader() {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">{t('simulado.scoreTitle')}</h1>
        <p className="text-default-500 text-sm mb-4">{result!.mockExam.name ?? result!.mockExam.publicExam.name}</p>
        <Chip color={color} variant="flat" size="lg" className="text-xl px-6 py-4 h-auto">
          {t('simulado.scoreGeneral', { correct, total })} — {t('simulado.scorePercent', { percent })}
        </Chip>
      </div>
    );
  }

  function renderSubjectBreakdown() {
    return (
      <div>
        <h2 className="font-semibold mb-3">{t('simulado.bySubject')}</h2>
        <div className="border border-default-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-default-100">
              <tr>
                <th className="text-left p-3">{t('simulado.subjectHeader')}</th>
                <th className="text-center p-3">{t('simulado.correctHeader')}</th>
                <th className="text-center p-3">{t('simulado.totalHeader')}</th>
                <th className="text-center p-3">{t('simulado.percentHeader')}</th>
              </tr>
            </thead>
            <tbody>
              {result!.subjectBreakdown.map((s) => {
                const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                return (
                  <tr key={s.subjectName} className="border-t border-default-100">
                    <td className="p-3">{s.subjectName}</td>
                    <td className="text-center p-3">{s.correct}</td>
                    <td className="text-center p-3">{s.total}</td>
                    <td className="text-center p-3">
                      <Chip size="sm" color={scoreColor(pct)} variant="flat">
                        {pct}%
                      </Chip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderQuestionReview() {
    return (
      <div>
        <h2 className="font-semibold mb-3">{t('simulado.questionReview')}</h2>
        <div className="flex flex-col gap-4">
          {result!.questions.map((mq) => {
            const selected = answersMap.get(mq.id) ?? [];
            const correctOptions: string[] = (mq.publicExamQuestion.answer?.correctOptions as string[]) ?? [];
            const isCorrect =
              correctOptions.length > 0 &&
              selected.length === correctOptions.length &&
              selected.every((s) => correctOptions.includes(s));

            return (
              <div
                key={mq.id}
                className={`border-l-4 rounded-r-xl p-4 ${isCorrect ? 'border-success bg-success-50' : 'border-danger bg-danger-50'}`}
              >
                <p className="text-xs text-default-400 mb-1">{mq.publicExamQuestion.subject}</p>
                <p className="text-sm mb-3">{mq.publicExamQuestion.text}</p>
                <p className="text-xs mb-1">
                  <span className="font-semibold">{t('simulado.yourAnswer')}:</span>{' '}
                  {selected.length > 0 ? selected.join(', ') : '—'}
                </p>
                <p className="text-xs mb-1">
                  <span className="font-semibold">{t('simulado.correctAnswer')}:</span>{' '}
                  {correctOptions.join(', ')}
                </p>
                {mq.publicExamQuestion.answer?.explanations &&
                  Object.entries(mq.publicExamQuestion.answer.explanations).map(([label, text]) => (
                    <p key={label} className="text-xs text-default-500 mt-1">
                      <span className="font-semibold">{label})</span> {text as string}
                    </p>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderActions() {
    return (
      <div className="flex gap-3">
        <Button color="primary" isLoading={isStarting} onPress={handleTryAgain}>
          {t('simulado.tryAgain')}
        </Button>
        <Button variant="bordered" onPress={() => router.push('/simulados')}>
          {t('simulado.backToList')}
        </Button>
      </div>
    );
  }
}

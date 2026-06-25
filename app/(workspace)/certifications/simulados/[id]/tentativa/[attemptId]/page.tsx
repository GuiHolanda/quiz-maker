'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { SimuladoQuestionList } from '@/shared/components/SimuladoQuestionList';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { getCertSimulado, finishCertSimuladoAttempt } from '@/features/connectors';
import { CertSimulado, CertSimuladoAttemptAnswer, AnswersMap, SimuladoQuestion } from '@/shared/types';
import { BusyDialog } from '@/shared/components/ui/BusyDialog';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { notify } from '@/shared/lib/notify';

export default function CertSimuladoTentativaPage() {
  const { t } = useTranslation();
  const params = useParams<{ id: string; attemptId: string }>();
  const router = useRouter();
  const [simulado, setSimulado] = useState<CertSimulado | null>(null);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    getCertSimulado(Number(params.id)).then(setSimulado);
  }, [params.id]);

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

  function handleAnswerChange(questionId: number, selected: string[]) {
    setAnswers((prev) => ({ ...prev, [questionId]: selected }));
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
      <PageHeader subtitle={subtitle} title={title}>
        <SimuladoQuestionList
          answers={answers}
          questions={questions}
          onAnswerChange={handleAnswerChange}
          onFinish={handleFinish}
        />
      </PageHeader>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { SimuladoQuestionList } from '@/shared/components/SimuladoQuestionList';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { getMockExam, getMockExamAnswers, finishMockExamAttempt } from '@/features/connectors';
import { MockExam, MockExamAttemptAnswer, AnswersMap } from '@/shared/types';
import { BusyDialog } from '@/shared/components/ui/BusyDialog';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { notify } from '@/shared/lib/notify';

export default function SimuladoTentativaPage() {
  const { t } = useTranslation();
  const params = useParams<{ id: string; attemptId: string }>();
  const router = useRouter();
  const [mockExam, setMockExam] = useState<MockExam | null>(null);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    getMockExam(Number(params.id)).then(setMockExam);
  }, [params.id]);

  if (!mockExam) return null;

  const questions = mockExam.questions.map((mq) => ({
    id: mq.publicExamQuestion.id,
    simuladoQuestionId: mq.id,
    text: mq.publicExamQuestion.text,
    correctCount: mq.publicExamQuestion.correctCount,
    options: mq.publicExamQuestion.options as Record<string, string>,
  }));

  function handleAnswerChange(questionId: number, selected: string[]) {
    setAnswers((prev) => ({ ...prev, [questionId]: selected }));
  }

  async function handleFinish() {
    setIsFinishing(true);
    try {
      const questionsNeedingAnswers = mockExam!.questions
        .filter((mq) => !mq.publicExamQuestion.answer)
        .map((mq) => ({
          id: mq.publicExamQuestion.id,
          publicExamName: mq.publicExamQuestion.publicExamName,
          examBoardName: mq.publicExamQuestion.examBoardName,
          subject: mq.publicExamQuestion.subject,
          topic: mq.publicExamQuestion.topic,
          text: mq.publicExamQuestion.text,
          correctCount: mq.publicExamQuestion.correctCount,
          difficulty: mq.publicExamQuestion.difficulty,
          options: mq.publicExamQuestion.options,
        }));

      if (questionsNeedingAnswers.length > 0) {
        await getMockExamAnswers(questionsNeedingAnswers as Parameters<typeof getMockExamAnswers>[0]);
      }

      const updatedExam = await getMockExam(Number(params.id));

      let score = 0;
      const attemptAnswers: MockExamAttemptAnswer[] = updatedExam.questions.map((mq) => {
        const selected = answers[mq.publicExamQuestion.id] ?? [];
        const correctOptions: string[] = (mq.publicExamQuestion.answer?.correctOptions as string[]) ?? [];
        const isCorrect =
          correctOptions.length > 0 &&
          selected.length === correctOptions.length &&
          selected.every((s) => correctOptions.includes(s));

        if (isCorrect) score += 1;

        return { mockExamQuestionId: mq.id, selectedOptions: selected };
      });

      await finishMockExamAttempt(Number(params.id), Number(params.attemptId), { answers: attemptAnswers, score });
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

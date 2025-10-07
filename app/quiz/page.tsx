'use client';
import { useState } from 'react';
import { Card, CardHeader } from '@heroui/card';
import { Divider } from '@heroui/divider';
import { QuestionareForm } from '@/components/questionareForm';
import { title } from '@/components/primitives';
import { Question } from '@/types';
import { QuestionList } from '@/components/QuestionList';
import { useQuizStore } from '@/features/useQuizStore.hook';

export default function AboutPage() {
  const { quiz, replaceQuiz } = useQuizStore();
  const [questions, setQuestions] = useState<Question[] | null>(null);

  const onQuestionsGenerated = (questions: Question[]) => {
    replaceQuiz({
      id: `${questions[0]?.topic ?? 'default'}|${questions.length}|${Date.now()}`,
      meta: {
        topic: questions[0]?.topic ?? '',
        num_questions: questions.length,
        generatedAt: new Date().toISOString(),
      },
      questions,
      answers: {},
    });
    setQuestions(questions);
  };

  return (
    <>
      <div className="flex flex-col mb-8 gap-2">
        <h1 className={title()}>Generate your Quiz</h1>
        <h3 className="text-lg font-bold text-zinc-400 pl-2">
          Create personalized quizzes for your certifications practice
        </h3>
      </div>

      <Card className="w-full p-4">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md">Configure the questionaire</p>
          </div>
        </CardHeader>
        <Divider />
        <QuestionareForm onGenerated={onQuestionsGenerated} />
      </Card>

      {(quiz?.questions ?? questions) && <QuestionList questions={quiz?.questions ?? questions ?? []} />}
    </>
  );
}

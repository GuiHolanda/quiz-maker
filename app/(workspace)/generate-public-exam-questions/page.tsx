'use client';
import { useState } from 'react';
import { AIPublicExamQuestion } from '@/shared/types';
import { PublicExamsProvider } from '@/features/providers/publicExams.provider';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { PublicExamQuestionGeneratorForm } from './components/PublicExamQuestionGeneratorForm';
import { GeneratedPublicExamQuestionsList } from './components/GeneratedPublicExamQuestionsList';

export default function GeneratePublicExamQuestionsPage() {
  return (
    <PublicExamsProvider>
      <PageContent />
    </PublicExamsProvider>
  );
}

function PageContent() {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<AIPublicExamQuestion[]>([]);

  const onQuestionsGenerated = (generated: AIPublicExamQuestion[] | undefined) => {
    if (!generated) return;
    setQuestions(generated);
  };

  return (
    <PageHeader title={t('concurso.generatePageTitle')} subtitle={t('concurso.generatePageSubtitle')}>
      <PublicExamQuestionGeneratorForm onGenerated={onQuestionsGenerated} />

      {questions.length > 0 && (
        <GeneratedPublicExamQuestionsList questions={questions} setQuestions={setQuestions} />
      )}
    </PageHeader>
  );
}

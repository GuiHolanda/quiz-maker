'use client';

import { QuestionGeneratorForm } from './QuestionGeneratorForm';
import { GenerationDistributionTable } from './GenerationDistributionTable';

import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { PublicExamManager } from '@/shared/components/PublicExamManager';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useGenerationJobsContext } from '@/features/hooks/useGenerationJobsContext.hook';

export function PublicExamQuestionsContent() {
  const { t } = useTranslation();
  const { publicExams, selectedPublicExam, isLoading } = usePublicExamsContext();
  const { startJob } = useGenerationJobsContext();

  async function handleGenerate(distribution: Array<{ topicName: string; questionCount: number }>) {
    if (!selectedPublicExam) return;
    await startJob({
      type: 'public_exam',
      refKey: selectedPublicExam.id!,
      refName: selectedPublicExam.name,
      examBoardName: selectedPublicExam.examBoard?.name,
      totalQuestions: selectedPublicExam.totalQuestions,
      distribution,
    });
  }

  if (isLoading) return <SkeletonListLoader />;

  if (publicExams.length === 0) {
    return (
      <EmptyState
        action={{ href: '/public-exams/configure', label: t('concurso.tabNew') }}
        description={t('concurso.noExamsDescription')}
        title={t('concurso.noExamsTitle')}
      />
    );
  }

  return (
    <QuestionGeneratorForm
      managerSlot={<PublicExamManager noSubjects className="w-full" />}
      distributionSlot={renderDistributionSlot()}
    />
  );

  function renderDistributionSlot() {
    if (!selectedPublicExam) {
      return <p className="text-xs text-default-400 py-2">{t('concurso.selectPublicExamPlaceholder')}</p>;
    }

    if (selectedPublicExam.subjects.length === 0) {
      return <p className="text-xs text-default-400 py-2">{t('simulado.noQuestionsTitle')}</p>;
    }

    return (
      <GenerationDistributionTable
        key={selectedPublicExam.id}
        defaultTotal={selectedPublicExam.totalQuestions}
        topics={selectedPublicExam.subjects.map((subject) => ({ name: subject.name, weight: subject.maxQuestions }))}
        onGenerate={handleGenerate}
      />
    );
  }
}

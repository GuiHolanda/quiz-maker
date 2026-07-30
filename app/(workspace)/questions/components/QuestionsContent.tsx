'use client';

import { useState, useEffect } from 'react';
import { NumberInput } from '@heroui/number-input';

import { GenerationDistributionTable } from './GenerationDistributionTable';

import type { Exam, ExamType } from '@/shared/types';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { EntitySelect } from '@/shared/components/EntitySelect';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useGenerationJobsContext } from '@/features/hooks/useGenerationJobsContext.hook';
import { inputProperties } from '@/config/constants/inputStyles';

type Distribution = Array<{ topicName: string; questionCount: number }>;

interface QuestionsContentProps {
  readonly type: ExamType;
}

const EMPTY_COPY: Record<ExamType, { href: string; labelKey: string; titleKey: string; descriptionKey: string }> = {
  certification: {
    href: '/certifications/configure',
    labelKey: 'certification.tabNew',
    titleKey: 'certification.noCertificationsTitle',
    descriptionKey: 'certification.noCertificationsDescription',
  },
  public_exam: {
    href: '/public-exams/configure',
    labelKey: 'concurso.tabNew',
    titleKey: 'concurso.noExamsTitle',
    descriptionKey: 'concurso.noExamsDescription',
  },
};

export function QuestionsContent({ type }: Readonly<QuestionsContentProps>) {
  const { t } = useTranslation();
  const { certifications, publicExams, isLoading } = useExamsContext();
  const { startJob } = useGenerationJobsContext();

  const exams = type === 'certification' ? certifications : publicExams;
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [total, setTotal] = useState(0);

  // Sincroniza total quando o usuário troca de exame.
  useEffect(() => {
    setTotal(selectedExam?.totalQuestions ?? 0);
  }, [selectedExam?.totalQuestions]);

  if (isLoading) return <SkeletonListLoader />;

  if (exams.length === 0) {
    const copy = EMPTY_COPY[type];

    return (
      <EmptyState
        action={{ href: copy.href, label: t(copy.labelKey) }}
        description={t(copy.descriptionKey)}
        title={t(copy.titleKey)}
      />
    );
  }

  const sections = selectedExam?.sections ?? [];

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6 w-full">
      <div className="flex w-3/4 xl:w-1/2 items-end gap-4">
        <div className="basis-3/4 min-w-0">{renderManager()}</div>
        {selectedExam && (
          <div className="basis-1/4 min-w-0">
            <NumberInput
              {...inputProperties.numberInput}
              hideStepper
              id="total_questions"
              label={t('generate.totalQuestions')}
              minValue={1}
              placeholder={t('generate.totalQuestionsPlaceholder')}
              value={total}
              onValueChange={(v) => queueMicrotask(() => setTotal(v))}
            />
          </div>
        )}
      </div>
      {selectedExam && (
        <GenerationDistributionTable
          key={selectedExam.id ?? selectedExam.name}
          defaultTotal={selectedExam.totalQuestions}
          total={total}
          topics={sections.map((section) => ({ name: section.name, weight: section.maxQuestions }))}
          onGenerate={handleGenerate}
          onTotalChange={setTotal}
        />
      )}
    </div>
  );

  function renderManager() {
    const labelKey = type === 'certification' ? 'certification.selectCertification' : 'concurso.selectPublicExam';
    const placeholderKey =
      type === 'certification'
        ? 'certification.selectCertificationPlaceholder'
        : 'concurso.selectPublicExamPlaceholder';
    const name = type === 'certification' ? 'certificationTitle' : 'publicExamName';

    return (
      <EntitySelect
        className="w-full"
        items={exams.map((exam) => ({
          key: exam.id ?? exam.name,
          label: [exam.name, exam.role, exam.examBoard?.name].filter(Boolean).join(' · '),
        }))}
        label={t(labelKey)}
        name={name}
        placeholder={t(placeholderKey)}
        selectedKey={selectedExam ? (selectedExam.id ?? selectedExam.name) : null}
        onSelect={(key) => setSelectedExam(exams.find((exam) => (exam.id ?? exam.name) === key) ?? null)}
      />
    );
  }

  async function handleGenerate(distribution: Distribution) {
    if (!selectedExam?.id) return;
    await startJob({
      type,
      refKey: selectedExam.id,
      refName: selectedExam.name,
      examBoardName: selectedExam.examBoard?.name,
      totalQuestions: selectedExam.totalQuestions,
      distribution,
    });
  }
}

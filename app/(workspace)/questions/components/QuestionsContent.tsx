'use client';

import { useState, useEffect } from 'react';
import { NumberInput } from '@heroui/number-input';

import { GenerationDistributionTable } from './GenerationDistributionTable';

import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { EntitySelect } from '@/shared/components/EntitySelect';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useGenerationJobsContext } from '@/features/hooks/useGenerationJobsContext.hook';
import { inputProperties } from '@/config/constants/inputStyles';

type Distribution = Array<{ topicName: string; questionCount: number }>;

interface QuestionsContentProps {
  readonly type: 'certification' | 'public_exam';
}

export function QuestionsContent({ type }: Readonly<QuestionsContentProps>) {
  const { t } = useTranslation();
  const cert = useCertificationsContext();
  const exam = usePublicExamsContext();
  const { startJob } = useGenerationJobsContext();

  const view = type === 'certification' ? buildCertView() : buildExamView();

  const [total, setTotal] = useState(view.totalQuestions);

  // Sincroniza total quando o usuário troca de certificação/concurso.
  useEffect(() => {
    setTotal(view.totalQuestions);
  }, [view.totalQuestions]);

  if (view.isLoading) return <SkeletonListLoader />;

  if (view.isEmpty) {
    return (
      <EmptyState
        action={{ href: view.empty.href, label: view.empty.label }}
        description={view.empty.description}
        title={view.empty.title}
      />
    );
  }

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6 w-full">
      <div className="flex w-3/4 xl:w-1/2 items-end gap-4">
        <div className="basis-3/4 min-w-0">{view.manager}</div>
        {view.selected && (
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
      {view.selected && (
        <GenerationDistributionTable
          key={view.distributionKey}
          defaultTotal={view.totalQuestions}
          total={total}
          topics={view.sections.map((section) => ({ name: section.name, weight: section.maxQuestions }))}
          onGenerate={view.onGenerate}
          onTotalChange={setTotal}
        />
      )}
    </div>
  );

  function buildCertView() {
    const { certifications, selectedCertification, isLoading, setSelectedCertification } = cert;

    return {
      isLoading,
      isEmpty: certifications.length === 0,
      selected: selectedCertification,
      sections: selectedCertification?.topics ?? [],
      totalQuestions: selectedCertification?.totalQuestions ?? 0,
      distributionKey: selectedCertification?.key,
      manager: (
        <EntitySelect
          className="w-full"
          items={certifications.map((c) => ({ key: c.key, label: c.label }))}
          label={t('certification.selectCertification')}
          name="certificationTitle"
          placeholder={t('certification.selectCertificationPlaceholder')}
          selectedKey={selectedCertification?.key ?? null}
          onSelect={(key) => setSelectedCertification(certifications.find((c) => c.key === key) ?? null)}
        />
      ),
      empty: {
        href: '/certifications/configure',
        label: t('certification.tabNew'),
        title: t('certification.noCertificationsTitle'),
        description: t('certification.noCertificationsDescription'),
      },
      onGenerate: async (distribution: Distribution) => {
        if (!selectedCertification) return;
        await startJob({
          type: 'certification',
          refKey: selectedCertification.key,
          refName: selectedCertification.label,
          totalQuestions: selectedCertification.totalQuestions,
          distribution,
        });
      },
    };
  }

  function buildExamView() {
    const { publicExams, selectedPublicExam, isLoading, setSelectedPublicExam } = exam;

    return {
      isLoading,
      isEmpty: publicExams.length === 0,
      selected: selectedPublicExam,
      sections: selectedPublicExam?.subjects ?? [],
      totalQuestions: selectedPublicExam?.totalQuestions ?? 0,
      distributionKey: selectedPublicExam?.id,
      manager: (
        <EntitySelect
          className="w-full"
          items={publicExams.map((e) => ({
            key: e.id ?? e.name,
            label: [e.name, e.role, e.examBoard?.name].filter(Boolean).join(' · '),
          }))}
          label={t('concurso.selectPublicExam')}
          name="publicExamName"
          placeholder={t('concurso.selectPublicExamPlaceholder')}
          selectedKey={selectedPublicExam ? (selectedPublicExam.id ?? selectedPublicExam.name) : null}
          onSelect={(key) => setSelectedPublicExam(publicExams.find((e) => (e.id ?? e.name) === key) ?? null)}
        />
      ),
      empty: {
        href: '/public-exams/configure',
        label: t('concurso.tabNew'),
        title: t('concurso.noExamsTitle'),
        description: t('concurso.noExamsDescription'),
      },
      onGenerate: async (distribution: Distribution) => {
        if (!selectedPublicExam) return;
        await startJob({
          type: 'public_exam',
          refKey: selectedPublicExam.id!,
          refName: selectedPublicExam.name,
          examBoardName: selectedPublicExam.examBoard?.name,
          totalQuestions: selectedPublicExam.totalQuestions,
          distribution,
        });
      },
    };
  }
}

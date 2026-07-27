'use client';

import { QuestionGeneratorForm } from './QuestionGeneratorForm';
import { GenerationDistributionTable } from './GenerationDistributionTable';

import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { CertificationManager } from '@/shared/components/CertificationManager';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useGenerationJobsContext } from '@/features/hooks/useGenerationJobsContext.hook';

export function CertQuestionsContent() {
  const { t } = useTranslation();
  const { certifications, selectedCertification, isLoading } = useCertificationsContext();
  const { startJob } = useGenerationJobsContext();

  async function handleGenerate(distribution: Array<{ topicName: string; questionCount: number }>) {
    if (!selectedCertification) return;
    await startJob({
      type: 'certification',
      refKey: selectedCertification.key,
      refName: selectedCertification.label,
      totalQuestions: selectedCertification.totalQuestions,
      distribution,
    });
  }

  if (isLoading) return <SkeletonListLoader />;

  if (certifications.length === 0) {
    return (
      <EmptyState
        action={{ href: '/certifications/configure', label: t('certification.tabNew') }}
        description={t('certification.noCertificationsDescription')}
        title={t('certification.noCertificationsTitle')}
      />
    );
  }

  return (
    <QuestionGeneratorForm
      managerSlot={<CertificationManager noTopics className="w-full" />}
      distributionSlot={renderDistributionSlot()}
    />
  );

  function renderDistributionSlot() {
    if (!selectedCertification) {
      return <p className="text-xs text-default-400 py-2">{t('certification.selectCertificationPlaceholder')}</p>;
    }

    if (selectedCertification.topics.length === 0) {
      return <p className="text-xs text-default-400 py-2">{t('simulado.noQuestionsTitle')}</p>;
    }

    return (
      <GenerationDistributionTable
        key={selectedCertification.key}
        defaultTotal={selectedCertification.totalQuestions}
        topics={selectedCertification.topics.map((topic) => ({ name: topic.name, weight: topic.maxQuestions }))}
        onGenerate={handleGenerate}
      />
    );
  }
}

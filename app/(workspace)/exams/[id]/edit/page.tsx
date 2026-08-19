'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';

import type { Exam } from '@/shared/types';
import { ExamsProvider } from '@/features/providers/exams.provider';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { IllustratedEmptyState } from '@/shared/components/ui/IllustratedEmptyState';
import { UpgradeModal } from '@/shared/components/ui/UpgradeModal';
import { canEditExams } from '@/config/constants';
import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';
import { ExamEditorPage } from '@/app/(workspace)/exams/new/components/ExamEditorPage';

export default function EditExamPage() {
  return (
    <ExamsProvider>
      <EditExamContent />
    </ExamsProvider>
  );
}

function EditExamContent() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const examId = params.id;
  const { exams, isLoading, updateExam } = useExamsContext();
  const { data: session } = useSession();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const exam = exams.find((e) => e.id === examId) ?? null;

  if (isLoading) {
    return (
      <PageHeader>
        <SkeletonListLoader count={6} height="h-12" />
      </PageHeader>
    );
  }

  if (!exam) {
    return (
      <PageHeader title={t('exam.notFoundTitle')}>
        <EmptyState
          title={t('exam.notFoundTitle')}
          description={t('exam.notFoundDescription')}
          action={{ label: t('common.back'), href: '/exams' }}
        />
      </PageHeader>
    );
  }

  const config = EXAM_CONFIG[exam.type];
  const listHref = `/exams?type=${exam.type}`;
  const listLabel = exam.type === 'certification' ? t('nav.certifications') : t('nav.publicExams');
  const canEdit = !session?.user?.plan || canEditExams(session.user.plan);

  if (!canEdit) {
    return (
      <PageHeader title={t(config.editLabel)}>
        <IllustratedEmptyState
          action={{ label: t('billing.upgradeModal.cta'), onPress: () => setIsUpgradeOpen(true) }}
          description={t('exam.editUpgradeWallDescription')}
          icon={config.icon}
          secondaryAction={{ label: t('common.back'), href: listHref }}
          title={t('exam.editUpgradeWallTitle')}
        />
        <UpgradeModal isOpen={isUpgradeOpen} product="pro" onClose={() => setIsUpgradeOpen(false)} />
      </PageHeader>
    );
  }

  const breadcrumbs = (
    <Breadcrumbs>
      <BreadcrumbItem href="/">{t('nav.dashboard')}</BreadcrumbItem>
      <BreadcrumbItem href={listHref}>{listLabel}</BreadcrumbItem>
      <BreadcrumbItem>{t(config.editLabel)}</BreadcrumbItem>
    </Breadcrumbs>
  );

  const handleSaved = (saved: Exam) => {
    if (saved.id) updateExam(saved.id, saved);
    router.push(listHref);
  };

  return (
    <PageHeader breadcrumbs={breadcrumbs}>
      <ExamEditorPage
        type={exam.type}
        initialDraft={exam}
        mode="edit"
        onDiscard={() => router.push(listHref)}
        onSaved={handleSaved}
      />
    </PageHeader>
  );
}

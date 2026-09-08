'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusSquare } from '@fortawesome/free-solid-svg-icons';

import { ExamsList } from './components/list/ExamsList';
import { ExamTypePickerModal } from './components/ExamTypePickerModal';

import { ExamsProvider } from '@/features/providers/exams.provider';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { buttonStyles } from '@/config/constants/buttonStyles';
import type { ExamType } from '@/shared/types';

export default function ExamsPage() {
  return (
    <ExamsProvider>
      <Suspense>
        <ExamsContent />
      </Suspense>
    </ExamsProvider>
  );
}

function ExamsContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { usage } = useUsageContext();
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);

  const openTypePicker = () => setIsTypePickerOpen(true);
  const handleConfirmType = (type: ExamType) => router.push(`/exams/new?type=${type}`);

  const subtitle =
    usage && usage.examsLimit !== -1
      ? `${t('exam.listPageSubtitle')} ${t('exam.quotaNote', {
          used: String(usage.examsUsed),
          limit: String(usage.examsLimit),
          plan: usage.plan,
        })}`
      : t('exam.listPageSubtitle');

  return (
    <PageHeader
      action={
        <Button
          className={buttonStyles.primary}
          data-testid="add-new-exam-btn"
          radius="sm"
          startContent={<FontAwesomeIcon icon={faPlusSquare} />}
          onPress={openTypePicker}
        >
          {t('exam.createButtonLabel')}
        </Button>
      }
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem href="/">{t('nav.dashboard')}</BreadcrumbItem>
          <BreadcrumbItem>{t('nav.myExams')}</BreadcrumbItem>
        </Breadcrumbs>
      }
      subtitle={subtitle}
      title={t('exam.listPageTitle')}
    >
      <section data-testid="configure-list-section">
        <ExamsList onCreateNew={openTypePicker} />
      </section>

      <ExamTypePickerModal
        isOpen={isTypePickerOpen}
        onClose={() => setIsTypePickerOpen(false)}
        onConfirm={handleConfirmType}
      />
    </PageHeader>
  );
}

'use client';
import { useRouter } from 'next/navigation';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import { useSession } from 'next-auth/react';

import type { ExamType } from '@/shared/types';
import { ExamsProvider } from '@/features/providers/exams.provider';
import { ExamWizard } from '@/app/(workspace)/exams/components/wizard/ExamWizard';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useAiChatUI } from '@/features/hooks/useAiChatUI.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { UpgradeModal } from '@/shared/components/ui/UpgradeModal';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { AI_CHAT_ALLOWED_PLANS } from '@/config/constants';
import { useState } from 'react';

interface NewExamPageProps {
  readonly type: ExamType;
}

export function NewExamPage({ type }: NewExamPageProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { openChat } = useAiChatUI();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const plan = session?.user?.plan ?? '';
  const hasAiChat = AI_CHAT_ALLOWED_PLANS.includes(plan);

  const listHref = type === 'certification' ? '/exams?type=certification' : '/exams?type=public_exam';
  const listLabel = type === 'certification' ? t('nav.certifications') : t('nav.publicExams');
  const newLabel = type === 'certification' ? t('nav.newCertification') : t('nav.newConcurso');
  const pageTitle = type === 'certification' ? t('exam.newCertificationTitle') : t('exam.newConcursoTitle');

  function handleAiChatPress() {
    if (hasAiChat) {
      openChat();
    } else {
      setIsUpgradeOpen(true);
    }
  }

  return (
    <>
      <ExamsProvider>
        <PageHeader
          breadcrumbs={
            <Breadcrumbs>
              <BreadcrumbItem href="/">{t('nav.dashboard')}</BreadcrumbItem>
              <BreadcrumbItem href={listHref}>{listLabel}</BreadcrumbItem>
              <BreadcrumbItem>{newLabel}</BreadcrumbItem>
            </Breadcrumbs>
          }
          title={pageTitle}
        >
          <div className="flex flex-col gap-10">
            {renderAiChatCard()}
            {renderManualSection()}
          </div>
        </PageHeader>
      </ExamsProvider>

      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </>
  );

  function renderAiChatCard() {
    return (
      <div className="relative bg-content1 border border-default-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        {!hasAiChat && (
          <Chip className="absolute top-4 right-4" color="secondary" size="sm" variant="flat">
            PRO AI
          </Chip>
        )}
        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
          <FontAwesomeIcon className="text-secondary" icon={faRobot} size="lg" />
        </div>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{t('exam.aiChatCard.title')}</h2>
          <p className="text-sm text-default-500">{t('exam.aiChatCard.description')}</p>
        </div>
        <Button className={buttonStyles.secondary} variant="bordered" onPress={handleAiChatPress}>
          {t('exam.aiChatCard.cta')}
        </Button>
      </div>
    );
  }

  function renderManualSection() {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-foreground">{t('exam.manualSection.title')}</h2>
          <p className="text-sm text-default-500">{t('exam.manualSection.subtitle')}</p>
        </div>
        <ExamWizard
          type={type}
          onBack={() => router.push(listHref)}
          onSaved={() => router.push(listHref)}
        />
      </div>
    );
  }
}

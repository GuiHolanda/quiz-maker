'use client';
import { useState } from 'react';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { useSession } from 'next-auth/react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useAiChatUI } from '@/features/hooks/useAiChatUI.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { UpgradeModal } from '@/shared/components/ui/UpgradeModal';
import type { ExamType } from '@/shared/types';
import { AI_CHAT_ALLOWED_PLANS } from '@/config/constants';

interface EntryScreenProps {
  readonly type: ExamType;
  readonly onStartManual: () => void;
}

export function EntryScreen({ type, onStartManual }: EntryScreenProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { openChat } = useAiChatUI();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const plan = session?.user?.plan ?? '';
  const hasAiChat = AI_CHAT_ALLOWED_PLANS.includes(plan);

  const listHref = type === 'certification' ? '/exams?type=certification' : '/exams?type=public_exam';
  const listLabel = type === 'certification' ? t('nav.certifications') : t('nav.publicExams');
  const pageTitle = type === 'certification' ? t('exam.newCertificationTitle') : t('exam.newConcursoTitle');
  const newLabel = type === 'certification' ? t('nav.newCertification') : t('nav.newConcurso');

  function handleAiChatPress() {
    if (hasAiChat) {
      openChat();
    } else {
      setIsUpgradeOpen(true);
    }
  }

  return (
    <>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          {renderAiChatCard()}
          {renderManualCard()}
        </div>
      </PageHeader>

      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </>
  );

  function renderAiChatCard() {
    return (
      <Card className="border border-default-200 relative" shadow="none">
        {!hasAiChat && (
          <Chip className="absolute top-3 right-3 z-10" color="secondary" size="sm" variant="flat">
            PRO AI
          </Chip>
        )}
        <CardBody className="flex flex-col gap-4 p-6">
          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
            <FontAwesomeIcon className="text-secondary w-5 h-5" icon={faRobot} />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">{t('exam.aiChatCard.title')}</h2>
            <p className="text-sm text-default-500">{t('exam.aiChatCard.description')}</p>
          </div>
          <Button color="secondary" variant="flat" onPress={handleAiChatPress}>
            {t('exam.aiChatCard.cta')}
          </Button>
        </CardBody>
      </Card>
    );
  }

  function renderManualCard() {
    return (
      <Card className="border border-default-200" shadow="none">
        <CardBody className="flex flex-col gap-4 p-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FontAwesomeIcon className="text-primary w-5 h-5" icon={faWandMagicSparkles} />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">{t('exam.manualCard.title')}</h2>
            <p className="text-sm text-default-500">{t('exam.manualCard.description')}</p>
          </div>
          <Button color="primary" data-testid="exam-entry-manual-btn" variant="flat" onPress={onStartManual}>
            {t('exam.manualCard.cta')}
          </Button>
        </CardBody>
      </Card>
    );
  }
}

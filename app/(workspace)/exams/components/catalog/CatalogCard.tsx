'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { Card, CardBody, CardFooter } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup, faHashtag, faCodeBranch } from '@fortawesome/free-solid-svg-icons';

import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { forkCatalogExam } from '@/features/connectors';
import { notify } from '@/shared/lib/notify';
import { buttonStyles } from '@/config/constants/buttonStyles';
import type { CatalogExam } from '@/shared/types';

interface CatalogCardProps {
  readonly exam: CatalogExam;
}

export function CatalogCard({ exam }: CatalogCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isForking, setIsForking] = useState(false);
  const config = EXAM_CONFIG[exam.type];
  const referenceEntity = exam.type === 'certification' ? exam.provider : exam.examBoard;

  async function handleFork() {
    setIsForking(true);
    try {
      await forkCatalogExam(exam.id);
      notify.success(t('catalog.forkSuccessTitle'), t('catalog.forkSuccessDescription'));
      router.push(`/exams?type=${exam.type}`);
      router.refresh();
    } catch {
      notify.error(t('catalog.forkErrorTitle'));
      setIsForking(false);
    }
  }

  return (
    <Card
      classNames={{
        base: 'bg-content1 border border-default-200 rounded-xl hover:border-default-300 transition-colors duration-150',
      }}
      shadow="none"
    >
      <CardBody className="p-4 pb-0 gap-3">
        <div className="flex items-center gap-3">
          {renderAvatar()}
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-foreground leading-snug line-clamp-2">
              {exam.name}
            </span>
            {referenceEntity?.name && (
              <span className="text-xs text-default-400 truncate block">{referenceEntity.name}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Chip color="default" size="sm" variant="flat">
            <span className="flex items-center gap-1">
              <FontAwesomeIcon className="text-[9px]" icon={faLayerGroup} />
              {exam.sections.length}
            </span>
          </Chip>
          <Chip color="default" size="sm" variant="flat">
            <span className="flex items-center gap-1">
              <FontAwesomeIcon className="text-[9px]" icon={faHashtag} />
              {exam.totalQuestions}
            </span>
          </Chip>
          {exam.poolQuestionCount > 0 && (
            <Chip color="success" size="sm" variant="flat">
              {t('catalog.poolCount', { count: String(exam.poolQuestionCount) })}
            </Chip>
          )}
        </div>
      </CardBody>

      <CardFooter className="px-4 py-3 border-t border-default-200 mt-3">
        <Button
          className={buttonStyles.primary}
          isLoading={isForking}
          size="sm"
          startContent={!isForking ? <FontAwesomeIcon icon={faCodeBranch} /> : undefined}
          onPress={handleFork}
        >
          {t('catalog.useTemplate')}
        </Button>
      </CardFooter>
    </Card>
  );

  function renderAvatar() {
    const logoUrl = exam.type === 'certification' ? exam.provider?.logoUrl : exam.examBoard?.logoUrl;
    if (logoUrl) {
      return (
        <div className="w-10 h-10 rounded-xl bg-white border border-default-200 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={referenceEntity?.name ?? exam.name} className="w-full h-full object-contain" src={logoUrl} />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <FontAwesomeIcon className="text-sm text-primary" icon={config.icon} />
      </div>
    );
  }
}

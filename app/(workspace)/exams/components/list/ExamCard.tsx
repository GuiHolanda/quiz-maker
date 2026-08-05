'use client';
import { useState } from 'react';
import { faBullseye, faClock, faHashtag, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';
import { Card, CardBody, CardFooter } from '@heroui/card';
import { Chip } from '@heroui/chip';

import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { Exam, ExamType } from '@/shared/types';
import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface ExamCardProps {
  readonly exam: Exam;
  readonly type: ExamType;
  readonly isSelected: boolean;
  readonly onClick: () => void;
}

export function ExamCard({ exam, type, isSelected, onClick }: ExamCardProps) {
  const { t } = useTranslation();
  const config = EXAM_CONFIG[type];
  const hasNoSections = exam.sections.length === 0;
  const [logoError, setLogoError] = useState(false);

  const referenceEntity = type === 'certification' ? exam.provider : exam.examBoard;
  const initials = referenceEntity?.name
    ? referenceEntity.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')
    : null;

  const hasStats = exam.totalQuestions > 0 || !!exam.examDurationMinutes || exam.passingScore != null;
  const dateValue = exam.updatedAt && exam.updatedAt !== exam.createdAt ? exam.updatedAt : exam.createdAt;

  return (
    <Card
      aria-expanded={isSelected}
      aria-label={exam.name}
      classNames={{
        base: [
          'bg-content1 border rounded-xl transition-all duration-150 cursor-pointer hover:bg-content2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
          isSelected
            ? 'border-primary bg-content2 ring-1 ring-primary/20'
            : 'border-default-200 hover:border-default-300',
        ].join(' '),
      }}
      role="button"
      shadow="none"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
    >
      <CardBody className="p-4 pb-0 gap-8">
        {/* Header row */}
        <div className="flex items-center gap-3">
          {renderAvatar()}
          <div className="flex-1 min-w-0 pt-0.5">
            <span className="block text-sm font-semibold text-foreground leading-snug line-clamp-2 text-left">
              {exam.name}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              {referenceEntity?.name && (
                <>
                  <span className="text-xs text-default-400 truncate">{referenceEntity.name}</span>
                </>
              )}
              {config.hasRoleField && exam.role != null && (
                <>
                  <span className="text-default-300 text-[9px]">•</span>
                  <span className="text-xs text-default-400">{exam.role}</span>
                </>
              )}
              {config.hasYearField && exam.year != null && (
                <>
                  <span className="text-default-300 text-[9px]">•</span>
                  <span className="text-xs text-default-400">{exam.year}</span>
                </>
              )}
            </div>
          </div>
          {exam.key && (
            <span className="block text-xs font-semibold text-foreground leading-snug line-clamp-2 text-left">
              {exam.key}
            </span>
          )}
        </div>

        {/* Stats row */}
        {hasStats && (
          <div className="flex items-center flex-wrap gap-y-1 text-xs text-default-400">
            {exam.totalQuestions > 0 && (
              <span className="inline-flex items-center gap-1">
                <FontAwesomeIcon className="text-[9px] text-default-400" icon={faHashtag} />
                {t(type === 'certification' ? 'certification.questionsCount' : 'concurso.questionsCount', {
                  count: String(exam.totalQuestions),
                })}
              </span>
            )}
            {exam.totalQuestions > 0 && exam.examDurationMinutes && (
              <span className="mx-2 text-default-300 text-[9px]">•</span>
            )}
            {exam.examDurationMinutes && (
              <span className="inline-flex items-center gap-1">
                <FontAwesomeIcon className="text-[9px] text-default-400" icon={faClock} />
                {t('certification.durationValue', { minutes: String(exam.examDurationMinutes) })}
              </span>
            )}
            {(exam.totalQuestions > 0 || exam.examDurationMinutes) && exam.passingScore != null && (
              <span className="mx-2 text-default-300 text-[9px]">•</span>
            )}
            {exam.passingScore != null && (
              <span className="inline-flex items-center gap-1 text-primary font-semibold">
                <FontAwesomeIcon className="text-[9px]" icon={faBullseye} />
                {t('certification.passingScoreValue', { score: String(exam.passingScore) })}
              </span>
            )}
            {hasNoSections ? (
              <Chip className="shrink-0 mt-0.5" color="warning" size="sm" variant="flat">
                {t(config.cardEmptyChipKey)}
              </Chip>
            ) : (
              <Chip className="shrink-0 mt-0.5 ml-auto" color="primary" size="sm" variant="flat">
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon className="text-[9px]" icon={faLayerGroup} />
                  {exam.sections.length}
                </span>
              </Chip>
            )}
          </div>
        )}
      </CardBody>

      <CardFooter className="px-4 py-3 flex items-center justify-between border-t border-default-200 mt-3">
        <span className="text-xs text-default-400">{dateValue ? <RelativeDate date={dateValue} /> : null}</span>
        <Button className={buttonStyles.primarySm} size="sm" onPress={onClick}>
          {t('common.viewDetails')}
        </Button>
      </CardFooter>
    </Card>
  );

  function renderAvatar() {
    const logoUrl = type === 'certification' ? exam.provider?.logoUrl : exam.examBoard?.logoUrl;
    const logoAlt = type === 'certification' ? exam.provider?.name : exam.examBoard?.name;

    if (logoUrl && logoAlt && !logoError) {
      return (
        <div className="w-10 h-10 rounded-xl bg-white border border-default-200 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={logoAlt}
            className="w-full h-full object-contain"
            src={logoUrl}
            onError={() => setLogoError(true)}
          />
        </div>
      );
    }

    if (initials) {
      return (
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-primary leading-none tracking-tight">{initials}</span>
        </div>
      );
    }

    return (
      <div className="w-10 h-10 rounded-xl bg-content2 border border-default-200 flex items-center justify-center shrink-0">
        <FontAwesomeIcon className="text-sm text-default-400" icon={config.icon} />
      </div>
    );
  }
}

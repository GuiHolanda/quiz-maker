'use client';
import { useState } from 'react';
import { faCheckCircle, faClock, faClockRotateLeft, faHashtag, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';
import { Card, CardBody, CardFooter } from '@heroui/card';
import { Chip } from '@heroui/chip';

import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { Exam, ExamType } from '@/shared/types';
import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';
import { buttonStyles } from '@/config/constants/buttonStyles';
import Image from 'next/image';

interface ExamCardProps {
  readonly exam: Exam;
  readonly type: ExamType;
  readonly isSelected: boolean;
  readonly onClick: () => void;
  readonly footerAction?: React.ReactNode;
}

export function ExamCard({ exam, type, isSelected, onClick, footerAction }: ExamCardProps) {
  const { t } = useTranslation();
  const config = EXAM_CONFIG[type];
  const hasNoSections = exam.sections.length === 0;
  const [logoError, setLogoError] = useState(false);

  const referenceEntity = type === 'certification' ? exam.provider : exam.examBoard;
  const hasStats = exam.totalQuestions > 0 || !!exam.examDurationMinutes || exam.passingScore != null;
  const dateValue = exam.updatedAt && exam.updatedAt !== exam.createdAt ? exam.updatedAt : exam.createdAt;

  return (
    <Card
      aria-expanded={isSelected}
      aria-label={exam.name}
      classNames={{
        base: [
          'bg-content1 border rounded-xl transition-all duration-150 cursor-pointer hover:bg-content2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 h-full max-w-[760px] max-h-[520px] p-0',
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
      <CardBody className="p-0">
        {/* Header row */}
        <div className="flex items-center gap-3 p-6 min-h-28">
          {renderAvatar()}
          <div className="flex-1 min-w-0">
            <span className="block text-lg font-semibold text-foreground leading-snug line-clamp-2 text-left">
              {exam.name}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              {referenceEntity?.name && (
                <span className="text-sm text-default-400 truncate">{referenceEntity.name}</span>
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
        </div>

        {/* Stats row */}
        {hasStats && (
          <div className="flex items-center bg-content2 flex-wrap gap-4 text-sm text-default-400 px-6 py-4 border-y border-default-200">
            {exam.totalQuestions > 0 && (
              <span className="inline-flex items-center gap-1">
                <FontAwesomeIcon icon={faHashtag} size="sm" />
                {t(type === 'certification' ? 'certification.questionsCount' : 'concurso.questionsCount', {
                  count: String(exam.totalQuestions),
                })}
              </span>
            )}
            {exam.passingScore != null && (
              <span className="inline-flex items-center gap-1">
                <FontAwesomeIcon icon={faCheckCircle} size="sm" />
                {t('certification.passingScoreValue', { score: String(exam.passingScore) })}
              </span>
            )}
            {exam.examDurationMinutes && (
              <span className="inline-flex items-center gap-1">
                <FontAwesomeIcon icon={faClock} size="sm" />
                {t('certification.durationValue', { minutes: String(exam.examDurationMinutes) })}
              </span>
            )}
          </div>
        )}

        {/* Sections area */}
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-foreground">{t(config.step2SectionsTitle)}</span>
            {hasNoSections ? (
              <Chip color="warning" size="sm" variant="flat">
                {t(config.cardEmptyChipKey)}
              </Chip>
            ) : (
              <Chip color="primary" size="sm" variant="flat">
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon className="text-[9px]" icon={faLayerGroup} />
                  {exam.sections.length}
                </span>
              </Chip>
            )}
          </div>
          {!hasNoSections && (
            <div className="flex flex-col gap-4 max-h-32 overflow-y-auto scrollbar-hide">
              {exam.sections.map((section) => (
                <div key={section.id ?? section.name} className="flex items-center gap-4">
                  <span className="text-sm text-default-500 shrink-0">{section.name}</span>
                  <div className="flex-1 h-1 bg-default-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${section.minQuestions}%` }} />
                  </div>
                  <span className="text-xs text-default-400 shrink-0 w-8 text-right">{section.minQuestions}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardBody>

      <CardFooter className="p-6 bg-content2 flex items-center justify-between border-t border-default-200 mt-3">
        <div className="flex gap-2 items-center">
          <FontAwesomeIcon className="text-default-400" icon={faClockRotateLeft} />
          <p className="text-sm text-default-400">{dateValue ? <RelativeDate date={dateValue} /> : null}</p>
        </div>
        {footerAction ?? (
          <Button className={buttonStyles.primary} onPress={onClick}>
            {t('common.viewDetails')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  function renderAvatar() {
    const logoUrl = type === 'certification' ? exam.provider?.logoUrl : exam.examBoard?.logoUrl;
    const logoAlt = type === 'certification' ? exam.provider?.name : exam.examBoard?.name;

    if (logoUrl && logoAlt && !logoError) {
      return (
        <div className="w-32 h-16 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden p-2">
          <Image
            alt={logoAlt}
            className="w-full h-full object-contain"
            width={128}
            height={128}
            src={logoUrl}
            onError={() => setLogoError(true)}
          />
        </div>
      );
    }
  }
}

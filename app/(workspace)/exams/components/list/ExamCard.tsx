'use client';
import { faBullseye, faClock, faHashtag, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';
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
    <button
      aria-expanded={isSelected}
      aria-label={exam.name}
      className={[
        'group text-left w-full bg-content1 border rounded-xl p-4 transition-all duration-150 hover:bg-content2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
        isSelected
          ? 'border-primary bg-content2 ring-1 ring-primary/20'
          : 'border-default-200 hover:border-default-300',
      ].join(' ')}
      type="button"
      onClick={onClick}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 mb-3">
        {renderAvatar()}
        <div className="flex-1 min-w-0 pt-0.5">
          <span className="block text-sm font-semibold text-foreground leading-snug line-clamp-2">
            {exam.name}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            {referenceEntity?.name && (
              <span className="text-xs text-default-400 truncate">{referenceEntity.name}</span>
            )}
            {config.hasYearField && exam.year != null && (
              <>
                <span className="text-default-300 text-[9px]">•</span>
                <span className="text-xs text-default-400">{exam.year}</span>
              </>
            )}
          </div>
        </div>
        {hasNoSections ? (
          <Chip className="shrink-0 mt-0.5" color="warning" size="sm" variant="flat">
            {t(config.cardEmptyChipKey)}
          </Chip>
        ) : (
          <Chip className="shrink-0 mt-0.5" color="primary" size="sm" variant="flat">
            <span className="flex items-center gap-1">
              <FontAwesomeIcon className="text-[9px]" icon={faLayerGroup} />
              {exam.sections.length}
            </span>
          </Chip>
        )}
      </div>

      {/* Role pill — concurso only */}
      {type === 'public_exam' && exam.role && (
        <div className="mb-3">
          <span className="inline-block px-3 py-1 bg-content2 border border-default-200 rounded-full text-xs font-medium text-default-500 truncate max-w-full">
            {exam.role}
          </span>
        </div>
      )}

      {/* Stats row */}
      {hasStats && (
        <div className="flex items-center flex-wrap gap-x-0 mb-0 text-xs text-default-400 row-gap-1">
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
        </div>
      )}

      {/* Footer */}
      <div className={`flex items-center justify-between border-t border-default-200 ${hasStats ? 'mt-3 pt-3' : 'mt-2 pt-2'}`}>
        <span className="text-xs text-default-400">
          {dateValue ? <RelativeDate date={dateValue} /> : null}
        </span>
        <Button className={buttonStyles.primarySm} size="sm" onClick={onClick}>
          {t('common.viewDetails')}
        </Button>
      </div>
    </button>
  );

  function renderAvatar() {
    if (type === 'certification' && exam.provider?.logoUrl) {
      return (
        <div className="w-10 h-10 rounded-xl bg-white border border-default-200 flex items-center justify-center shrink-0 overflow-hidden p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={exam.provider.name} className="w-8 h-8 object-contain" src={exam.provider.logoUrl} />
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

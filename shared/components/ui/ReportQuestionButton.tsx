'use client';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag } from '@fortawesome/free-solid-svg-icons';

import type { QuestionReportSurface } from '@/config/constants';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { useFeedback } from '@/features/hooks/useFeedback.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface ReportQuestionButtonProps {
  readonly examQuestionId: number;
  readonly surface: QuestionReportSurface;
  readonly mockExamAttemptId?: number;
}

export function ReportQuestionButton({ examQuestionId, surface, mockExamAttemptId }: ReportQuestionButtonProps) {
  const { t } = useTranslation();
  const { openQuestionReport } = useFeedback();

  return (
    <Button
      isIconOnly
      aria-label={t('feedback.reportQuestionAria')}
      className={buttonStyles.iconOnly.neutral}
      data-testid="question-report-btn"
      size="sm"
      title={t('feedback.reportQuestion')}
      variant="light"
      onPress={() => openQuestionReport({ examQuestionId, surface, mockExamAttemptId })}
    >
      <FontAwesomeIcon aria-hidden="true" className="w-3.5 h-3.5" icon={faFlag} />
    </Button>
  );
}

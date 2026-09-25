'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Textarea } from '@heroui/input';
import { ModalBody, ModalFooter, ModalHeader } from '@heroui/modal';
import { Radio, RadioGroup } from '@heroui/radio';

import {
  QUESTION_REPORT_COMMENT_MAX_LENGTH,
  QUESTION_REPORT_REASONS,
  type QuestionReportReason,
} from '@/config/constants';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { inputProperties } from '@/config/constants/inputStyles';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface ReportQuestionFormProps {
  readonly isLoading: boolean;
  readonly onSubmit: (reason: QuestionReportReason, comment: string) => void;
  readonly onClose: () => void;
}

export function ReportQuestionForm({ isLoading, onSubmit, onClose }: ReportQuestionFormProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<QuestionReportReason | null>(null);
  const [comment, setComment] = useState('');
  const [hasTriedToSubmit, setHasTriedToSubmit] = useState(false);

  const limit = { max: QUESTION_REPORT_COMMENT_MAX_LENGTH };
  const isCommentTooLong = comment.trim().length > QUESTION_REPORT_COMMENT_MAX_LENGTH;
  const isReasonMissing = hasTriedToSubmit && reason === null;

  function handleSubmit() {
    setHasTriedToSubmit(true);

    if (reason === null || isCommentTooLong) return;

    onSubmit(reason, comment);
  }

  return (
    <>
      <ModalHeader className="flex flex-col gap-1 border-b border-default-200">
        <span className="text-base font-semibold text-foreground">{t('feedback.reportModalTitle')}</span>
        <span className="text-sm font-normal text-default-500">{t('feedback.reportModalSubtitle')}</span>
      </ModalHeader>
      <ModalBody className="gap-5 py-6" data-testid="question-report-modal">
        <RadioGroup
          errorMessage={t('feedback.reasonRequired')}
          isDisabled={isLoading}
          isInvalid={isReasonMissing}
          label={t('feedback.reasonLabel')}
          value={reason}
          onValueChange={(value) => setReason(value as QuestionReportReason)}
        >
          {QUESTION_REPORT_REASONS.map(({ id, labelKey }) => (
            <Radio key={id} value={id}>
              {t(labelKey)}
            </Radio>
          ))}
        </RadioGroup>
        <Textarea
          {...inputProperties.input}
          data-testid="question-report-comment"
          description={t('feedback.commentHelper', limit)}
          errorMessage={t('feedback.commentTooLong', limit)}
          isDisabled={isLoading}
          isInvalid={isCommentTooLong}
          label={t('feedback.commentLabel')}
          minRows={3}
          placeholder={t('feedback.commentPlaceholder')}
          value={comment}
          onValueChange={setComment}
        />
      </ModalBody>
      <ModalFooter className="border-t border-default-200">
        <Button
          className={buttonStyles.secondary}
          isDisabled={isLoading}
          size="sm"
          variant="bordered"
          onPress={onClose}
        >
          {t('common.cancel')}
        </Button>
        <Button
          className={buttonStyles.primary}
          data-testid="question-report-submit-btn"
          isLoading={isLoading}
          size="sm"
          onPress={handleSubmit}
        >
          {t('feedback.submitReport')}
        </Button>
      </ModalFooter>
    </>
  );
}

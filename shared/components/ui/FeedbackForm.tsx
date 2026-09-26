'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Textarea } from '@heroui/input';
import { ModalBody, ModalFooter, ModalHeader } from '@heroui/modal';
import { Radio, RadioGroup } from '@heroui/radio';

import { FEEDBACK_CATEGORIES, FEEDBACK_MESSAGE_MAX_LENGTH, type FeedbackCategory } from '@/config/constants';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { inputProperties } from '@/config/constants/inputStyles';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface FeedbackFormProps {
  readonly isLoading: boolean;
  readonly onSubmit: (category: FeedbackCategory, message: string) => void;
  readonly onClose: () => void;
}

export function FeedbackForm({ isLoading, onSubmit, onClose }: FeedbackFormProps) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [message, setMessage] = useState('');
  const [hasTriedToSubmit, setHasTriedToSubmit] = useState(false);

  const messageLength = message.trim().length;
  const isMessageTooLong = messageLength > FEEDBACK_MESSAGE_MAX_LENGTH;
  const isMessageMissing = hasTriedToSubmit && messageLength === 0;
  const isCategoryMissing = hasTriedToSubmit && category === null;
  const messageError = isMessageTooLong
    ? t('feedback.messageTooLong', { max: FEEDBACK_MESSAGE_MAX_LENGTH })
    : t('feedback.messageRequired');

  function handleSubmit() {
    setHasTriedToSubmit(true);

    if (category === null || messageLength === 0 || isMessageTooLong) return;

    onSubmit(category, message);
  }

  return (
    <>
      <ModalHeader className="flex flex-col gap-1 border-b border-default-200">
        <span className="text-base font-semibold text-foreground">{t('feedback.widgetTitle')}</span>
        <span className="text-sm font-normal text-default-500">{t('feedback.widgetSubtitle')}</span>
      </ModalHeader>
      <ModalBody className="gap-5 py-6" data-testid="feedback-modal">
        <RadioGroup
          errorMessage={t('feedback.categoryRequired')}
          isDisabled={isLoading}
          isInvalid={isCategoryMissing}
          label={t('feedback.categoryLabel')}
          orientation="horizontal"
          value={category}
          onValueChange={(value) => setCategory(value as FeedbackCategory)}
        >
          {FEEDBACK_CATEGORIES.map(({ id, labelKey }) => (
            <Radio key={id} value={id}>
              {t(labelKey)}
            </Radio>
          ))}
        </RadioGroup>
        <Textarea
          {...inputProperties.input}
          data-testid="feedback-message"
          errorMessage={messageError}
          isDisabled={isLoading}
          isInvalid={isMessageMissing || isMessageTooLong}
          label={t('feedback.messageLabel')}
          minRows={4}
          placeholder={t('feedback.messagePlaceholder')}
          value={message}
          onValueChange={setMessage}
        />
        <p className="text-xs text-default-500">{t('feedback.contextNotice')}</p>
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
          data-testid="feedback-submit-btn"
          isLoading={isLoading}
          size="sm"
          onPress={handleSubmit}
        >
          {t('feedback.send')}
        </Button>
      </ModalFooter>
    </>
  );
}

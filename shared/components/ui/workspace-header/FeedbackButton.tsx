'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots } from '@fortawesome/free-solid-svg-icons';

import { useFeedback } from '@/features/hooks/useFeedback.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

export function FeedbackButton() {
  const { t } = useTranslation();
  const { openFeedback } = useFeedback();

  return (
    <button
      aria-label={t('feedback.widgetAria')}
      className="relative w-8 h-8 flex items-center justify-center border border-default-200 rounded-lg hover:border-default-300 transition-colors bg-content1"
      data-testid="feedback-widget-btn"
      title={t('feedback.navLabel')}
      type="button"
      onClick={openFeedback}
    >
      <FontAwesomeIcon aria-hidden="true" className="text-default-400 w-3 h-3" icon={faCommentDots} />
    </button>
  );
}

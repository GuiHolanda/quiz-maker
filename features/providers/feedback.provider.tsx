'use client';

import { usePathname } from 'next/navigation';
import { createContext, useCallback, useMemo, useReducer, type ReactNode } from 'react';

import type { FeedbackCategory, QuestionReportReason } from '@/config/constants';
import { submitFeedback, submitQuestionReport } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import {
  feedbackReducer,
  INITIAL_FEEDBACK_STATE,
  type QuestionReportTarget,
} from '@/features/reducers/feedback.reducer';
import { resolveFeedbackError, type FeedbackErrorKind } from '@/lib/feedback-error';
import { ReportQuestionModal } from '@/shared/components/ui/ReportQuestionModal';
import { notify } from '@/shared/lib/notify';

interface FeedbackContextValue {
  readonly reportTarget: QuestionReportTarget | null;
  readonly isFeedbackOpen: boolean;
  readonly isBusy: boolean;
  readonly openQuestionReport: (target: QuestionReportTarget) => void;
  readonly openFeedback: () => void;
  readonly close: () => void;
  readonly sendQuestionReport: (reason: QuestionReportReason, comment: string) => Promise<void>;
  readonly sendFeedback: (category: FeedbackCategory, message: string) => Promise<void>;
}

export const FeedbackContext = createContext<FeedbackContextValue>({
  reportTarget: null,
  isFeedbackOpen: false,
  isBusy: false,
  openQuestionReport: () => {},
  openFeedback: () => {},
  close: () => {},
  sendQuestionReport: async () => {},
  sendFeedback: async () => {},
});

interface SuccessKeys {
  readonly titleKey: string;
  readonly descriptionKey: string;
}

export function FeedbackProvider({ children }: { readonly children: ReactNode }) {
  const [state, dispatch] = useReducer(feedbackReducer, INITIAL_FEEDBACK_STATE);
  const { t, language } = useTranslation();
  const pathname = usePathname();

  const openQuestionReport = useCallback(
    (target: QuestionReportTarget) => dispatch({ type: 'openQuestionReport', payload: target }),
    []
  );
  const openFeedback = useCallback(() => dispatch({ type: 'openFeedback' }), []);
  const close = useCallback(() => dispatch({ type: 'close' }), []);

  const send = useCallback(
    async (kind: FeedbackErrorKind, request: () => Promise<unknown>, success: SuccessKeys) => {
      dispatch({ type: 'submitStarted' });

      try {
        await request();
      } catch (err) {
        const { titleKey, descriptionKey } = resolveFeedbackError(err, kind);

        notify.error(t(titleKey), t(descriptionKey));
        dispatch({ type: 'submitFailed' });

        return;
      }

      notify.success(t(success.titleKey), t(success.descriptionKey));
      dispatch({ type: 'submitSucceeded' });
    },
    [t]
  );

  const { reportTarget, isBusy } = state;

  const sendQuestionReport = useCallback(
    async (reason: QuestionReportReason, comment: string) => {
      if (!reportTarget || isBusy) return;

      await send(
        'question_report',
        () => submitQuestionReport({ ...reportTarget, reason, comment: comment.trim() || undefined }),
        { titleKey: 'feedback.reportSuccessTitle', descriptionKey: 'feedback.reportSuccessDescription' }
      );
    },
    [reportTarget, isBusy, send]
  );

  const sendFeedback = useCallback(
    async (category: FeedbackCategory, message: string) => {
      if (isBusy) return;

      await send(
        'feedback',
        () => submitFeedback({ category, message: message.trim(), route: pathname, locale: language }),
        {
          titleKey: 'feedback.sendSuccessTitle',
          descriptionKey: 'feedback.sendSuccessDescription',
        }
      );
    },
    [isBusy, send, pathname, language]
  );

  const contextValue = useMemo(
    () => ({
      reportTarget,
      isFeedbackOpen: state.isFeedbackOpen,
      isBusy,
      openQuestionReport,
      openFeedback,
      close,
      sendQuestionReport,
      sendFeedback,
    }),
    [
      reportTarget,
      state.isFeedbackOpen,
      isBusy,
      openQuestionReport,
      openFeedback,
      close,
      sendQuestionReport,
      sendFeedback,
    ]
  );

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      <ReportQuestionModal
        isLoading={isBusy}
        isOpen={reportTarget !== null}
        onClose={close}
        onSubmit={sendQuestionReport}
      />
    </FeedbackContext.Provider>
  );
}

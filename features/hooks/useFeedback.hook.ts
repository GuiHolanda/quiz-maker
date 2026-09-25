'use client';

import { useContext } from 'react';

import { FeedbackContext } from '@/features/providers/feedback.provider';

export function useFeedback() {
  return useContext(FeedbackContext);
}

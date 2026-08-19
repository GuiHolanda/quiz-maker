'use client';

import { useContext } from 'react';

import { LimitModalContext } from '@/features/providers/limit-modal.provider';

export function useLimitModal() {
  return useContext(LimitModalContext);
}

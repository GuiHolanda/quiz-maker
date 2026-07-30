import { useContext } from 'react';

import { ExamsContext } from '@/features/providers/exams.provider';

export function useExamsContext() {
  const ctx = useContext(ExamsContext);

  if (!ctx) throw new Error('useExamsContext must be used within an ExamsProvider');

  return ctx;
}

export default useExamsContext;

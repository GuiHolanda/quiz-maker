import { useContext } from 'react';

import { PublicExamsContext } from '@/features/providers/publicExams.provider';

export function usePublicExamsContext() {
  const ctx = useContext(PublicExamsContext);

  if (!ctx) throw new Error('usePublicExamsContext must be used within a PublicExamsProvider');

  return ctx;
}

export default usePublicExamsContext;

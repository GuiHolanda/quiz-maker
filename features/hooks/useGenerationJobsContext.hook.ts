'use client';

import { useContext } from 'react';

import { GenerationJobsContext } from '@/features/providers/generationJobs.provider';

export function useGenerationJobsContext() {
  return useContext(GenerationJobsContext);
}

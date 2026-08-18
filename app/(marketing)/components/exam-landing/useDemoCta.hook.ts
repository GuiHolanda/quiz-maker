'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';
import { demoHrefForSlug, hasDemoTemplate } from '@/config/demo-links';
import { DEMO_QUIZ_SIZE } from '@/config/constants';

interface DemoCta {
  readonly href: string;
  readonly label: string;
}

// The primary CTA repeats in the hero, in the question panel and in the closing
// section, and all three have to drop the exam name on the pages whose exam has
// no catalog template, where the demo can only offer the generic catalog.
export function useDemoCta(config: ExamLandingConfig): DemoCta {
  const { t } = useTranslation();

  const label = hasDemoTemplate(config.slug)
    ? t('landing.hero.ctaPrimary', { count: DEMO_QUIZ_SIZE, name: config.name })
    : t('landing.hero.ctaPrimaryGeneric', { count: DEMO_QUIZ_SIZE });

  return { href: demoHrefForSlug(config.slug), label };
}

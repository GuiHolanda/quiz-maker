'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';
import { HowItWorksSteps } from '@/app/(marketing)/components/shared/HowItWorksSteps';

const STEPS = ['step1', 'step2', 'step3', 'step4'] as const;

interface ExamHowItWorksSectionProps {
  readonly config: ExamLandingConfig;
}

export function ExamHowItWorksSection({ config }: ExamHowItWorksSectionProps) {
  const { t } = useTranslation();

  return (
    <HowItWorksSteps
      kick={t('landing.howItWorks.kick')}
      maxWidth="max-w-6xl"
      sectionId="how-it-works"
      steps={STEPS.map((step, index) => ({
        num: String(index + 1).padStart(2, '0'),
        title: t(`landing.howItWorks.${step}.title`),
        body: t(`landing.howItWorks.${step}.desc`, { name: config.name }),
      }))}
      subtitle={t('landing.howItWorks.subheading')}
      surface="surface"
      title={t('landing.howItWorks.heading')}
    />
  );
}

'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { HowItWorksSteps } from '@/app/(marketing)/components/shared/HowItWorksSteps';

const STEPS = [
  { num: '01', titleKey: 'homepage.howItWorks.step1Title', bodyKey: 'homepage.howItWorks.step1Body' },
  { num: '02', titleKey: 'homepage.howItWorks.step2Title', bodyKey: 'homepage.howItWorks.step2Body' },
  { num: '03', titleKey: 'homepage.howItWorks.step3Title', bodyKey: 'homepage.howItWorks.step3Body' },
  { num: '04', titleKey: 'homepage.howItWorks.step4Title', bodyKey: 'homepage.howItWorks.step4Body' },
] as const;

export function HowItWorksSection() {
  const { t } = useTranslation();

  return (
    <HowItWorksSteps
      kick={t('homepage.howItWorks.kick')}
      maxWidth="max-w-7xl"
      sectionId="como-funciona"
      steps={STEPS.map((step) => ({ num: step.num, title: t(step.titleKey), body: t(step.bodyKey) }))}
      subtitle={t('homepage.howItWorks.subtitle')}
      surface="bg"
      title={t('homepage.howItWorks.title')}
    />
  );
}

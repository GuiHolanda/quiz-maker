'use client';

import { BulletList } from '@/shared/components/ui/BulletList';
import { CardHeading } from '@/shared/components/ui/CardHeading';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

const STEPS = [
  { num: '01', titleKey: 'exam.nextStep1Title', bodyKey: 'exam.nextStep1Body', active: true },
  { num: '02', titleKey: 'exam.nextStep2Title', bodyKey: 'exam.nextStep2Body', active: false },
  { num: '03', titleKey: 'exam.nextStep3Title', bodyKey: 'exam.nextStep3Body', active: false },
] as const;

export function NextStepsCard() {
  const { t } = useTranslation();

  return (
    <div className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-5">
      <CardHeading>{t('exam.nextStepsTitle')}</CardHeading>
      <BulletList
        className="mt-4"
        items={STEPS.map((step) => ({
          key: step.num,
          leading: (
            <div
              className={`w-[26px] h-[26px] rounded-lg font-mono text-[11px] flex items-center justify-center ${
                step.active ? 'bg-primary text-primary-foreground' : 'bg-content2 text-default-400'
              }`}
            >
              {step.num}
            </div>
          ),
          title: t(step.titleKey),
          body: t(step.bodyKey),
        }))}
      />
    </div>
  );
}

'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

const STEPS = [
  { num: '01', titleKey: 'exam.nextStep1Title', bodyKey: 'exam.nextStep1Body', active: true },
  { num: '02', titleKey: 'exam.nextStep2Title', bodyKey: 'exam.nextStep2Body', active: false },
  { num: '03', titleKey: 'exam.nextStep3Title', bodyKey: 'exam.nextStep3Body', active: false },
] as const;

// Static explainer for the rail — mirrors the 3-step flow the imported design describes
// (review the seed, set the format, generate questions), not tied to any live state.
export function NextStepsCard() {
  const { t } = useTranslation();

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-5">
      <div className="font-mono text-[11px] uppercase tracking-widest text-default-400">{t('exam.nextStepsTitle')}</div>
      <div className="mt-4 flex flex-col gap-4">
        {STEPS.map((step) => (
          <div key={step.num} className="grid grid-cols-[26px_1fr] gap-3">
            <div
              className={`w-[26px] h-[26px] rounded-lg font-mono text-[11px] flex items-center justify-center ${
                step.active ? 'bg-primary text-primary-foreground' : 'bg-content2 text-default-400'
              }`}
            >
              {step.num}
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{t(step.titleKey)}</div>
              <p className="mt-1 text-[13px] leading-relaxed text-default-500 text-pretty">{t(step.bodyKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

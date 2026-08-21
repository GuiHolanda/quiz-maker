'use client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScissors, faListCheck, faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

const TIPS = [
  { icon: faScissors, bodyKey: 'exam.tip1' },
  { icon: faListCheck, bodyKey: 'exam.tip2' },
  { icon: faClockRotateLeft, bodyKey: 'exam.tip3' },
] as const;

// Static — mirrors NextStepsCard's shape (seed/NextStepsCard.tsx), no props needed.
export function ExamTipsCard() {
  const { t } = useTranslation();

  return (
    <div className="bg-content1 border border-content2 rounded-xl p-5">
      <div className="text-xs font-semibold text-default-500">{t('exam.tipsTitle')}</div>
      <div className="mt-4 flex flex-col gap-3">
        {TIPS.map((tip) => (
          <div key={tip.bodyKey} className="flex items-start gap-2.5">
            <FontAwesomeIcon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" icon={tip.icon} />
            <p className="text-[13px] leading-relaxed text-default-500 text-pretty">{t(tip.bodyKey)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

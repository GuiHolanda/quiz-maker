'use client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScissors, faListCheck, faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';

import { BulletList } from '@/shared/components/ui/BulletList';
import { CardHeading } from '@/shared/components/ui/CardHeading';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

const TIPS = [
  { icon: faScissors, bodyKey: 'exam.tip1' },
  { icon: faListCheck, bodyKey: 'exam.tip2' },
  { icon: faClockRotateLeft, bodyKey: 'exam.tip3' },
] as const;

export function ExamTipsCard() {
  const { t } = useTranslation();

  return (
    <div className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-5">
      <CardHeading>{t('exam.tipsTitle')}</CardHeading>
      <BulletList
        className="mt-4"
        gap="sm"
        items={TIPS.map((tip) => ({
          key: tip.bodyKey,
          leading: <FontAwesomeIcon className="w-3.5 h-3.5 mt-0.5 text-primary" icon={tip.icon} />,
          body: t(tip.bodyKey),
        }))}
      />
    </div>
  );
}

'use client';

import NextLink from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleArrowUp, faGift } from '@fortawesome/free-solid-svg-icons';

import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { UsageStats } from '@/shared/types';

export function CreditsCard() {
  const { t, language } = useTranslation();
  const { usage } = useUsageContext();

  const unlimited = usage?.questionsLimit === -1;
  const pct = usage && !unlimited ? Math.min(100, Math.round((usage.questionsUsed / usage.questionsLimit) * 100)) : 0;

  let renewLabel = '';
  if (usage) {
    const renewDate = new Date(usage.periodStartDate);
    renewDate.setDate(renewDate.getDate() + 30);
    renewLabel = renewDate.toLocaleDateString(language === 'en' ? 'en-US' : 'pt-BR');
  }

  return (
    <div
      className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6"
      data-testid="dashboard-credits"
    >
      {!usage ? (
        <SkeletonListLoader count={1} height="h-28" />
      ) : (
        <CreditsBody pct={pct} renewLabel={renewLabel} t={t} unlimited={unlimited} usage={usage} />
      )}
    </div>
  );
}

interface CreditsBodyProps {
  readonly usage: UsageStats;
  readonly unlimited: boolean;
  readonly pct: number;
  readonly renewLabel: string;
  readonly t: (key: string, params?: Record<string, string | number>) => string;
}

function CreditsBody({ usage, unlimited, pct, renewLabel, t }: CreditsBodyProps) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-xs text-default-400 tracking-wide">{t('dashboard.home.creditsKicker')}</p>
        <span className="font-mono text-sm text-foreground">
          {unlimited ? t('dashboard.home.creditsUnlimited') : `${usage.questionsUsed} / ${usage.questionsLimit}`}
        </span>
      </div>

      {!unlimited && (
        <div className="mt-3 h-2 rounded-full bg-background overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      )}

      <p className="mt-3 text-xs text-default-500 text-pretty">
        {t('dashboard.home.creditsRenew', { date: renewLabel })} {t('dashboard.home.creditsReferralNote')}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <NextLink className={`${buttonStyles.secondarySm} inline-flex items-center gap-2 border`} href="/billing">
          <FontAwesomeIcon className="text-xs" icon={faCircleArrowUp} />
          {t('dashboard.home.creditsPlans')}
        </NextLink>
        <NextLink className={`${buttonStyles.secondarySm} inline-flex items-center gap-2 border`} href="/billing">
          <FontAwesomeIcon className="text-xs" icon={faGift} />
          {t('dashboard.home.creditsReferral')}
        </NextLink>
      </div>
    </>
  );
}

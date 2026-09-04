'use client';

import { useEffect, useState } from 'react';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCopy, faEnvelope, faGift, faLink } from '@fortawesome/free-solid-svg-icons';

import type { ReferralStats } from '@/shared/types';
import { IconBadge } from '@/shared/components/ui/IconBadge';
import { getReferralStats } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { REFERRAL_REWARD } from '@/config/constants';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { formatCount } from '@/app/(workspace)/billing/components/billingFormat';

export function ReferralCard() {
  const { t, language } = useTranslation();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getReferralStats().then(setStats);
  }, []);

  if (!stats) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(stats!.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error(t('toast.error'), t('toast.somethingWrong'));
    }
  }

  const mailtoHref = `mailto:?subject=${encodeURIComponent(t('billing.referral.emailSubject'))}&body=${encodeURIComponent(
    t('billing.referral.emailBody', { link: stats.referralLink })
  )}`;
  const displayLink = stats.referralLink.replace(/^https?:\/\//, '');

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
      <div className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6">
        <div className="flex items-start gap-3.5">
          <IconBadge icon={faGift} />
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-foreground">{t('billing.referral.cardTitle')}</h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-default-500 text-pretty">
              {t('billing.referral.description', {
                referrerBonus: REFERRAL_REWARD.referrerBonus,
                referredBonus: REFERRAL_REWARD.referredBonus,
              })}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <div className="flex min-w-[240px] flex-1 items-center gap-2.5 rounded-lg border border-divider bg-background px-3.5 py-3">
            <FontAwesomeIcon className="h-3.5 w-3.5 shrink-0 text-default-400" icon={faLink} />
            <span className="truncate font-mono text-[13px] text-default-500">{displayLink}</span>
          </div>
          <Button className={`${buttonStyles.primary}${copied ? ' !bg-success' : ''}`} onPress={handleCopy}>
            <FontAwesomeIcon className="h-3.5 w-3.5" icon={copied ? faCheck : faCopy} />
            {copied ? t('billing.referral.linkCopied') : t('billing.referral.copyLink')}
          </Button>
          <Button as="a" className={buttonStyles.secondary} href={mailtoHref} variant="bordered">
            <FontAwesomeIcon className="h-3.5 w-3.5" icon={faEnvelope} />
            {t('billing.referral.inviteByEmail')}
          </Button>
        </div>
      </div>

      <div className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6">
        <span className="text-xs font-semibold text-primary">{t('billing.referral.myReferralsLabel')}</span>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="font-mono text-2xl tracking-tight text-foreground">
              {formatCount(stats.activatedCount, language)}
            </p>
            <p className="mt-1 text-xs text-default-400">{t('billing.referral.statsActivated')}</p>
          </div>
          <div>
            <p className="font-mono text-2xl tracking-tight text-primary">
              +{formatCount(stats.bonusQuestionsEarned, language)}
            </p>
            <p className="mt-1 text-xs text-default-400">{t('billing.referral.statsBonusEarned')}</p>
          </div>
        </div>
        <p className="mt-4 border-t border-divider pt-4 text-xs leading-relaxed text-default-500 text-pretty">
          {t('billing.referral.bonusNote')}
        </p>
      </div>
    </section>
  );
}

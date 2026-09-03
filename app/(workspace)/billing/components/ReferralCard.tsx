'use client';

import { useEffect, useState } from 'react';
import { Input } from '@heroui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';

import type { ReferralStats } from '@/shared/types';
import { getReferralStats } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { REFERRAL_REWARD } from '@/config/constants';
import { inputProperties } from '@/config/constants/inputStyles';

export function ReferralCard() {
  const { t } = useTranslation();
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

  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground mb-4">{t('billing.referral.sectionTitle')}</h3>
      <div className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6 flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-content2 border border-default-200 rounded-lg flex items-center justify-center text-primary shrink-0">
            <FontAwesomeIcon icon={faGift} />
          </div>
          <p className="text-sm text-default-500">
            {t('billing.referral.description', {
              referrerBonus: REFERRAL_REWARD.referrerBonus,
              referredBonus: REFERRAL_REWARD.referredBonus,
            })}
          </p>
        </div>

        <Input
          isReadOnly
          endContent={
            <button
              aria-label={t('aria.copyReferralLink')}
              className="text-default-400 hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:text-foreground"
              tabIndex={-1}
              type="button"
              onClick={handleCopy}
              onMouseDown={(e) => e.preventDefault()}
            >
              <FontAwesomeIcon className="w-3.5 h-3.5" icon={copied ? faCheck : faCopy} />
            </button>
          }
          label={t('billing.referral.linkLabel')}
          placeholder=" "
          value={stats.referralLink}
          {...inputProperties.input}
        />

        <div className="grid grid-cols-3 gap-4 pt-1">
          <div>
            <p className="text-lg font-semibold text-foreground">{stats.referredCount}</p>
            <p className="text-xs text-default-400">{t('billing.referral.statsReferred')}</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">{stats.activatedCount}</p>
            <p className="text-xs text-default-400">{t('billing.referral.statsActivated')}</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-primary">+{stats.bonusQuestionsEarned}</p>
            <p className="text-xs text-default-400">{t('billing.referral.statsBonusEarned')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

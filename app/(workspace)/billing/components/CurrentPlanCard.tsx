'use client';

import type { ReactNode } from 'react';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare, faCircleArrowUp } from '@fortawesome/free-solid-svg-icons';

import { StatusPill } from '@/shared/components/ui/StatusPill';
import { CycleUsageMeters } from '@/app/(workspace)/billing/components/CycleUsageMeters';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import type { StatusTone } from '@/shared/components/ui/tone';

interface UsageMeter {
  readonly label: string;
  readonly used: number;
  readonly limit: number;
  readonly note: string;
}

interface CurrentPlanCardProps {
  readonly planLabel: string;
  readonly price: string;
  readonly cycleNote: string;
  readonly statusLabel: string | null;
  readonly statusTone: StatusTone;
  readonly renewalNote: ReactNode;
  readonly periodLabel: string;
  readonly meters: readonly UsageMeter[];
  readonly showUpgrade: boolean;
  readonly showPortal: boolean;
  readonly isPortalLoading: boolean;
  readonly onUpgrade: () => void;
  readonly onPortal: () => void;
}

export function CurrentPlanCard({
  planLabel,
  price,
  cycleNote,
  statusLabel,
  statusTone,
  renewalNote,
  periodLabel,
  meters,
  showUpgrade,
  showPortal,
  isPortalLoading,
  onUpgrade,
  onPortal,
}: CurrentPlanCardProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-primary">{t('billing.currentPlanLabel')}</span>
            {statusLabel && <StatusPill tone={statusTone}>{statusLabel}</StatusPill>}
          </div>
          <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">{planLabel}</span>
            {price && <span className="font-mono text-base text-foreground">{price}</span>}
            {cycleNote && <span className="text-sm text-default-500">{cycleNote}</span>}
          </div>
          <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-default-500 text-pretty">{renewalNote}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {showUpgrade && (
            <Button className={buttonStyles.primary} onPress={onUpgrade}>
              <FontAwesomeIcon className="h-3.5 w-3.5" icon={faCircleArrowUp} />
              {t('billing.upgradeCta')}
            </Button>
          )}
          {showPortal && (
            <Button
              className={buttonStyles.secondary}
              isLoading={isPortalLoading}
              variant="bordered"
              onPress={onPortal}
            >
              <FontAwesomeIcon className="h-3.5 w-3.5" icon={faArrowUpRightFromSquare} />
              {t('billing.stripePortal')}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-divider pt-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-primary">{t('billing.cycleUsageLabel')}</span>
          <span className="text-xs text-default-500">{periodLabel}</span>
        </div>
        <div className="mt-4">
          <CycleUsageMeters meters={meters} />
        </div>
      </div>
    </div>
  );
}

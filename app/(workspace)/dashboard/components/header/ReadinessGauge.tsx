'use client';

import { Chip } from '@heroui/chip';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

export function ReadinessGauge() {
  const { t } = useTranslation();

  return (
    <div className="shrink-0 lg:w-64 bg-content2 p-6 flex flex-col items-center justify-center relative overflow-hidden opacity-50">
      <p className="font-mono text-[9px] text-default-400 uppercase mb-4 relative z-10">
        {t('dashboard.examReadiness')}
      </p>
      <div className="relative z-10 flex flex-col items-center">
        <svg className="overflow-visible" height="100" viewBox="0 0 160 100" width="160">
          <path
            d="M 20 90 A 60 60 0 0 1 140 90"
            fill="none"
            stroke="rgba(224,120,32,0.15)"
            strokeLinecap="round"
            strokeWidth="10"
          />
          <path
            d="M 20 90 A 60 60 0 0 1 140 90"
            fill="none"
            stroke="rgba(224,120,32,0.3)"
            strokeDasharray="188.4"
            strokeDashoffset="94.2"
            strokeLinecap="round"
            strokeWidth="10"
          />
        </svg>
        <div className="mt-2">
          <Chip color="default" size="sm" variant="flat">
            {t('dashboard.comingSoon')}
          </Chip>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 relative z-10">
        <div className="text-center">
          <p className="font-mono text-xs text-foreground font-semibold">-</p>
          <p className="font-mono text-[9px] text-default-400">{t('dashboard.projectedScore')}</p>
        </div>
        <div className="w-px h-6 bg-default-200" />
        <div className="text-center">
          <p className="font-mono text-xs text-primary font-semibold">-</p>
          <p className="font-mono text-[9px] text-default-400">{t('dashboard.peerRank')}</p>
        </div>
      </div>
    </div>
  );
}

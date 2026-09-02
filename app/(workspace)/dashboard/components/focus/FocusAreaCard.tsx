'use client';

import NextLink from 'next/link';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt } from '@fortawesome/free-solid-svg-icons';

import { buttonStyles } from '@/config/constants/buttonStyles';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { scoreToneBg, scoreToneText } from '@/shared/lib/scoreTone';
import type { DashboardDomainStat } from '@/shared/types';

interface FocusAreaCardProps {
  readonly domain: DashboardDomainStat;
}

function borderColor(score: number) {
  if (score < 50) return 'border-danger/20';
  if (score < 70) return 'border-warning/20';
  return 'border-secondary/20';
}

export function FocusAreaCard({ domain }: FocusAreaCardProps) {
  const { t } = useTranslation();

  return (
    <div className={`p-4 rounded-xl border ${borderColor(domain.avgScore)} bg-content1`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${scoreToneBg(domain.avgScore)}`} />
            <p className="font-semibold text-foreground text-sm">{domain.sectionName}</p>
          </div>
          <p className="font-mono text-[10px] text-default-400 ml-4">
            {domain.totalAttempts} {domain.totalAttempts === 1 ? 'attempt' : 'attempts'}
          </p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className={`font-bold text-lg leading-none ${scoreToneText(domain.avgScore)}`}>{domain.avgScore}%</p>
          <p className="font-mono text-[9px] text-default-400">{t('dashboard.accuracy')}</p>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[9px] text-default-400">{t('dashboard.masteryProgress')}</span>
          <span className={`font-mono text-[9px] ${scoreToneText(domain.avgScore)}`}>{domain.avgScore} / 100</span>
        </div>
        <div className="h-1.5 bg-default-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${scoreToneBg(domain.avgScore)}`}
            style={{ width: `${domain.avgScore}%` }}
          />
        </div>
      </div>

      <div className="flex items-center">
        <Button
          as={NextLink}
          className={`ml-auto ${buttonStyles.primarySm}`}
          href="/simulados"
          startContent={<FontAwesomeIcon className="text-xs" icon={faBolt} />}
        >
          {t('dashboard.studyNow')}
        </Button>
      </div>
    </div>
  );
}

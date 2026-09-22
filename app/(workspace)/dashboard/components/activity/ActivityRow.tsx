'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faCircleCheck, faFileCirclePlus, faSliders, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DashboardActivityItem } from '@/shared/types';

interface ActivityRowProps {
  readonly item: DashboardActivityItem;
}

const ICONS: Record<DashboardActivityItem['kind'], { icon: IconDefinition; tone: string }> = {
  simulado_finished: { icon: faCircleCheck, tone: 'text-success' },
  questions_generated: { icon: faWandMagicSparkles, tone: 'text-primary' },
  auto_config_done: { icon: faSliders, tone: 'text-primary' },
  exam_created: { icon: faFileCirclePlus, tone: 'text-default-400' },
};

type Translate = (key: string, params?: Record<string, string | number>) => string;

function textFor(item: DashboardActivityItem, t: Translate): string {
  const name = item.params.name ?? '';
  const count = item.params.count ?? 0;

  if (item.kind === 'simulado_finished') {
    return item.params.score === undefined
      ? t('dashboard.home.activitySimuladoTimedOut', { name })
      : t('dashboard.home.activitySimuladoFinished', { name, score: item.params.score });
  }
  if (item.kind === 'questions_generated') {
    return item.params.name
      ? t('dashboard.home.activityQuestionsGenerated', { count, name })
      : t('dashboard.home.activityQuestionsGeneratedNoName', { count });
  }
  if (item.kind === 'auto_config_done') {
    return t('dashboard.home.activityAutoConfigDone', { name });
  }
  return t('dashboard.home.activityExamCreated', { name });
}

export function ActivityRow({ item }: ActivityRowProps) {
  const { t } = useTranslation();
  const { icon, tone } = ICONS[item.kind];

  return (
    <div className="flex gap-3">
      <div className={`shrink-0 w-7 h-7 rounded-lg bg-content2 flex items-center justify-center ${tone}`}>
        <FontAwesomeIcon className="text-xs" icon={icon} />
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm leading-snug text-default-600 text-pretty">{textFor(item, t)}</p>
        <p className="mt-0.5 text-xs text-default-400">
          <RelativeDate date={item.at} />
        </p>
      </div>
    </div>
  );
}

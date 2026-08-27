'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

import { TONE_BG, signedPP, type ResultView, type TopicTag } from './deriveResult';

interface TopicPerformancePanelProps {
  readonly view: ResultView;
}

const TAG_LABEL: Record<TopicTag, string> = {
  strong: 'simulado.result.strong',
  attention: 'simulado.result.attention',
  critical: 'simulado.result.critical',
};

const TAG_CHIP: Record<TopicTag, string> = {
  strong: 'border-success/30 bg-success/10 text-success',
  attention: 'border-primary/30 bg-primary/10 text-primary',
  critical: 'border-danger/30 bg-danger/10 text-danger',
};

export function TopicPerformancePanel({ view }: TopicPerformancePanelProps) {
  const { t } = useTranslation();

  const hasBaseline = view.previousAvgPercent != null;

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="text-base font-bold tracking-tight text-foreground">{t('simulado.result.byTopicTitle')}</h2>
        <span className="font-mono text-xs text-default-400">{t('simulado.result.byTopicLegend')}</span>
      </div>
      <p className="mt-1 text-sm text-default-500">
        {hasBaseline ? t('simulado.result.byTopicSubtitle') : t('simulado.result.byTopicSubtitleFirst')}
      </p>

      <div className="mt-4 divide-y divide-default-200">
        {view.topics.map((topic) => (
          <div
            key={topic.sectionName}
            className="grid grid-cols-1 gap-x-6 gap-y-3 py-4 sm:grid-cols-[minmax(0,1fr)_190px_auto] sm:items-center"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">{topic.sectionName}</div>
              <div className="mt-1 font-mono text-xs text-default-500">
                {t('simulado.result.topicWeight', { weight: topic.weightPercent, total: topic.total })}
              </div>
            </div>

            <div>
              <div className="h-1.5 rounded-full bg-default-300">
                <div className={`h-1.5 rounded-full ${TONE_BG[topic.tone]}`} style={{ width: `${topic.percent}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 font-mono text-xs">
                <span className="text-default-500">
                  {topic.correct}/{topic.total} · {topic.percent}%
                </span>
                <span
                  className={
                    topic.delta == null ? 'text-default-400' : topic.delta >= 0 ? 'text-success' : 'text-danger'
                  }
                >
                  {topic.delta == null
                    ? t('simulado.result.noChange')
                    : t('simulado.result.change', { delta: signedPP(topic.delta) })}
                </span>
              </div>
            </div>

            <div className="sm:justify-self-end">
              <span
                className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${TAG_CHIP[topic.tag]}`}
              >
                {t(TAG_LABEL[topic.tag])}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

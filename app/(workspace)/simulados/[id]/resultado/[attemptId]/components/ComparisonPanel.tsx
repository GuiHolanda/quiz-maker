'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

import { TONE_BG, TONE_TEXT, signedPP, type ResultView } from './deriveResult';

interface ComparisonPanelProps {
  readonly view: ResultView;
}

export function ComparisonPanel({ view }: ComparisonPanelProps) {
  const { t } = useTranslation();

  const rows: { key: string; label: string; value: number; bar: string; valueClass: string }[] = [
    {
      key: 'this',
      label: t('simulado.result.compareThis'),
      value: view.percent,
      bar: TONE_BG[view.tone],
      valueClass: TONE_TEXT[view.tone],
    },
  ];

  if (view.previousAvgPercent != null) {
    rows.push({
      key: 'prev',
      label: t('simulado.result.comparePrevAvg'),
      value: view.previousAvgPercent,
      bar: 'bg-default-400',
      valueClass: 'text-foreground',
    });
  }

  if (view.passingScorePercent != null) {
    rows.push({
      key: 'cut',
      label: t('simulado.result.compareCut'),
      value: view.passingScorePercent,
      bar: 'bg-primary',
      valueClass: 'text-foreground',
    });
  }

  const delta = view.previousAvgPercent != null ? view.percent - view.previousAvgPercent : null;

  let footer = t('simulado.result.compareFirst');

  if (delta != null && delta > 0) footer = t('simulado.result.compareImproved', { delta: signedPP(delta) });
  else if (delta != null && delta < 0) footer = t('simulado.result.compareDropped', { delta: Math.abs(delta) });
  else if (delta === 0) footer = t('simulado.result.compareFlat');

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-5">
      <h3 className="text-xs font-semibold text-default-400">{t('simulado.result.compareTitle')}</h3>

      <div className="mt-4 flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.key}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-default-500">{row.label}</span>
              <span className={`font-mono text-sm font-medium ${row.valueClass}`}>{row.value}%</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-default-200">
              <div className={`h-1.5 rounded-full ${row.bar}`} style={{ width: `${Math.min(100, row.value)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-default-400">{footer}</p>
    </div>
  );
}

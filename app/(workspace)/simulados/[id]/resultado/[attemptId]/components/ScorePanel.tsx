'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

import { ScoreDonut } from './ScoreDonut';
import { TONE_BG, TONE_TEXT, type ResultView } from './deriveResult';

interface ScorePanelProps {
  readonly view: ResultView;
}

const WELL = 'rounded-lg bg-background p-4';

export function ScorePanel({ view }: ScorePanelProps) {
  const { t } = useTranslation();

  const toneText = TONE_TEXT[view.tone];
  const toneBg = TONE_BG[view.tone];

  const distribution = [
    { key: 'hits', count: view.correct, fill: 'bg-success', label: t('simulado.result.hits') },
    { key: 'misses', count: view.wrong, fill: 'bg-danger', label: t('simulado.result.misses') },
    { key: 'blank', count: view.blank, fill: 'bg-default-400', label: t('simulado.result.blank') },
  ];

  const timeOverBudget =
    view.durationMinutes != null && view.elapsedMs != null
      ? Math.min(100, (view.elapsedMs / (view.durationMinutes * 60000)) * 100)
      : null;

  return (
    <div className="bg-content1 rounded-xl p-6 md:p-7">
      <div className="grid gap-8 md:grid-cols-[232px_minmax(0,1fr)] md:items-center">
        <div className="mx-auto md:mx-0">
          <ScoreDonut percent={view.percent} toneClass={toneText}>
            <div
              className={`text-[3.25rem] font-extrabold leading-none tracking-tight ${toneText}`}
              data-testid="result-percent"
            >
              {view.percent}%
            </div>
            <div className="mt-1.5 text-sm text-default-500" data-testid="result-score">
              {t('simulado.result.scoreCaption', { correct: view.correct, total: view.total })}
            </div>
            {view.passed != null && (
              <div
                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  view.passed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                }`}
              >
                <FontAwesomeIcon icon={view.passed ? faCircleCheck : faTriangleExclamation} />
                {view.passed ? t('simulado.result.approved') : t('simulado.result.notApproved')}
              </div>
            )}
          </ScoreDonut>
        </div>

        <div className="min-w-0 space-y-3.5">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className={WELL}>
              <div className="text-xs text-default-500">{t('simulado.result.scoreCard')}</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`font-mono text-[1.65rem] font-medium ${toneText}`}>
                  {view.correct}
                  <span className="text-default-400">/{view.total}</span>
                </span>
                {view.passingScorePercent != null && (
                  <span className="text-xs text-default-400">
                    {t('simulado.result.cut', { score: view.passingScorePercent })}
                  </span>
                )}
              </div>
              {view.passingScorePercent != null ? (
                <>
                  <div className="relative mt-3 h-1.5 rounded-full bg-default-300">
                    <div
                      className={`h-1.5 rounded-full ${toneBg}`}
                      style={{ width: `${Math.min(100, view.percent)}%` }}
                    />
                    <div
                      className="absolute -top-1 h-3.5 w-0.5 bg-primary"
                      style={{ left: `${Math.min(100, view.passingScorePercent)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-default-500">
                    {view.marginPP != null && view.marginPP >= 0
                      ? t('simulado.result.marginAbove', { delta: view.marginPP })
                      : t('simulado.result.marginBelow', { delta: Math.abs(view.marginPP ?? 0) })}
                  </div>
                </>
              ) : (
                <div className="mt-3 text-xs text-default-500">{view.percent}%</div>
              )}
            </div>

            <div className={WELL}>
              <div className="text-xs text-default-500">{t('simulado.result.examTime')}</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-[1.65rem] font-medium text-foreground">{view.elapsedLabel ?? '—'}</span>
                {view.durationLabel != null && <span className="text-xs text-default-400">/ {view.durationLabel}</span>}
              </div>
              {timeOverBudget != null ? (
                <div className="mt-3 h-1.5 rounded-full bg-default-300">
                  <div className="h-1.5 rounded-full bg-default-500" style={{ width: `${timeOverBudget}%` }} />
                </div>
              ) : (
                <div className="mt-3 h-1.5" />
              )}
              <div className="mt-2 text-xs text-default-500">
                {view.perQuestionLabel != null
                  ? t('simulado.result.perQuestion', { time: view.perQuestionLabel })
                  : t('simulado.result.noTimeLimit')}
              </div>
            </div>
          </div>

          <div className={WELL}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-xs text-default-500">{t('simulado.result.distribution')}</span>
              <span className="font-mono text-xs text-default-400">
                {t('simulado.result.questionsShort', { count: view.total })}
              </span>
            </div>
            <div className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
              {distribution
                .filter((segment) => segment.count > 0)
                .map((segment) => (
                  <div
                    key={segment.key}
                    className={segment.fill}
                    style={{ width: `${(segment.count / Math.max(1, view.total)) * 100}%` }}
                  />
                ))}
            </div>
            <div className="mt-3.5 grid grid-cols-3 gap-3">
              {distribution.map((segment) => (
                <div key={segment.key} className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-sm ${segment.fill}`} />
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-medium text-foreground">{segment.count}</div>
                    <div className="truncate text-xs text-default-500">{segment.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

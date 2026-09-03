'use client';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

import { signedPP, type ResultView } from './deriveResult';

interface NextStepPanelProps {
  readonly view: ResultView;
  readonly isRetrying: boolean;
  readonly onRetry: () => void;
}

export function NextStepPanel({ view, isRetrying, onRetry }: NextStepPanelProps) {
  const { t } = useTranslation();

  const focus = view.weakest && view.weakest.percent < 75 && view.wrong + view.blank > 0 ? view.weakest : null;
  const weakTopics = view.topics
    .filter((topic) => topic.tag !== 'strong')
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 3);

  return (
    <div className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-5">
      <h3 className="text-xs font-semibold text-default-400">{t('simulado.result.nextStepTitle')}</h3>

      {focus ? (
        <>
          <p className="mt-3 text-sm font-semibold text-foreground">
            {t('simulado.result.nextStepHeading', { section: focus.sectionName })}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-default-500">
            {t('simulado.result.nextStepBody', {
              section: focus.sectionName,
              correct: focus.correct,
              total: focus.total,
              percent: focus.percent,
            })}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-default-500">{t('simulado.result.nextStepBodyClean')}</p>
      )}

      <Button
        className={`${buttonStyles.primary} mt-4 w-full`}
        data-testid="result-retry-btn"
        isLoading={isRetrying}
        startContent={isRetrying ? undefined : <FontAwesomeIcon icon={faRotateRight} />}
        onPress={onRetry}
      >
        {t('simulado.tryAgain')}
      </Button>

      {weakTopics.length > 0 && (
        <div className="mt-4 flex flex-col gap-2.5 border-t border-divider pt-4">
          {weakTopics.map((topic) => (
            <div key={topic.sectionName} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-sm text-foreground">{topic.sectionName}</span>
              <span
                className={`shrink-0 font-mono text-xs ${topic.delta == null ? 'text-default-400' : topic.delta >= 0 ? 'text-success' : 'text-danger'}`}
              >
                {topic.delta == null
                  ? t('simulado.result.weakTopicMetaNoDelta', { correct: topic.correct, total: topic.total })
                  : t('simulado.result.weakTopicMeta', {
                      correct: topic.correct,
                      total: topic.total,
                      delta: signedPP(topic.delta),
                    })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

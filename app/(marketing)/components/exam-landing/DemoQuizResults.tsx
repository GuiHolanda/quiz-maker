'use client';

import NextLink from 'next/link';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faRotate } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DemoQuestion, DemoQuizResult } from '@/shared/types';

interface DemoQuizResultsProps {
  readonly questions: readonly DemoQuestion[];
  readonly answers: readonly number[];
  readonly onTryAgain: () => void;
  readonly canTryAgain: boolean;
}

function computeResult(questions: readonly DemoQuestion[], answers: readonly number[]): DemoQuizResult {
  const score = answers.filter((answer, index) => answer === questions[index].correctIndex).length;

  const topicMap = new Map<string, { correct: number; total: number }>();
  questions.forEach((question, index) => {
    const entry = topicMap.get(question.topic) ?? { correct: 0, total: 0 };
    const isCorrect = answers[index] === question.correctIndex;
    topicMap.set(question.topic, { correct: entry.correct + (isCorrect ? 1 : 0), total: entry.total + 1 });
  });

  const byTopic = Array.from(topicMap.entries()).map(([topic, stats]) => ({ topic, ...stats }));
  const weakTopics = byTopic.filter((entry) => entry.correct / entry.total < 0.6).map((entry) => entry.topic);

  return { score, total: questions.length, byTopic, weakTopics };
}

export function DemoQuizResults({ questions, answers, onTryAgain, canTryAgain }: DemoQuizResultsProps) {
  const { t } = useTranslation();
  const result = computeResult(questions, answers);
  const pct = Math.round((result.score / result.total) * 100);
  const hasWeakTopics = result.weakTopics.length > 0;

  return (
    <div>
      <div className="text-center mb-8">
        <div className="ds-heading text-mkt-text text-5xl mb-1">
          <span className="text-mkt-accent">{result.score}</span>/{result.total}
        </div>
        <div className="mono text-2xl font-bold text-mkt-text">{pct}%</div>
        <p className="text-mkt-text opacity-60 text-sm mt-2">
          {t('landing.results.score', { score: String(result.score), total: String(result.total) })}
        </p>
      </div>

      <div className="flex flex-col gap-2 mb-8">
        {result.byTopic.map((entry) => {
          const topicPct = Math.round((entry.correct / entry.total) * 100);
          const isWeak = result.weakTopics.includes(entry.topic);
          return (
            <div key={entry.topic} className="flex items-center gap-3">
              <span className={`text-xs shrink-0 w-36 truncate text-mkt-text ${isWeak ? '' : 'opacity-60'}`}>
                {entry.topic}
              </span>
              <div className="flex-1 h-1.5 bg-mkt-surface overflow-hidden">
                <div
                  className={`h-1.5 transition-all duration-500 ${isWeak ? 'bg-mkt-text opacity-40' : 'bg-mkt-accent'}`}
                  style={{ width: `${topicPct}%` }}
                />
              </div>
              <span className={`mono text-xs shrink-0 w-10 text-right text-mkt-text ${isWeak ? '' : 'opacity-60'}`}>
                {topicPct}%
              </span>
            </div>
          );
        })}
      </div>

      {hasWeakTopics ? (
        <div className="bg-mkt-surface border border-mkt-divider p-5 mb-6">
          <span className="kick mb-3">{t('landing.results.weakTopics')}</span>
          <div className="flex flex-wrap gap-2 mb-4 mt-3">
            {result.weakTopics.map((topic) => (
              <span key={topic} className="mono text-xs bg-mkt-bg border border-mkt-text/30 text-mkt-text px-3 py-1">
                {topic}
              </span>
            ))}
          </div>
          <p className="text-sm text-mkt-text opacity-60">{t('landing.results.upsell')}</p>
        </div>
      ) : (
        <div className="bg-mkt-accent-100 border border-mkt-accent p-5 mb-6 flex items-center gap-3">
          <FontAwesomeIcon className="text-mkt-accent text-lg shrink-0" icon={faArrowRight} />
          <p className="text-sm text-mkt-text opacity-70">{t('landing.results.noWeakTopics')}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button
          as={NextLink}
          className="w-full font-semibold text-sm bg-mkt-accent text-white hover:opacity-90"
          href="/register"
          radius="none"
          size="lg"
        >
          {t('landing.results.ctaPrimary')}
          <FontAwesomeIcon className="ml-2 text-xs" icon={faArrowRight} />
        </Button>
        <Button
          as={NextLink}
          className="w-full font-medium text-sm border border-mkt-divider text-mkt-text bg-transparent hover:border-mkt-accent"
          href="/pricing"
          radius="none"
          size="lg"
          variant="bordered"
        >
          {t('landing.results.ctaSecondary')}
        </Button>
        {canTryAgain && (
          <Button
            className="w-full font-medium text-sm text-mkt-text opacity-60 hover:opacity-100 bg-transparent"
            radius="none"
            size="lg"
            variant="light"
            onPress={onTryAgain}
          >
            <FontAwesomeIcon className="mr-2 text-xs" icon={faRotate} />
            {t('landing.results.tryAgain')}
          </Button>
        )}
      </div>

      <p className="text-center text-xs text-mkt-text opacity-50 mt-4">{t('landing.results.disclaimer')}</p>
    </div>
  );
}

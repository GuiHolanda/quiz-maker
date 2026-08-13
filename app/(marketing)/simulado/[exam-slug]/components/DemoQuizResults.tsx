'use client';

import NextLink from 'next/link';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faRotate, faTriangleExclamation, faCircleCheck } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DemoQuestion, DemoQuizResult } from '@/shared/types';

interface DemoQuizResultsProps {
  readonly questions: readonly DemoQuestion[];
  readonly answers: readonly number[];
  readonly examName: string;
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
  const weakTopics = byTopic
    .filter((entry) => entry.correct / entry.total < 0.6)
    .map((entry) => entry.topic);

  return { score, total: questions.length, byTopic, weakTopics };
}

function scoreColorClass(pct: number): string {
  if (pct >= 70) return 'text-success';
  if (pct >= 50) return 'text-warning';
  return 'text-danger';
}

export function DemoQuizResults({ questions, answers, examName: _examName, onTryAgain, canTryAgain }: DemoQuizResultsProps) {
  const { t } = useTranslation();
  const result = computeResult(questions, answers);
  const pct = Math.round((result.score / result.total) * 100);
  const hasWeakTopics = result.weakTopics.length > 0;

  return (
    <div>
      <div className="text-center mb-8">
        <div className={`font-sora font-extrabold text-5xl mb-2 ${scoreColorClass(pct)}`}>
          {result.score}/{result.total}
        </div>
        <div className={`font-mono text-2xl font-bold ${scoreColorClass(pct)}`}>{pct}%</div>
        <p className="text-default-500 text-sm mt-2">
          {t('landing.results.score', { score: String(result.score), total: String(result.total) })}
        </p>
      </div>

      <div className="space-y-2 mb-8">
        {result.byTopic.map((entry) => {
          const topicPct = Math.round((entry.correct / entry.total) * 100);
          const isWeak = result.weakTopics.includes(entry.topic);
          return (
            <div key={entry.topic} className="flex items-center gap-3">
              <span className={`text-xs shrink-0 w-36 truncate ${isWeak ? 'text-danger' : 'text-default-400'}`}>
                {entry.topic}
              </span>
              <div className="flex-1 h-1.5 bg-content2 rounded-full overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${isWeak ? 'bg-danger' : 'bg-success'}`}
                  style={{ width: `${topicPct}%` }}
                />
              </div>
              <span className={`font-mono text-xs shrink-0 w-10 text-right ${isWeak ? 'text-danger' : 'text-default-400'}`}>
                {topicPct}%
              </span>
            </div>
          );
        })}
      </div>

      {hasWeakTopics ? (
        <div className="bg-content1 border border-divider rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FontAwesomeIcon className="text-warning text-sm" icon={faTriangleExclamation} />
            <h3 className="font-semibold text-foreground text-sm">{t('landing.results.weakTopics')}</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {result.weakTopics.map((topic) => (
              <span
                key={topic}
                className="font-mono text-xs bg-danger/10 border border-danger/30 text-danger rounded-full px-3 py-1"
              >
                {topic}
              </span>
            ))}
          </div>
          <p className="text-sm text-default-500">{t('landing.results.upsell')}</p>
        </div>
      ) : (
        <div className="bg-content1 border border-success/30 rounded-xl p-5 mb-6 flex items-center gap-3">
          <FontAwesomeIcon className="text-success text-lg shrink-0" icon={faCircleCheck} />
          <p className="text-sm text-default-500">{t('landing.results.noWeakTopics')}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button
          as={NextLink}
          className="w-full font-semibold text-sm bg-primary text-white rounded"
          href="/register"
          size="lg"
        >
          {t('landing.results.ctaPrimary')}
          <FontAwesomeIcon className="ml-2 text-xs" icon={faArrowRight} />
        </Button>
        <Button
          as={NextLink}
          className="w-full font-medium text-sm border border-divider rounded"
          href="/register"
          size="lg"
          variant="bordered"
        >
          {t('landing.results.ctaSecondary')}
        </Button>
        {canTryAgain && (
          <Button
            className="w-full font-medium text-sm text-default-500 rounded"
            size="lg"
            variant="light"
            onPress={onTryAgain}
          >
            <FontAwesomeIcon className="mr-2 text-xs" icon={faRotate} />
            {t('landing.results.tryAgain')}
          </Button>
        )}
      </div>

      <p className="text-center text-xs text-default-400 mt-4">{t('landing.results.disclaimer')}</p>
    </div>
  );
}

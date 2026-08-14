'use client';

import { useState } from 'react';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DemoQuestion } from '@/shared/types';
import type { DemoCert } from './data/demoCatalog';
import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';

interface DemoStep4DiagnosisProps {
  readonly cert: DemoCert;
  readonly questions: DemoQuestion[];
  readonly answers: Record<string, number>;
  readonly onRestart: () => void;
}

const REVIEW_PAGE_SIZE = 5;

export function DemoStep4Diagnosis({ cert, questions, answers, onRestart }: DemoStep4DiagnosisProps) {
  const { t } = useTranslation();
  const [reviewPage, setReviewPage] = useState(0);

  // Computed stats
  const hits = questions.filter((q, i) => answers[i] === q.correctIndex).length;
  const total = questions.length;
  const scorePct = Math.round((hits / total) * 100);
  const passingNum = parseInt(cert.passing, 10);
  const passed = scorePct >= passingNum;
  const errors = total - hits;

  // Stats by topic
  const topicMap: Record<string, { correct: number; total: number }> = {};
  questions.forEach((question, i) => {
    if (!topicMap[question.topic]) topicMap[question.topic] = { correct: 0, total: 0 };
    topicMap[question.topic].total += 1;
    if (answers[i] === question.correctIndex) topicMap[question.topic].correct += 1;
  });
  const topicList = Object.entries(topicMap)
    .map(([topic, stats]) => ({
      topic,
      correct: stats.correct,
      total: stats.total,
      pct: Math.round((stats.correct / stats.total) * 100),
    }))
    .sort((a, b) => a.pct - b.pct);
  const weakTopics = topicList.filter((item) => item.pct < passingNum);

  // Review pagination
  const totalReviewPages = Math.ceil(questions.length / REVIEW_PAGE_SIZE);
  const reviewQuestions = questions.slice(reviewPage * REVIEW_PAGE_SIZE, (reviewPage + 1) * REVIEW_PAGE_SIZE);

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        <span className="kick">{t('demo.step4.kick')}</span>
        <h1 className="ds-heading text-mkt-text text-4xl mt-2">{t('demo.step4.heading')}</h1>
        <p className="mono text-xs text-mkt-text opacity-50 mt-1">{cert.name}</p>
      </div>

      {/* 4-stat row */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="relative border border-mkt-divider p-5">
          <BlueprintCorners />
          <p className="text-xs text-mkt-text opacity-50 mb-2">{t('demo.step4.statScore')}</p>
          <p className={`mono text-3xl font-bold ${passed ? 'text-mkt-accent' : 'text-mkt-text'}`}>
            {scorePct}%
          </p>
          <div className="mt-2 h-1 bg-mkt-divider">
            <div className="h-full bg-mkt-accent" style={{ width: `${scorePct}%` }} />
          </div>
          <p className="text-xs text-mkt-text opacity-50 mt-2">
            {passed ? t('demo.step4.passed') : t('demo.step4.failed')}
          </p>
        </div>

        <div className="relative border border-mkt-divider p-5">
          <BlueprintCorners />
          <p className="text-xs text-mkt-text opacity-50 mb-2">{t('demo.step4.statHits')}</p>
          <p className="mono text-3xl font-bold text-mkt-text">
            {hits}/{total}
          </p>
          <p className="text-xs text-mkt-text opacity-50 mt-2">
            {errors} {errors === 1 ? t('demo.step4.statHitsError') : t('demo.step4.statHitsErrors')}
          </p>
        </div>

        <div className="relative border border-mkt-divider p-5">
          <BlueprintCorners />
          <p className="text-xs text-mkt-text opacity-50 mb-2">{t('demo.step4.statCutline')}</p>
          <p className="mono text-3xl font-bold text-mkt-text">{passingNum}%</p>
          <p className="text-xs text-mkt-text opacity-50 mt-2">
            {t('demo.step4.cutlineLabel', { pct: passingNum })}
          </p>
        </div>

        <div className="relative border border-mkt-divider p-5">
          <BlueprintCorners />
          <p className="text-xs text-mkt-text opacity-50 mb-2">{t('demo.step4.statWeak')}</p>
          <p className="mono text-3xl font-bold text-mkt-text">{weakTopics.length}</p>
          <p className="text-xs text-mkt-text opacity-50 mt-2 leading-relaxed truncate">
            {weakTopics
              .slice(0, 2)
              .map((item) => item.topic)
              .join(' · ')}
            {weakTopics.length > 2 ? ` · +${weakTopics.length - 2}` : ''}
          </p>
        </div>
      </div>

      {/* Two-column */}
      <div
        className="max-w-6xl mx-auto px-6"
        style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '24px', alignItems: 'start' }}
      >
        {/* Left: topic table + question review */}
        <div className="space-y-6">
          {/* Topic table */}
          <div className="relative border border-mkt-divider">
            <BlueprintCorners />
            <div className="px-5 py-4 border-b border-mkt-divider flex items-center justify-between">
              <span className="ds-heading text-mkt-text text-lg">{t('demo.step4.topicsHeading')}</span>
              <span className="mono text-xs text-mkt-text opacity-40">{t('demo.step4.topicsSortLabel')}</span>
            </div>
            {topicList.map((item) => {
              const barColor = item.pct >= passingNum ? 'bg-mkt-accent' : 'bg-mkt-accent/30';
              const stateLabel =
                item.pct >= passingNum
                  ? t('demo.step4.topicDomina')
                  : item.pct >= 50
                    ? t('demo.step4.topicInstavel')
                    : t('demo.step4.topicPrioridade');
              const stateColor =
                item.pct >= passingNum
                  ? 'text-mkt-accent'
                  : item.pct >= 50
                    ? 'text-mkt-text opacity-60'
                    : 'text-orange-500';
              return (
                <div
                  key={item.topic}
                  className="px-5 py-3 border-b border-mkt-divider last:border-b-0 flex items-center gap-3"
                >
                  <span className="text-sm text-mkt-text flex-1 min-w-0 truncate">{item.topic}</span>
                  <div className="w-20 h-1.5 bg-mkt-divider flex-shrink-0">
                    <div className={`h-full ${barColor}`} style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="mono text-xs text-mkt-text opacity-60 w-10 text-right flex-shrink-0">
                    {item.correct}/{item.total}
                  </span>
                  <span className={`mono text-xs flex-shrink-0 ${stateColor}`}>{stateLabel}</span>
                </div>
              );
            })}
          </div>

          {/* Question review */}
          <div className="relative border border-mkt-divider">
            <BlueprintCorners />
            <div className="px-5 py-4 border-b border-mkt-divider">
              <span className="ds-heading text-mkt-text text-lg">{t('demo.step4.reviewHeading')}</span>
            </div>

            {reviewQuestions.map((question, i) => {
              const globalIndex = reviewPage * REVIEW_PAGE_SIZE + i;
              const userAnswer = answers[globalIndex];
              const isCorrect = userAnswer === question.correctIndex;

              const badgeStyle: React.CSSProperties = isCorrect
                ? {
                    backgroundColor: 'var(--fb-ok-bg)',
                    borderColor: 'var(--fb-ok-border)',
                    color: 'var(--fb-ok-text)',
                  }
                : {
                    backgroundColor: 'var(--fb-err-bg)',
                    borderColor: 'var(--fb-err-border)',
                    color: 'var(--fb-err-text)',
                  };

              return (
                <div key={globalIndex} className="px-5 py-5 border-b border-mkt-divider last:border-b-0">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="mono text-xs px-2 py-0.5 border" style={badgeStyle}>
                      {isCorrect ? '✓' : '✕'}{' '}
                      {isCorrect ? t('demo.step4.reviewCorrect') : t('demo.step4.reviewWrong')}
                    </span>
                    <span className="mono text-xs text-mkt-text opacity-40">
                      {t('demo.step4.reviewPageLabel', {
                        n: globalIndex + 1,
                        total: questions.length,
                      })}
                    </span>
                    <span className="mono text-xs text-mkt-accent border border-mkt-accent/30 px-2 py-0.5 ml-auto">
                      {question.topic}
                    </span>
                  </div>

                  <p className="text-sm text-mkt-text mb-4">{question.text}</p>

                  <div className="space-y-1.5 mb-4">
                    {question.options.map((option, optIdx) => {
                      const isThisCorrect = optIdx === question.correctIndex;
                      const isUserChoice = optIdx === userAnswer;

                      let optStyle: React.CSSProperties = {};
                      if (isThisCorrect && isUserChoice) {
                        optStyle = {
                          backgroundColor: 'var(--fb-ok-bg)',
                          borderColor: 'var(--fb-ok-border)',
                        };
                      } else if (!isThisCorrect && isUserChoice) {
                        optStyle = {
                          backgroundColor: 'var(--fb-err-bg)',
                          borderColor: 'var(--fb-err-border)',
                        };
                      } else if (isThisCorrect) {
                        optStyle = { backgroundColor: 'var(--color-surface)' };
                      }

                      const dimmed = !isThisCorrect && !isUserChoice;

                      return (
                        <div
                          key={optIdx}
                          className="border border-mkt-divider px-3 py-2.5 text-sm flex items-start gap-3"
                          style={optStyle}
                        >
                          <span className="mono text-xs text-mkt-text opacity-40 flex-shrink-0 mt-0.5">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className={`flex-1 text-mkt-text ${dimmed ? 'opacity-30' : ''}`}>
                            {option}
                          </span>
                          {isThisCorrect && !isUserChoice && (
                            <span className="mono text-xs text-mkt-text opacity-50 flex-shrink-0">
                              {t('demo.step4.reviewCorrectAnswer')}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div
                    className="px-4 py-3 text-sm text-mkt-text border-l-2"
                    style={{
                      borderLeftColor: isCorrect ? 'var(--fb-ok-border)' : 'var(--fb-err-border)',
                      backgroundColor: 'var(--color-surface)',
                    }}
                  >
                    {question.explanation}
                  </div>
                </div>
              );
            })}

            <div className="px-5 py-4 border-t border-mkt-divider flex items-center justify-between">
              <button
                onClick={() => setReviewPage((p) => p - 1)}
                disabled={reviewPage === 0}
                className="mono text-xs text-mkt-text opacity-60 hover:opacity-100 disabled:opacity-20 transition-opacity"
              >
                ← {t('demo.step4.reviewPrevPage')}
              </button>
              <button
                onClick={() => setReviewPage((p) => p + 1)}
                disabled={reviewPage >= totalReviewPages - 1}
                className="mono text-xs text-mkt-text opacity-60 hover:opacity-100 disabled:opacity-20 transition-opacity"
              >
                {t('demo.step4.reviewNextPage')} →
              </button>
            </div>

            <div className="px-5 pb-4">
              <p className="text-xs text-mkt-text opacity-40">{t('demo.step4.reviewNote')}</p>
            </div>
          </div>
        </div>

        {/* Right: CTA + restart */}
        <div className="space-y-4">
          {/* Dark CTA card */}
          <div
            className="relative blueprint"
            style={{
              backgroundColor: 'var(--color-accent-700)',
              borderColor: 'rgba(89,128,166,0.4)',
              color: 'white',
              padding: '24px',
            }}
          >
            <BlueprintCorners />
            <span className="kick" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {t('demo.step4.ctaKick')}
            </span>
            <h3 className="ds-heading text-white text-xl mt-2 leading-tight">
              {t('demo.step4.ctaHeading')}
            </h3>

            <ul className="mt-5 space-y-2">
              {[
                t('demo.step4.ctaBullet1'),
                t('demo.step4.ctaBullet2'),
                t('demo.step4.ctaBullet3'),
                t('demo.step4.ctaBullet4'),
              ].map((bullet) => (
                <li key={bullet} className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {bullet}
                </li>
              ))}
            </ul>

            <a
              href="/register"
              className="block mt-6 w-full text-center border border-white py-3 mono text-xs uppercase tracking-widest font-bold bg-white hover:opacity-90 transition-opacity"
              style={{ color: 'var(--color-accent-700)' }}
            >
              {t('demo.step4.ctaBtn')}
            </a>
            <p className="mono text-xs mt-3 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {t('demo.step4.ctaNote')}
            </p>
          </div>

          {/* Restart card */}
          <div className="relative border border-mkt-divider p-6">
            <BlueprintCorners />
            <h3 className="ds-heading text-mkt-text text-lg">{t('demo.step4.restartHeading')}</h3>
            <p className="text-sm text-mkt-text opacity-60 mt-2">{t('demo.step4.restartBody')}</p>
            <button
              onClick={onRestart}
              className="mt-4 border border-mkt-divider px-4 py-2 mono text-xs text-mkt-text uppercase tracking-widest hover:border-mkt-accent hover:text-mkt-accent transition-colors"
            >
              {t('demo.step4.restartBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamLandingConfig } from '@/shared/types';

import { useExamPractice } from './ExamPracticeContext';
import { heaviestTopicWeight } from './examLandingMetrics';

interface ExamSyllabusSectionProps {
  readonly config: ExamLandingConfig;
}

export function ExamSyllabusSection({ config }: ExamSyllabusSectionProps) {
  const { t } = useTranslation();
  const { selectedTopic, selectTopic } = useExamPractice();
  const heaviest = heaviestTopicWeight(config);

  return (
    <section className="scroll-mt-24 bg-mkt-bg border-t border-mkt-divider py-16" id="edital">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="ds-heading text-mkt-text text-3xl sm:text-4xl">
          {t('landing.syllabus.heading', { name: config.name })}
        </h2>
        <p className="text-mkt-text opacity-70 text-base leading-relaxed max-w-2xl mt-3 text-pretty">
          {t('landing.syllabus.subheading')}
        </p>

        <div className="grid sm:grid-cols-2 gap-px bg-mkt-divider border border-mkt-divider mt-7">
          {config.topics.map((topic) => {
            const isSelected = topic.name === selectedTopic;
            // Only some subjects have an authored sample. Advertising "see an
            // example" on the others would promise a click that shows nothing.
            const hasSample = config.sampleQuestions.some((sample) => sample.topic === topic.name);

            return (
              <button
                key={topic.name}
                type="button"
                aria-pressed={isSelected}
                // flex-col beats the vertical centering a <button> applies to its
                // own content, which would misalign titles across a row once
                // some cells lost their bottom line.
                className={`flex flex-col text-left px-6 py-5 transition-colors ${isSelected ? 'bg-mkt-accent-100' : 'bg-mkt-bg hover:bg-mkt-surface'}`}
                onClick={() => selectTopic(topic.name)}
              >
                <div className="flex items-baseline justify-between gap-3.5">
                  <span className="ds-heading text-mkt-text text-lg">{topic.name}</span>
                  <span className="mono text-[11.5px] text-mkt-accent-700 shrink-0">
                    {t('landing.syllabus.weight', { weight: topic.weight })}
                  </span>
                </div>

                <div className="h-[3px] bg-mkt-divider mt-3">
                  <div
                    className={`h-[3px] ${isSelected ? 'bg-mkt-accent-700' : 'bg-mkt-accent-400'}`}
                    style={{ width: `${Math.round((topic.weight / heaviest) * 100)}%` }}
                  />
                </div>

                {(isSelected || hasSample) && (
                  <p className="mono text-[11px] text-mkt-text opacity-55 mt-2.5">
                    {isSelected ? t('landing.syllabus.selected') : t('landing.syllabus.generate')}
                  </p>
                )}
              </button>
            );
          })}

          {/* Keeps every cell the same width. With an odd topic count the
              divider colour would otherwise show through the last half-row,
              and unequal cells would make the weight bars incomparable. */}
          {config.topics.length % 2 === 1 && <div aria-hidden className="hidden sm:block bg-mkt-bg" />}
        </div>
      </div>
    </section>
  );
}

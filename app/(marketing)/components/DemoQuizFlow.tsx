'use client';

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import NextLink from 'next/link';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import bffApi from '@/lib/bff.api';
import type { DemoQuestion, ExamLandingConfig } from '@/shared/types';
import { DemoQuizQuestion } from './DemoQuizQuestion';
import { DemoQuizResults } from './DemoQuizResults';

interface DemoQuizFlowProps {
  readonly config: ExamLandingConfig;
}

type QuizPhase =
  | { kind: 'idle' }
  | { kind: 'generating' }
  | { kind: 'error'; message: string }
  | { kind: 'active'; questions: readonly DemoQuestion[]; currentIndex: number; answers: readonly (number | null)[] }
  | { kind: 'results'; questions: readonly DemoQuestion[]; answers: readonly number[] };

const STORAGE_KEY = 'dq_count';
const MAX_FREE = 3;
const RESET_MS = 24 * 60 * 60 * 1000;

const primaryCtaClass = 'font-semibold text-sm bg-mkt-accent text-white hover:opacity-90';

function getDemoCount(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return 0;
    const data = JSON.parse(stored) as { count: number; ts: number };
    if (Date.now() - data.ts > RESET_MS) return 0;
    return data.count;
  } catch {
    return 0;
  }
}

function incrementDemoCount(): void {
  try {
    const current = getDemoCount();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: current + 1, ts: Date.now() }));
  } catch {}
}

export function DemoQuizFlow({ config }: DemoQuizFlowProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<QuizPhase>({ kind: 'idle' });
  const [demoCount, setDemoCount] = useState(0);

  useEffect(() => {
    setDemoCount(getDemoCount());
  }, []);

  async function startQuiz() {
    setPhase({ kind: 'generating' });
    try {
      const { data } = await bffApi.post<{ questions: DemoQuestion[] }>('/marketing/demo-quiz', { slug: config.slug });
      incrementDemoCount();
      setDemoCount((prev) => prev + 1);
      setPhase({
        kind: 'active',
        questions: data.questions,
        currentIndex: 0,
        answers: new Array<number | null>(data.questions.length).fill(null) as (number | null)[],
      });
    } catch {
      setPhase({ kind: 'error', message: t('landing.demo.error') });
    }
  }

  function handleSelect(index: number) {
    if (phase.kind !== 'active') return;
    const updated = [...phase.answers];
    updated[phase.currentIndex] = index;
    setPhase({ ...phase, answers: updated });
  }

  function handleNext() {
    if (phase.kind !== 'active') return;
    const isLast = phase.currentIndex === phase.questions.length - 1;
    if (isLast) {
      setPhase({ kind: 'results', questions: phase.questions, answers: phase.answers as number[] });
    } else {
      setPhase({ ...phase, currentIndex: phase.currentIndex + 1 });
    }
  }

  function handleTryAgain() {
    setPhase({ kind: 'idle' });
  }

  const canTryAgain = demoCount < MAX_FREE;

  if (phase.kind === 'idle') {
    if (demoCount >= MAX_FREE) return <DemoGate t={t} />;
    return <DemoIdleScreen onStart={startQuiz} t={t} />;
  }

  if (phase.kind === 'generating') return <DemoGenerating t={t} />;

  if (phase.kind === 'error') {
    return (
      <div className="text-center py-8">
        <p className="text-mkt-text text-sm mb-4">{phase.message}</p>
        <Button className={primaryCtaClass} radius="none" size="md" onPress={() => setPhase({ kind: 'idle' })}>
          {t('landing.demo.retry')}
        </Button>
      </div>
    );
  }

  if (phase.kind === 'active') {
    const currentQuestion = phase.questions[phase.currentIndex];
    const currentAnswer = phase.answers[phase.currentIndex];
    return (
      <DemoQuizQuestion
        question={currentQuestion}
        questionNumber={phase.currentIndex + 1}
        totalQuestions={phase.questions.length}
        selectedIndex={currentAnswer}
        onSelect={handleSelect}
        onNext={handleNext}
        isLast={phase.currentIndex === phase.questions.length - 1}
      />
    );
  }

  return (
    <DemoQuizResults
      questions={phase.questions}
      answers={phase.answers}
      onTryAgain={handleTryAgain}
      canTryAgain={canTryAgain}
    />
  );
}

function DemoIdleScreen({
  onStart,
  t,
}: {
  onStart: () => void;
  t: (key: string, vars?: Record<string, string>) => string;
}) {
  return (
    <div className="text-center py-4">
      <FontAwesomeIcon className="text-mkt-accent text-3xl mb-4" icon={faWandMagicSparkles} />
      <h3 className="ds-heading text-mkt-text text-2xl mb-2">{t('landing.demo.heading')}</h3>
      <p className="text-mkt-text opacity-60 text-sm mb-8">{t('landing.demo.subheading')}</p>
      <Button className={`${primaryCtaClass} px-8`} radius="none" size="lg" onPress={onStart}>
        {t('landing.demo.cta')}
        <FontAwesomeIcon className="ml-2 text-xs" icon={faArrowRight} />
      </Button>
    </div>
  );
}

function DemoGenerating({ t }: { t: (key: string) => string }) {
  return (
    <div className="text-center py-8">
      <div className="inline-flex gap-1 mb-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 bg-mkt-accent animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
      <p className="text-mkt-text text-sm font-medium mb-1">{t('landing.demo.generating')}</p>
      <p className="text-mkt-text opacity-55 text-xs">{t('landing.demo.generatingSubtext')}</p>
    </div>
  );
}

function DemoGate({ t }: { t: (key: string) => string }) {
  return (
    <div className="text-center py-6">
      <p className="ds-heading text-mkt-text text-lg mb-2">{t('landing.demo.gate.heading')}</p>
      <p className="text-mkt-text opacity-60 text-sm mb-6">{t('landing.demo.gate.subtext')}</p>
      <Button as={NextLink} className={primaryCtaClass} href="/register" radius="none" size="lg">
        {t('landing.demo.gate.cta')}
        <FontAwesomeIcon className="ml-2 text-xs" icon={faArrowRight} />
      </Button>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { DemoCatalogExam, DemoQuestion } from '@/shared/types';
import { generateDemoQuiz, getDemoCatalog } from '@/features/connectors';
import { DemoStep1Certs } from './DemoStep1Certs';
import { DemoStep2Alloc } from './DemoStep2Alloc';
import { DemoLoadingState } from './DemoLoadingState';
import { DemoStep3Quiz } from './DemoStep3Quiz';
import { DemoStep4Diagnosis } from './DemoStep4Diagnosis';
import { DemoCatalogFallback } from './DemoCatalogFallback';
import { DemoCatalogSkeleton } from './DemoCatalogSkeleton';
import { selectionLimit, toggleSelection } from './demoScoring';
import { DEMO_EXAM_PARAM, demoExamNameForSlug } from '@/config/demo-links';

type DemoPhase =
  | { kind: 'step1' }
  | { kind: 'step2'; examId: string }
  | { kind: 'loading'; examId: string; alloc: Record<string, number> }
  | {
      kind: 'step3';
      examId: string;
      questions: DemoQuestion[];
      answers: Record<string, number[]>;
      page: number;
    }
  | { kind: 'step4'; examId: string; questions: DemoQuestion[]; answers: Record<string, number[]> };

export function DemoFlowClient() {
  const searchParams = useSearchParams();
  const deepLinkSlug = searchParams.get(DEMO_EXAM_PARAM);

  const [catalog, setCatalog] = useState<DemoCatalogExam[] | null>(null);
  const [catalogFailed, setCatalogFailed] = useState(false);
  const [phase, setPhase] = useState<DemoPhase>({ kind: 'step1' });

  const [quizQuestions, setQuizQuestions] = useState<DemoQuestion[] | null>(null);
  const [quizFailed, setQuizFailed] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const handleAnimationDone = useCallback(() => setAnimationDone(true), []);

  useEffect(() => {
    let cancelled = false;

    getDemoCatalog()
      .then((exams) => {
        if (cancelled) return;
        setCatalog(exams);

        // A landing page can hand us its exam, skipping straight to allocation.
        const deepLinkName = demoExamNameForSlug(deepLinkSlug);
        const target = deepLinkName ? exams.find((exam) => exam.name === deepLinkName) : undefined;

        if (target) setPhase({ kind: 'step2', examId: target.id });
      })
      .catch(() => {
        if (!cancelled) setCatalogFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [deepLinkSlug]);

  // The loading screen is a fixed-length animation; the quiz request runs
  // alongside it. Step 3 waits for whichever finishes last, so a fast response
  // never truncates the animation and a slow one never shows an empty quiz.
  const isLoading = phase.kind === 'loading';
  const loadingExamId = isLoading ? phase.examId : null;
  const loadingAlloc = isLoading ? phase.alloc : null;

  useEffect(() => {
    if (!loadingExamId || !loadingAlloc) return;

    let cancelled = false;

    setQuizQuestions(null);
    setQuizFailed(false);
    setAnimationDone(false);

    generateDemoQuiz(loadingExamId, loadingAlloc)
      .then((questions) => {
        if (!cancelled) setQuizQuestions(questions);
      })
      .catch(() => {
        if (!cancelled) setQuizFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [loadingExamId, loadingAlloc]);

  useEffect(() => {
    if (phase.kind !== 'loading' || !animationDone || !quizQuestions) return;

    setPhase({ kind: 'step3', examId: phase.examId, questions: quizQuestions, answers: {}, page: 0 });
  }, [phase, animationDone, quizQuestions]);

  if (catalogFailed) {
    return <DemoCatalogFallback onRetry={() => window.location.reload()} />;
  }

  if (!catalog) {
    return <DemoCatalogSkeleton />;
  }

  if (catalog.length === 0) {
    return <DemoCatalogFallback isEmpty />;
  }

  const findExam = (examId: string) => catalog.find((exam) => exam.id === examId)!;

  if (phase.kind === 'step1') {
    return <DemoStep1Certs exams={catalog} onSelect={(examId) => setPhase({ kind: 'step2', examId })} />;
  }

  if (phase.kind === 'step2') {
    const { examId } = phase;
    return (
      <DemoStep2Alloc
        exam={findExam(examId)}
        onGenerate={(alloc) => setPhase({ kind: 'loading', examId, alloc })}
        onBack={() => setPhase({ kind: 'step1' })}
      />
    );
  }

  if (phase.kind === 'loading') {
    const { examId } = phase;

    if (quizFailed) {
      return <DemoCatalogFallback onRetry={() => setPhase({ kind: 'step2', examId })} isQuizError />;
    }

    return <DemoLoadingState exam={findExam(examId)} onDone={handleAnimationDone} />;
  }

  if (phase.kind === 'step3') {
    const { examId, questions, answers, page } = phase;
    return (
      <DemoStep3Quiz
        exam={findExam(examId)}
        questions={questions}
        answers={answers}
        page={page}
        onAnswer={(questionIndex, optionIndex) => {
          const selected = toggleSelection(
            answers[questionIndex] ?? [],
            optionIndex,
            selectionLimit(questions[questionIndex])
          );

          setPhase({ ...phase, answers: { ...answers, [questionIndex]: selected } });
        }}
        onPageChange={(newPage) => setPhase({ ...phase, page: newPage })}
        onFinish={() => {
          window.scrollTo(0, 0);
          setPhase({ kind: 'step4', examId, questions, answers });
        }}
        onBack={() => setPhase({ kind: 'step2', examId })}
      />
    );
  }

  const { examId, questions, answers } = phase;
  return (
    <DemoStep4Diagnosis
      exam={findExam(examId)}
      questions={questions}
      answers={answers}
      onRestart={() => setPhase({ kind: 'step1' })}
    />
  );
}

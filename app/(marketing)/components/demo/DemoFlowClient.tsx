'use client';

import { useState } from 'react';
import type { DemoQuestion } from '@/shared/types';
import { DEMO_CATALOG } from './data/demoCatalog';
import { generateDemoQuestions } from './data/demoQuestions';
import { DemoStep1Certs } from './DemoStep1Certs';
import { DemoStep2Alloc } from './DemoStep2Alloc';
import { DemoLoadingState } from './DemoLoadingState';
import { DemoStep3Quiz } from './DemoStep3Quiz';
import { DemoStep4Diagnosis } from './DemoStep4Diagnosis';

type DemoPhase =
  | { kind: 'step1' }
  | { kind: 'step2'; certId: string }
  | { kind: 'loading'; certId: string; alloc: Record<string, number> }
  | {
      kind: 'step3';
      certId: string;
      questions: DemoQuestion[];
      answers: Record<string, number | null>;
      page: number;
    }
  | { kind: 'step4'; certId: string; questions: DemoQuestion[]; answers: Record<string, number> };

export function DemoFlowClient() {
  const [phase, setPhase] = useState<DemoPhase>({ kind: 'step1' });

  if (phase.kind === 'step1') {
    return (
      <DemoStep1Certs
        onSelect={(certId) => setPhase({ kind: 'step2', certId })}
      />
    );
  }

  if (phase.kind === 'step2') {
    const { certId } = phase;
    return (
      <DemoStep2Alloc
        cert={DEMO_CATALOG.find((cert) => cert.id === certId)!}
        onGenerate={(alloc) => setPhase({ kind: 'loading', certId, alloc })}
        onBack={() => setPhase({ kind: 'step1' })}
      />
    );
  }

  if (phase.kind === 'loading') {
    const { certId, alloc } = phase;
    const cert = DEMO_CATALOG.find((c) => c.id === certId)!;
    return (
      <DemoLoadingState
        cert={cert}
        onDone={() => {
          const questions = generateDemoQuestions(cert, alloc);
          setPhase({ kind: 'step3', certId, questions, answers: {}, page: 0 });
        }}
      />
    );
  }

  if (phase.kind === 'step3') {
    const { certId, questions, answers, page } = phase;
    return (
      <DemoStep3Quiz
        cert={DEMO_CATALOG.find((cert) => cert.id === certId)!}
        questions={questions}
        answers={answers}
        page={page}
        onAnswer={(questionIndex, optionIndex) =>
          setPhase({ ...phase, answers: { ...answers, [questionIndex]: optionIndex } })
        }
        onPageChange={(newPage) => setPhase({ ...phase, page: newPage })}
        onFinish={() => {
          window.scrollTo(0, 0);
          setPhase({
            kind: 'step4',
            certId,
            questions,
            answers: answers as Record<string, number>,
          });
        }}
        onBack={() => setPhase({ kind: 'step2', certId })}
      />
    );
  }

  // step4
  const { certId, questions, answers } = phase;
  return (
    <DemoStep4Diagnosis
      cert={DEMO_CATALOG.find((cert) => cert.id === certId)!}
      questions={questions}
      answers={answers}
      onRestart={() => setPhase({ kind: 'step1' })}
    />
  );
}

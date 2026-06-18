'use client';
import type { Key } from '@react-types/shared';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, Tab } from '@heroui/tabs';

import { QuestionGeneratorForm } from './components/QuestionGeneratorForm';
import { GeneratedQuestionsList } from './components/GeneratedQuestionsList';
import { BrowseQuestionsContent } from './components/BrowseQuestionsContent';

import { CertificationsProvider } from '@/features/providers/certifications.provider';
import { QuizProvider } from '@/features/providers/quiz.provider';
import useQuizContext from '@/features/hooks/useQuizContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { AIQuestion } from '@/shared/types';

export default function CertificationsQuestionsPage() {
  return (
    <CertificationsProvider>
      <QuizProvider>
        <Suspense>
          <PageContent />
        </Suspense>
      </QuizProvider>
    </CertificationsProvider>
  );
}

function PageContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab: Key = searchParams.get('tab') === 'browse' ? 'browse' : 'generate';
  const [selectedTab, setSelectedTab] = useState<Key>(initialTab);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the first run so the initial render does not trigger a router.replace
    // which would cause a re-render that steals focus from inputs the user is
    // about to click on (the "double-click to focus" symptom).
    if (isFirstRender.current) {
      isFirstRender.current = false;

      return;
    }
    const params = new URLSearchParams(Array.from(searchParams.entries()));

    params.set('tab', String(selectedTab));
    router.replace(`?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  const { state, replaceQuiz, setAIquestions } = useQuizContext();

  const onQuestionsGenerated = (generatedQuestions: AIQuestion[] | undefined) => {
    if (!generatedQuestions) return;
    replaceQuiz({
      meta: {
        topic: generatedQuestions[0]?.topic ?? '',
        num_questions: generatedQuestions.length,
      },
      questions: [],
      answers: {},
      isFinished: false,
      aiQuestions: generatedQuestions,
      selectedAIQuestions: [],
    });
    setAIquestions(generatedQuestions, null);
  };

  return (
    <PageHeader subtitle={t('certification.questionsPageSubtitle')} title={t('certification.questionsPageTitle')}>
      <Tabs
        aria-label={t('aria.tabOptions')}
        classNames={{
          tabList: 'bg-content1 border border-default-200 rounded-xl gap-1',
          tab: 'rounded-xl text-default-400 data-[selected=true]:text-foreground data-[selected=true]:font-semibold transition-colors duration-200',
          tabContent: 'group-data-[selected=true]:text-foreground',
          cursor: 'bg-primary rounded-xl',
          panel: 'pt-4',
        }}
        selectedKey={selectedTab as string}
        onSelectionChange={setSelectedTab}
      >
        <Tab key="generate" title={t('certification.questionsTabGenerate')}>
          <QuestionGeneratorForm onGenerated={onQuestionsGenerated} />
          {(state?.aiQuestions?.length ?? 0) > 0 && (
            <GeneratedQuestionsList questions={state?.aiQuestions ?? []} onSaved={() => setSelectedTab('browse')} />
          )}
        </Tab>
        <Tab key="browse" title={t('certification.questionsTabLibrary')}>
          <BrowseQuestionsContent embedded />
        </Tab>
      </Tabs>
    </PageHeader>
  );
}

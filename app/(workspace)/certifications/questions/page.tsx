'use client';

import { Key, useState } from 'react';
import { Tab, Tabs } from '@heroui/tabs';

import { BrowseQuestionsContent } from './components/BrowseQuestionsContent';
import { GeneratedQuestionsList } from './components/GeneratedQuestionsList';
import { QuestionGeneratorForm } from './components/QuestionGeneratorForm';

import { CertificationsProvider } from '@/features/providers/certifications.provider';
import { QuizProvider } from '@/features/providers/quiz.provider';
import useQuizContext from '@/features/hooks/useQuizContext.hook';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { AIQuestion } from '@/shared/types';

function CertificationsQuestionsPageContent() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<Key>('browse');
  const { state, replaceQuiz, setAIquestions } = useQuizContext();
  const { certifications, isLoading } = useCertificationsContext();

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
      <div className="flex w-full flex-col">
        <Tabs
          aria-label={t('certification.questionsPageTitle')}
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
          <Tab key="browse" title={t('certification.questionsTabLibrary')}>
            <BrowseQuestionsContent embedded onGenerateClick={() => setSelectedTab('generate')} />
          </Tab>
          <Tab key="generate" title={t('certification.questionsTabGenerate')}>
            {renderGenerateTab()}
          </Tab>
        </Tabs>
      </div>
    </PageHeader>
  );

  function renderGenerateTab() {
    if (isLoading) return <SkeletonListLoader />;

    if (certifications.length === 0) {
      return (
        <EmptyState
          action={{
            href: '/certifications/configure',
            label: t('certification.tabNew'),
          }}
          description={t('certification.noCertificationsDescription')}
          title={t('certification.noCertificationsTitle')}
        />
      );
    }

    return (
      <>
        <QuestionGeneratorForm onGenerated={onQuestionsGenerated} />
        {(state?.aiQuestions?.length ?? 0) > 0 && (
          <GeneratedQuestionsList questions={state?.aiQuestions ?? []} onSaved={() => setSelectedTab('browse')} />
        )}
      </>
    );
  }
}

export default function CertificationsQuestionsPage() {
  return (
    <CertificationsProvider>
      <QuizProvider>
        <CertificationsQuestionsPageContent />
      </QuizProvider>
    </CertificationsProvider>
  );
}

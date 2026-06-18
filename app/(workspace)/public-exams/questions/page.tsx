'use client';
import type { Key } from '@react-types/shared';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, Tab } from '@heroui/tabs';

import { PublicExamQuestionGeneratorForm } from './components/PublicExamQuestionGeneratorForm';
import { GeneratedPublicExamQuestionsList } from './components/GeneratedPublicExamQuestionsList';
import { BrowsePublicExamQuestionsContent } from './components/BrowsePublicExamQuestionsContent';

import { PublicExamsProvider } from '@/features/providers/publicExams.provider';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { AIPublicExamQuestion } from '@/shared/types';

export default function PublicExamsQuestionsPage() {
  return (
    <PublicExamsProvider>
      <Suspense>
        <PageContent />
      </Suspense>
    </PublicExamsProvider>
  );
}

function PageContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab: Key = searchParams.get('tab') === 'browse' ? 'browse' : 'generate';
  const [selectedTab, setSelectedTab] = useState<Key>(initialTab);
  const [questions, setQuestions] = useState<AIPublicExamQuestion[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));

    params.set('tab', String(selectedTab));
    router.replace(`?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  const onQuestionsGenerated = (generated: AIPublicExamQuestion[] | undefined) => {
    if (!generated) return;
    setQuestions(generated);
  };

  return (
    <PageHeader subtitle={t('concurso.questionsPageSubtitle')} title={t('concurso.questionsPageTitle')}>
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
        <Tab key="generate" title={t('concurso.questionsTabGenerate')}>
          <PublicExamQuestionGeneratorForm onGenerated={onQuestionsGenerated} />
          {questions.length > 0 && (
            <GeneratedPublicExamQuestionsList
              questions={questions}
              setQuestions={setQuestions}
              onSaved={() => setSelectedTab('browse')}
            />
          )}
        </Tab>
        <Tab key="browse" title={t('concurso.questionsTabLibrary')}>
          <BrowsePublicExamQuestionsContent embedded />
        </Tab>
      </Tabs>
    </PageHeader>
  );
}

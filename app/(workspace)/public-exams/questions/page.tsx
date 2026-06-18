'use client';

import { Key, useState } from 'react';
import { Tab, Tabs } from '@heroui/tabs';

import { BrowsePublicExamQuestionsContent } from './components/BrowsePublicExamQuestionsContent';
import { GeneratedPublicExamQuestionsList } from './components/GeneratedPublicExamQuestionsList';
import { PublicExamQuestionGeneratorForm } from './components/PublicExamQuestionGeneratorForm';

import { PublicExamsProvider } from '@/features/providers/publicExams.provider';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { AIPublicExamQuestion } from '@/shared/types';

function PublicExamsQuestionsPageContent() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<Key>('browse');
  const [questions, setQuestions] = useState<AIPublicExamQuestion[]>([]);

  const onQuestionsGenerated = (generated: AIPublicExamQuestion[] | undefined) => {
    if (!generated) return;
    setQuestions(generated);
  };

  return (
    <PageHeader subtitle={t('concurso.questionsPageSubtitle')} title={t('concurso.questionsPageTitle')}>
      <div className="flex w-full flex-col">
        <Tabs
          aria-label={t('concurso.questionsPageTitle')}
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
          <Tab key="browse" title={t('concurso.questionsTabLibrary')}>
            <BrowsePublicExamQuestionsContent embedded />
          </Tab>
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
        </Tabs>
      </div>
    </PageHeader>
  );
}

export default function PublicExamsQuestionsPage() {
  return (
    <PublicExamsProvider>
      <PublicExamsQuestionsPageContent />
    </PublicExamsProvider>
  );
}

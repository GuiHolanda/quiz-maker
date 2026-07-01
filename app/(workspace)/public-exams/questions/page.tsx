'use client';

import { Key, useEffect, useState } from 'react';
import { Tab, Tabs } from '@heroui/tabs';
import { Progress } from '@heroui/progress';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleInfo, faXmark } from '@fortawesome/free-solid-svg-icons';

import { BrowsePublicExamQuestionsContent } from './components/BrowsePublicExamQuestionsContent';
import { GeneratedPublicExamQuestionsList } from './components/GeneratedPublicExamQuestionsList';
import { PublicExamQuestionGeneratorForm } from './components/PublicExamQuestionGeneratorForm';

import { PublicExamsProvider } from '@/features/providers/publicExams.provider';
import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { AIPublicExamQuestion } from '@/shared/types';

function PublicExamsQuestionsPageContent() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<Key>('browse');
  const [questions, setQuestions] = useState<AIPublicExamQuestion[]>([]);
  const { publicExams, isLoading } = usePublicExamsContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingCount, setGeneratingCount] = useState(5);
  const [progress, setProgress] = useState(0);
  const [showSimuladosBanner, setShowSimuladosBanner] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!isGenerating) return;
    setProgress(0);
    const id = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) return 88;
        return prev + Math.max(0.4, (88 - prev) * 0.06);
      });
    }, 250);
    return () => clearInterval(id);
  }, [isGenerating]);

  const onGenerationStart = (numQuestions: number) => {
    setGeneratingCount(numQuestions);
    setIsGenerating(true);
    setShowHint(true);
  };

  const onQuestionsGenerated = (generated: AIPublicExamQuestion[] | undefined) => {
    if (!generated) {
      setIsGenerating(false);
      return;
    }
    setProgress(100);
    setTimeout(() => {
      setQuestions(generated);
      setIsGenerating(false);
    }, 350);
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
            {renderBrowseTab()}
          </Tab>
          <Tab key="generate" title={t('concurso.questionsTabGenerate')}>
            {renderGenerateTab()}
          </Tab>
        </Tabs>
      </div>
    </PageHeader>
  );

  function renderBrowseTab() {
    return (
      <>
        {renderSimuladosBanner()}
        <BrowsePublicExamQuestionsContent embedded onGenerateClick={() => setSelectedTab('generate')} />
      </>
    );
  }

  function renderSimuladosBanner() {
    if (!showSimuladosBanner) return null;
    return (
      <Card className="border border-success-200 bg-success-50 dark:bg-success-900/20 shadow-none mb-4">
        <CardBody className="flex flex-row items-center justify-between gap-3 py-3 px-4">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon className="text-success shrink-0" icon={faCircleCheck} />
            <p className="text-sm text-default-700">{t('generate.questionsReadyHint')}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button as={Link} color="success" href="/certifications/simulados" size="sm" variant="flat">
              {t('generate.goToSimulados')}
            </Button>
            <button
              aria-label={t('common.dismiss')}
              className="text-default-400 hover:text-default-600"
              onClick={() => setShowSimuladosBanner(false)}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </CardBody>
      </Card>
    );
  }

  function renderGenerateTab() {
    if (isLoading) return <SkeletonListLoader />;

    if (publicExams.length === 0) {
      return (
        <EmptyState
          action={{
            href: '/public-exams/configure',
            label: t('concurso.tabNew'),
          }}
          description={t('concurso.noExamsDescription')}
          title={t('concurso.noExamsTitle')}
        />
      );
    }

    return (
      <>
        <PublicExamQuestionGeneratorForm onGenerated={onQuestionsGenerated} onGenerationStart={onGenerationStart} />
        {(isGenerating || questions.length > 0) && renderSelectionHint()}
        {isGenerating && renderGenerationProgress()}
        {!isGenerating && questions.length > 0 && (
          <GeneratedPublicExamQuestionsList
            questions={questions}
            setQuestions={setQuestions}
            onSaved={() => {
              setShowSimuladosBanner(true);
              setSelectedTab('browse');
            }}
          />
        )}
      </>
    );
  }

  function renderGenerationProgress() {
    return (
      <div className="flex flex-col gap-4 mt-4">
        <Progress
          aria-label={t('busy.generating')}
          classNames={{ label: 'text-xs', value: 'text-xs' }}
          color="primary"
          label={progress < 75 ? t('busy.generating') : t('busy.almostDone')}
          showValueLabel
          value={progress}
        />
        {progress >= 75 && <SkeletonListLoader count={generatingCount} height="h-24" />}
      </div>
    );
  }

  function renderSelectionHint() {
    if (!showHint) return null;

    return (
      <Card className="border border-primary-100 bg-primary-50/60 dark:bg-primary-900/20 shadow-none mt-4">
        <CardBody className="flex flex-row items-start gap-3 py-3 px-4">
          <FontAwesomeIcon className="text-primary mt-0.5 shrink-0" icon={faCircleInfo} />
          <p className="text-sm text-default-700 flex-1">{t('generate.selectionHint')}</p>
          <button
            aria-label={t('common.dismiss')}
            className="text-default-400 hover:text-default-600 shrink-0"
            onClick={() => setShowHint(false)}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </CardBody>
      </Card>
    );
  }
}

export default function PublicExamsQuestionsPage() {
  return (
    <PublicExamsProvider>
      <PublicExamsQuestionsPageContent />
    </PublicExamsProvider>
  );
}

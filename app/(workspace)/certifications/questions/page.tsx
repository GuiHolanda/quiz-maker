'use client';

import { Key, useEffect, useState } from 'react';
import { Tab, Tabs } from '@heroui/tabs';
import { Progress } from '@heroui/progress';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleInfo, faXmark } from '@fortawesome/free-solid-svg-icons';

import { QuestionsBrowseView } from '@/shared/components/browse/QuestionsBrowseView';
import { certificationBrowseConfig } from '@/shared/browse-configs/certificationBrowseConfig';
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
import { buttonStyles } from '@/config/constants/buttonStyles';

function CertificationsQuestionsPageContent() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<Key>('browse');
  const { state, replaceQuiz, setAIquestions } = useQuizContext();
  const { certifications, isLoading } = useCertificationsContext();
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

  const onQuestionsGenerated = (generatedQuestions: AIQuestion[] | undefined) => {
    if (!generatedQuestions) {
      setIsGenerating(false);
      return;
    }
    setProgress(100);
    setTimeout(() => {
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
      setIsGenerating(false);
    }, 350);
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
            {renderBrowseTab()}
          </Tab>
          <Tab key="generate" title={t('certification.questionsTabGenerate')}>
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
        <QuestionsBrowseView
          config={certificationBrowseConfig}
          embedded
          onGenerateClick={() => setSelectedTab('generate')}
        />
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
            <Button as={Link} href="/certifications/simulados" size="sm" variant="bordered" className={buttonStyles.secondary}>
              {t('generate.goToSimulados')}
            </Button>
            <Button
              isIconOnly
              aria-label={t('common.dismiss')}
              className={buttonStyles.iconOnly.neutral}
              size="sm"
              variant="light"
              onPress={() => setShowSimuladosBanner(false)}
            >
              <FontAwesomeIcon icon={faXmark} />
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

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
        <QuestionGeneratorForm onGenerated={onQuestionsGenerated} onGenerationStart={onGenerationStart} />
        {(isGenerating || (state?.aiQuestions?.length ?? 0) > 0) && renderSelectionHint()}
        {isGenerating && renderGenerationProgress()}
        {!isGenerating && (state?.aiQuestions?.length ?? 0) > 0 && (
          <GeneratedQuestionsList
            questions={state?.aiQuestions ?? []}
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
      <div className="flex flex-col gap-4 mt-8">
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
      <Card className="bg-primary-50/60 dark:bg-primary-900/20 shadow-none mt-4">
        <CardBody className="flex flex-row items-center gap-3 py-3 px-4">
          <FontAwesomeIcon className="text-primary mt-0.5 shrink-0" icon={faCircleInfo} />
          <p className="text-xs text-default-700 flex-1">{t('generate.selectionHint')}</p>
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

export default function CertificationsQuestionsPage() {
  return (
    <CertificationsProvider>
      <QuizProvider>
        <CertificationsQuestionsPageContent />
      </QuizProvider>
    </CertificationsProvider>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Chip } from '@heroui/chip';
import { Button } from '@heroui/button';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faClipboardList, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { QuestionsContent } from './QuestionsContent';
import { GenerationHistory } from './GenerationHistory';
import { ActiveJobStatus } from './ActiveJobStatus';
import { GeneratedQuestionsList } from './GeneratedQuestionsList';

import useQuizContext from '@/features/hooks/useQuizContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useGenerationJobsContext } from '@/features/hooks/useGenerationJobsContext.hook';
import type { TrackedJob } from '@/features/providers/generationJobs.provider';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { notify } from '@/shared/lib/notify';
import { SectionHeader } from '@/shared/components/ui/SectionHeader';
import type { AIQuestion } from '@/shared/types';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';

type QuestionsType = 'certification' | 'public_exam';

export function QuestionsPageContent() {
  const { t } = useTranslation();
  const { state, setAIquestions, setSelectedAIquestions } = useQuizContext();
  const { jobs, cancelJob, saveAllJob, getJobPendingQuestions } = useGenerationJobsContext();
  const searchParams = useSearchParams();

  const initialType = (searchParams.get('type') as QuestionsType) ?? 'certification';
  const [selectedType, setSelectedType] = useState<QuestionsType>(initialType);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [showSimuladosBanner, setShowSimuladosBanner] = useState(false);
  const [reviewJob, setReviewJob] = useState<TrackedJob | null>(null);
  // As seções de jobs ativos e de revisão dependem de estado client-only (jobs buscados
  // via useEffect, quiz state do localStorage). Só renderizamos após montar para evitar
  // mismatch de hidratação com o SSR (onde esse estado ainda não existe).
  const [mounted, setMounted] = useState(false);
  const prevActiveCount = useRef(jobs.length);
  const reviewSectionRef = useRef<HTMLElement>(null);
  const statusSectionRef = useRef<HTMLDivElement>(null);

  function scrollToRef(ref: React.RefObject<HTMLElement | null>) {
    // Aguarda a seção renderizar antes de rolar até ela.
    requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reage à mudança na lista de jobs: se cresceu, um job iniciou → rola até o status + atualiza histórico.
  // Se diminuiu, um job saiu (salvo/concluído) → atualiza histórico + banner.
  useEffect(() => {
    if (jobs.length > prevActiveCount.current) {
      scrollToRef(statusSectionRef);
      setHistoryRefreshKey((k) => k + 1);
    } else if (jobs.length < prevActiveCount.current) {
      setHistoryRefreshKey((k) => k + 1);
      setShowSimuladosBanner(true);
    }
    prevActiveCount.current = jobs.length;
  }, [jobs.length]);

  const aiQuestions = state?.aiQuestions ?? [];
  const selectedIds = state?.selectedAIQuestions ?? [];

  // Carrega as questões pendentes na lista de revisão, sem salvar ainda.
  async function handleReviewAndSelect(jobId: string) {
    const job = jobs.find((j) => j.jobId === jobId) ?? null;
    try {
      const pending = await getJobPendingQuestions(jobId);
      setAIquestions(pending as unknown as AIQuestion[], null);
      setReviewJob(job);
      scrollToRef(reviewSectionRef);
    } catch {
      notify.error(t('toast.error'), t('toast.somethingWrong'));
    }
  }

  // Salvar a partir da revisão persiste o job inteiro (o backend salva todos os tópicos prontos).
  async function handleReviewSave() {
    if (reviewJob) await saveAllJob(reviewJob.jobId);
    setReviewJob(null);
    setAIquestions([], null);
    setSelectedAIquestions([]);
  }

  // Descartar cancela o job em revisão (e seus tópicos aguardando revisão) e limpa a lista.
  const handleReviewDiscard = async () => {
    if (reviewJob) await cancelJob(reviewJob.jobId);
    setReviewJob(null);
    setSelectedAIquestions([]);
    setAIquestions([], null);
  };

  return (
    <PageHeader
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem href="/">{t('nav.dashboard')}</BreadcrumbItem>
          <BreadcrumbItem>{t('nav.generateQuestions')}</BreadcrumbItem>
        </Breadcrumbs>
      }
      subtitle={t('generate.pageSubtitle')}
      title={t('generate.pageTitle')}
    >
      <div className="flex flex-col gap-6">
        {renderSimuladosBanner()}
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">{t('generate.chooseType')}</p>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:w-3/4"
            role="group"
            aria-label={t('generate.chooseType')}
          >
            {renderTypeOption(
              'certification',
              t('generate.typeCertification'),
              t('generate.chooseTypeCertification'),
              faGraduationCap
            )}
            {renderTypeOption(
              'public_exam',
              t('generate.typePublicExam'),
              t('generate.chooseTypePublicExam'),
              faClipboardList
            )}
          </div>
        </div>

        <div className={selectedType === 'certification' ? '' : 'hidden'}>
          <QuestionsContent type="certification" />
        </div>
        <div className={selectedType === 'public_exam' ? '' : 'hidden'}>
          <QuestionsContent type="public_exam" />
        </div>

        {renderReviewList()}
        <div ref={statusSectionRef}>{renderActiveJobs()}</div>
        <GenerationHistory refreshKey={historyRefreshKey} />
      </div>
    </PageHeader>
  );

  function renderSimuladosBanner() {
    if (!showSimuladosBanner) return null;
    return (
      <InlineAlert
        color="success"
        icon={faCircleCheck}
        title={t('generate.questionsReadyHint')}
        endContent={
          <Button as={Link} className={buttonStyles.secondary} href="/simulados" size="sm" variant="bordered">
            {t('generate.goToSimulados')}
          </Button>
        }
        onDismiss={() => setShowSimuladosBanner(false)}
      />
    );
  }

  function renderActiveJobs() {
    if (!mounted) return null;
    // Oculta o painel do job em revisão — a lista de revisão o substitui.
    const visibleJobs = jobs.filter((job) => job.jobId !== reviewJob?.jobId);
    if (visibleJobs.length === 0) return null;
    return (
      <>
        {visibleJobs.map((job, index) => (
          <ActiveJobStatus
            key={job.jobId}
            doneTopics={job.doneTopics}
            isSaving={job.isSaving}
            queuedTopics={job.queuedTopics}
            refName={job.refName}
            showSectionHeader={index === 0}
            status={job.status}
            topics={job.topics}
            totalTopics={job.totalTopics}
            type={job.type}
            onCancel={() => cancelJob(job.jobId)}
            onReviewAndSelect={() => handleReviewAndSelect(job.jobId)}
            onSaveAll={() => saveAllJob(job.jobId)}
          />
        ))}
      </>
    );
  }

  function renderReviewList() {
    if (!mounted || aiQuestions.length === 0) return null;
    return (
      <section ref={reviewSectionRef} className="flex flex-col gap-4 mt-8 pt-8 border-t border-default-200">
        {renderReviewHeader()}
        <GeneratedQuestionsList
          isLoadingMore={false}
          isSaving={false}
          questions={aiQuestions}
          remainingCount={0}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedAIquestions}
          onDiscard={handleReviewDiscard}
          onSave={handleReviewSave}
        />
      </section>
    );
  }

  function renderReviewHeader() {
    // O reviewJob (snapshot em memória) pode se perder num reload, mas as questões persistem
    // no localStorage com o nome embutido — então derivamos dele como fallback confiável.
    const first = aiQuestions[0];
    const isPublicExam = reviewJob?.type === 'public_exam';
    const refName = reviewJob?.refName ?? first?.certificationTitle ?? '';
    const icon = isPublicExam ? faClipboardList : faGraduationCap;

    return (
      <SectionHeader
        action={
          <Chip color="primary" size="sm" variant="flat">
            {t('generate.reviewCount', { count: aiQuestions.length })}
          </Chip>
        }
        icon={icon}
        label={refName || undefined}
        subtitle={t('generate.reviewSectionSubtitle')}
        title={t('generate.reviewSectionTitle')}
      />
    );
  }

  function renderTypeOption(value: QuestionsType, title: string, description: string, icon: IconDefinition) {
    const isSelected = selectedType === value;

    return (
      <button
        aria-pressed={isSelected}
        data-testid={`type-option-${value}`}
        className={`text-left rounded-xl border p-4 transition-colors duration-200 flex items-start gap-3 ${
          isSelected
            ? 'border-primary bg-primary/10'
            : 'border-default-200 bg-content1 hover:bg-content2 hover:border-default-300'
        }`}
        type="button"
        onClick={() => setSelectedType(value)}
      >
        <span className={`mt-0.5 shrink-0 ${isSelected ? 'text-primary' : 'text-default-400'}`}>
          <FontAwesomeIcon className="w-4 h-4" icon={icon} />
        </span>
        <span className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span
            className={`text-sm font-semibold leading-snug flex items-center gap-2 ${isSelected ? 'text-primary' : 'text-foreground'}`}
          >
            {title}
          </span>
          <span className="text-xs text-default-500 leading-snug">{description}</span>
        </span>
      </button>
    );
  }
}

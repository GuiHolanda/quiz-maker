'use client';

import type { Exam, ExamType } from '@/shared/types';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';

import { ExamsProvider } from '@/features/providers/exams.provider';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { IllustratedEmptyState } from '@/shared/components/ui/IllustratedEmptyState';
import { UpgradeModal } from '@/shared/components/ui/UpgradeModal';
import { canEditExams } from '@/config/constants';
import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';
import { useExamSeed, emptyExamDraft } from './useExamSeed.hook';
import { ExamSeedPicker } from './components/ExamSeedPicker';
import { ExamEditorSkeleton } from './components/ExamEditorSkeleton';
import { ExamEditorPage } from './components/ExamEditorPage';

function readStoredDraft(storageKey: string): Exam | null {
  try {
    const raw = localStorage.getItem(storageKey);

    if (!raw) return null;
    const parsed = JSON.parse(raw) as Exam;

    // A draft with no name and no sections isn't worth resuming — treat it as absent so
    // the seed picker shows instead of an editor with nothing distinguishing it from blank.
    if (!parsed.name?.trim() && (!parsed.sections || parsed.sections.length === 0)) return null;

    return parsed;
  } catch {
    return null;
  }
}

export default function NewExamPage() {
  return (
    <ExamsProvider>
      <Suspense>
        <NewExamContent />
      </Suspense>
    </ExamsProvider>
  );
}

function NewExamContent() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const { addExam } = useExamsContext();
  const { data: session } = useSession();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const rawType = searchParams.get('type');
  const type: ExamType = rawType === 'public_exam' ? 'public_exam' : 'certification';
  const config = EXAM_CONFIG[type];
  const listHref = `/exams?type=${type}`;
  const listLabel = type === 'certification' ? t('nav.certifications') : t('nav.publicExams');
  const pageTitle = type === 'certification' ? t('exam.newCertificationTitle') : t('exam.newConcursoTitle');

  const seed = useExamSeed(language);
  const canEdit = !session?.user?.plan || canEditExams(session.user.plan);
  const [hydrated, setHydrated] = useState(false);
  const [resumedDraft, setResumedDraft] = useState<Exam | null>(null);

  useEffect(() => {
    setResumedDraft(readStoredDraft(config.draftStorageKey));
    setHydrated(true);
    // Empty deps is intentional: only ever runs once per exam type — switching type
    // mid-flow isn't a supported transition (the page fully remounts via the URL param).
  }, []);

  const persistDraft = (draft: Exam) => {
    try {
      localStorage.setItem(config.draftStorageKey, JSON.stringify(draft));
    } catch {
      /* storage full or unavailable */
    }
  };

  const clearStoredDraft = () => {
    try {
      localStorage.removeItem(config.draftStorageKey);
    } catch {
      /* ignore */
    }
  };

  const handleSaved = (saved: Exam) => {
    addExam(saved);
    clearStoredDraft();
    router.push(listHref);
  };

  const handleDiscard = () => {
    clearStoredDraft();
    setResumedDraft(null);
    seed.reset();
  };

  const breadcrumbs = (
    <Breadcrumbs>
      <BreadcrumbItem href="/">{t('nav.dashboard')}</BreadcrumbItem>
      <BreadcrumbItem href={listHref}>{listLabel}</BreadcrumbItem>
      <BreadcrumbItem>{pageTitle}</BreadcrumbItem>
    </Breadcrumbs>
  );

  // Tela 2 (editor / skeleton) carries its own name-based heading — showing PageHeader's
  // static title above it would double up. Only Tela 1 (the seed picker) needs it.
  const isEditorMode =
    hydrated && (resumedDraft !== null || ['ready', 'error', 'loading-blueprint'].includes(seed.state.kind));

  if (!canEdit) {
    return (
      <PageHeader title={pageTitle}>
        <IllustratedEmptyState
          action={{ label: t('billing.upgradeModal.cta'), onPress: () => setIsUpgradeOpen(true) }}
          description={t('exam.createUpgradeWallDescription')}
          icon={config.icon}
          secondaryAction={{ label: t('catalog.browseAction'), href: `/exams/catalog?type=${type}` }}
          title={t('exam.createUpgradeWallTitle')}
        />
        <UpgradeModal isOpen={isUpgradeOpen} product="pro" onClose={() => setIsUpgradeOpen(false)} />
      </PageHeader>
    );
  }

  return (
    <PageHeader breadcrumbs={breadcrumbs} title={isEditorMode ? undefined : pageTitle}>
      {!hydrated ? null : resumedDraft ? (
        <ExamEditorPage
          type={type}
          initialDraft={resumedDraft}
          onDiscard={handleDiscard}
          onDraftChange={persistDraft}
          onSaved={handleSaved}
        />
      ) : (
        renderSeedContent()
      )}
    </PageHeader>
  );

  function renderSeedContent() {
    switch (seed.state.kind) {
      case 'loading-blueprint':
        return (
          <ExamEditorSkeleton examName={seed.state.examName} provider={seed.state.provider} onCancel={seed.reset} />
        );
      case 'ready':
        return (
          <ExamEditorPage
            type={type}
            initialDraft={seed.state.draft}
            context={seed.state.context}
            sources={seed.state.sources}
            onDiscard={handleDiscard}
            onDraftChange={persistDraft}
            onSaved={handleSaved}
          />
        );
      case 'error':
        return (
          <ExamEditorPage
            type={type}
            initialDraft={{ ...emptyExamDraft(type), name: seed.state.seedName }}
            warningKey={seed.state.messageKey}
            onDiscard={handleDiscard}
            onDraftChange={persistDraft}
            onSaved={handleSaved}
          />
        );
      default:
        return (
          <ExamSeedPicker
            state={seed.state}
            type={type}
            onIdentify={seed.identifyByName}
            onSelectMatch={(match) => {
              if (seed.state.kind === 'disambiguating') void seed.confirmMatch(seed.state.examName, match);
            }}
            onStartBlank={() => seed.startBlank(type)}
            onUploadEdital={seed.uploadEdital}
          />
        );
    }
  }
}

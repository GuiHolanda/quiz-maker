'use client';

import type { BlueprintConfidence, Exam, ExamType } from '@/shared/types';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';

import { ExamsProvider } from '@/features/providers/exams.provider';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { useLimitModal } from '@/features/hooks/useLimitModal.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { IllustratedEmptyState } from '@/shared/components/ui/IllustratedEmptyState';
import { UpgradeModal } from '@/shared/components/ui/UpgradeModal';
import { canEditExams } from '@/config/constants';
import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';
import { useExamSeed, emptyExamDraft } from './useExamSeed.hook';
import type { ExamSeedState } from './useExamSeed.hook';
import type { IdentifyPhase } from './components/seed/SeedIdentifyCard';
import { ExamSeedPicker } from './components/seed/ExamSeedPicker';
import { NewExamHeader } from './components/seed/NewExamHeader';
import { SeedLoadingScreen, type SeedLoadingVariant } from './components/seed/SeedLoadingScreen';
import { ExamEditorPage } from './components/ExamEditorPage';

const DEBUG_MATCHES = [
  {
    label: 'AWS Certified Solutions Architect',
    key: 'SAA-C03',
    provider: 'Amazon Web Services',
    examBoard: null,
    role: null,
    roles: [],
    year: null,
  },
  {
    label: 'AWS Certified Developer',
    key: 'DVA-C02',
    provider: 'Amazon Web Services',
    examBoard: null,
    role: null,
    roles: [],
    year: null,
  },
];
const DEBUG_SEED = DEBUG_MATCHES[0];
const DEBUG_PUBLIC_MATCH = {
  label: 'Concurso TRF 1ª Região 2025',
  key: 'PGJ-001/2025',
  provider: null,
  examBoard: 'CEBRASPE',
  role: null,
  roles: ['Analista Judiciário – Área Judiciária', 'Técnico Judiciário – Área Administrativa', 'Oficial de Justiça'],
  year: 2025,
};
const DEBUG_PRIOR_EDITAIS = [
  {
    url: 'https://www.trf1.jus.br/editais/edital-002-2021.pdf',
    editalNumber: 'PGJ-002/2021',
    year: 2021,
    orgao: 'TRF 1ª Região',
    isOfficialDomain: true,
    coversRole: true,
    documentKind: 'main' as const,
    domainClass: 'official-org' as const,
    verification: 'confirmed' as const,
  },
  {
    url: 'https://www.trf1.jus.br/editais/edital-014-2018.pdf',
    editalNumber: 'PGJ-014/2018',
    year: 2018,
    orgao: 'TRF 1ª Região',
    isOfficialDomain: true,
    coversRole: false,
    documentKind: 'main' as const,
    domainClass: 'official-org' as const,
    verification: 'confirmed' as const,
  },
];

// Dev-only escape hatch to preview SeedLoadingScreen frozen at any stage — this state
// resolves in seconds/minutes normally, too fast to iterate on its styling live.
// ?debugLoading=identify&phase=searching|disambiguating|clarifying|failed|locating|approving-edital|selecting-role
// ?debugLoading=auto-config&stage=research|review|format|extract (omit stage for the initial state)
// ?debugLoading=edital
function buildDebugVariant(searchParams: URLSearchParams): SeedLoadingVariant | null {
  const kind = searchParams.get('debugLoading');

  if (kind === 'identify') {
    const phase = searchParams.get('phase');

    if (phase === 'disambiguating') {
      return { kind: 'identify', query: 'AWS Certified', phase: { kind: 'disambiguating', matches: DEBUG_MATCHES } };
    }
    if (phase === 'clarifying') {
      return {
        kind: 'identify',
        query: 'AWS Certified',
        phase: { kind: 'clarifying', message: 'Você quer dizer AWS Solutions Architect ou AWS Developer?' },
      };
    }
    if (phase === 'failed') return { kind: 'identify', query: 'AWS Certified', phase: { kind: 'failed' } };

    if (phase === 'selecting-role') {
      return {
        kind: 'identify',
        query: 'TRF 1ª Região',
        phase: { kind: 'selecting-role', match: DEBUG_PUBLIC_MATCH },
      };
    }

    if (phase === 'locating') {
      return { kind: 'identify', query: 'TRF 1ª Região', phase: { kind: 'locating' } };
    }

    if (phase === 'approving-edital') {
      return {
        kind: 'identify',
        query: 'TRF 1ª Região',
        phase: {
          kind: 'approving-edital',
          match: DEBUG_PUBLIC_MATCH,
          editais: DEBUG_PRIOR_EDITAIS,
          targetYearFound: false,
          confirmedFound: true,
        },
      };
    }

    return { kind: 'identify', query: 'AWS Certified', phase: { kind: 'searching' } };
  }

  if (kind === 'auto-config') {
    const stageParam = searchParams.get('stage');
    const stage =
      stageParam === 'research' || stageParam === 'review' || stageParam === 'format' || stageParam === 'extract'
        ? stageParam
        : null;

    return { kind: 'auto-config', seed: DEBUG_SEED, stage };
  }

  if (kind === 'edital') return { kind: 'edital', fileName: searchParams.get('file') ?? 'edital-2026.pdf' };

  return null;
}

function identifyQuery(state: ExamSeedState): string {
  if (state.kind === 'identifying' || state.kind === 'identify-failed') return state.query;
  if (
    state.kind === 'disambiguating' ||
    state.kind === 'clarifying' ||
    state.kind === 'selecting-role' ||
    state.kind === 'locating-edital' ||
    state.kind === 'approving-edital'
  )
    return state.examName;

  return '';
}

function identifyPhase(state: ExamSeedState): Exclude<IdentifyPhase, { kind: 'confirmed' }> {
  switch (state.kind) {
    case 'disambiguating':
      return { kind: 'disambiguating', matches: state.matches };
    case 'clarifying':
      return { kind: 'clarifying', message: state.message };
    case 'identify-failed':
      return { kind: 'failed' };
    case 'selecting-role':
      return { kind: 'selecting-role', match: state.match };
    case 'locating-edital':
      return { kind: 'locating' };
    case 'approving-edital':
      return {
        kind: 'approving-edital',
        match: state.match,
        editais: state.editais,
        targetYearFound: state.targetYearFound,
        confirmedFound: state.confirmedFound,
      };
    default:
      return { kind: 'searching' };
  }
}

interface StoredDraft {
  readonly draft: Exam;
  readonly context?: string;
  readonly sources?: string[];
  readonly confidence?: BlueprintConfidence;
}

function readStoredDraft(storageKey: string): StoredDraft | null {
  try {
    const raw = localStorage.getItem(storageKey);

    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft | Exam;
    // Older persisted entries are a bare Exam, from before context/sources were added.
    const draft = 'draft' in parsed ? parsed.draft : parsed;
    const context = 'draft' in parsed ? parsed.context : undefined;
    const sources = 'draft' in parsed ? parsed.sources : undefined;
    const confidence = 'draft' in parsed ? parsed.confidence : undefined;

    // A draft with no name and no sections isn't worth resuming — treat it as absent so
    // the seed picker shows instead of an editor with nothing distinguishing it from blank.
    if (!draft.name?.trim() && (!draft.sections || draft.sections.length === 0)) return null;

    return { draft, context, sources, confidence };
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
  const { usage } = useUsageContext();
  const { showLimit } = useLimitModal();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const rawType = searchParams.get('type');
  const type: ExamType = rawType === 'public_exam' ? 'public_exam' : 'certification';
  const config = EXAM_CONFIG[type];
  const listHref = `/exams?type=${type}`;
  const listLabel = type === 'certification' ? t('nav.certifications') : t('nav.publicExams');
  const pageTitle = type === 'certification' ? t('exam.newCertificationTitle') : t('exam.newConcursoTitle');

  const seed = useExamSeed(type, language);
  const canEdit = !session?.user?.plan || canEditExams(session.user.plan);
  // -1 is the unlimited sentinel. Checked here so the cap blocks *entry* to every seed —
  // AI search, edital upload and blank alike — instead of only surfacing at save, after
  // the user has already spent an LLM call or filled the whole editor by hand.
  const isAtExamCap = usage != null && usage.examsLimit !== -1 && usage.examsUsed >= usage.examsLimit;
  const [hydrated, setHydrated] = useState(false);
  const [resumedDraft, setResumedDraft] = useState<StoredDraft | null>(null);

  useEffect(() => {
    setResumedDraft(readStoredDraft(config.draftStorageKey));
    setHydrated(true);
    // Empty deps is intentional: only ever runs once per exam type — switching type
    // mid-flow isn't a supported transition (the page fully remounts via the URL param).
  }, []);

  const persistDraft = (draft: Exam, context?: string, sources?: string[], confidence?: BlueprintConfidence) => {
    try {
      const payload: StoredDraft = { draft, context, sources, confidence };

      localStorage.setItem(config.draftStorageKey, JSON.stringify(payload));
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

  const debugVariant = process.env.NODE_ENV !== 'production' ? buildDebugVariant(searchParams) : null;

  if (debugVariant) {
    return (
      <PageHeader breadcrumbs={breadcrumbs}>
        <SeedLoadingScreen
          startedAt={Date.now()}
          type={type}
          variant={debugVariant}
          onCancel={() => router.push(listHref)}
          onRetry={() => {}}
          onSelectMatch={() => {}}
          onStartBlank={() => {}}
        />
      </PageHeader>
    );
  }

  // Tela 2 (editor / skeleton) carries its own name-based heading — showing PageHeader's
  // static title above it would double up. Only Tela 1 (the seed picker) needs it.
  // Every state below runs the loading screen, which carries its own header — showing the
  // Tela 1 header above it would double up.
  const SCREEN_OWNED_STATES = [
    'ready',
    'error',
    'identifying',
    'disambiguating',
    'clarifying',
    'identify-failed',
    'selecting-role',
    'locating-edital',
    'approving-edital',
    'loading-blueprint',
    'extracting-edital',
  ];
  const isEditorMode = hydrated && (resumedDraft !== null || SCREEN_OWNED_STATES.includes(seed.state.kind));

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

  if (isAtExamCap) {
    return (
      <PageHeader breadcrumbs={breadcrumbs} title={pageTitle}>
        <IllustratedEmptyState
          action={{
            label: t('billing.upgradeModal.cta'),
            onPress: () =>
              showLimit({
                code: 'exam_limit',
                limit: usage.examsLimit,
                used: usage.examsUsed,
                plan: usage.plan,
              }),
          }}
          description={t('limit.examWallDescription', {
            used: String(usage.examsUsed),
            limit: String(usage.examsLimit),
          })}
          icon={config.icon}
          secondaryAction={{ label: t('common.back'), href: listHref }}
          title={t('limit.examTitle')}
        />
      </PageHeader>
    );
  }

  return (
    <PageHeader breadcrumbs={breadcrumbs}>
      {!hydrated ? null : resumedDraft ? (
        <ExamEditorPage
          type={type}
          confidence={resumedDraft.confidence}
          context={resumedDraft.context}
          initialDraft={resumedDraft.draft}
          sources={resumedDraft.sources}
          onDiscard={handleDiscard}
          onDraftChange={persistDraft}
          onSaved={handleSaved}
        />
      ) : isEditorMode ? (
        renderSeedContent()
      ) : (
        <>
          <NewExamHeader cancelHref={listHref} title={t(config.seedQuestionKey)} />
          {renderSeedContent()}
        </>
      )}
    </PageHeader>
  );

  function renderSeedContent() {
    switch (seed.state.kind) {
      case 'identifying':
      case 'disambiguating':
      case 'clarifying':
      case 'identify-failed':
      case 'selecting-role':
      case 'locating-edital':
      case 'approving-edital':
        return (
          <SeedLoadingScreen
            startedAt={seed.state.startedAt}
            type={type}
            variant={{ kind: 'identify', query: identifyQuery(seed.state), phase: identifyPhase(seed.state) }}
            onApproveEdital={(candidate) => seed.approveEdital(candidate)}
            onCancel={seed.reset}
            onRelocateEdital={(key) => void seed.relocateEdital(key)}
            onRetry={seed.identifyByName}
            onSelectMatch={(match) => void seed.selectMatch(match)}
            onSelectRole={(role) => void seed.confirmRole(role)}
            onSkipEdital={seed.skipEdital}
            onStartBlank={seed.startBlank}
          />
        );
      case 'loading-blueprint':
        return (
          <SeedLoadingScreen
            startedAt={seed.state.startedAt}
            type={type}
            variant={{ kind: 'auto-config', seed: seed.state.seed, stage: seed.state.stage }}
            onCancel={seed.reset}
          />
        );
      case 'extracting-edital':
        return (
          <SeedLoadingScreen
            startedAt={seed.state.startedAt}
            type={type}
            variant={{ kind: 'edital', fileName: seed.state.fileName }}
            onCancel={seed.reset}
          />
        );
      case 'ready':
        return (
          <ExamEditorPage
            type={type}
            confidence={seed.state.confidence}
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
            type={type}
            onIdentify={seed.identifyByName}
            onStartBlank={seed.startBlank}
            onUploadEdital={seed.uploadEdital}
          />
        );
    }
  }
}

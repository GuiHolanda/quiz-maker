'use client';
import type {
  AutoConfigMatch,
  AutoConfigStage,
  BlueprintConfidence,
  EditalCandidate,
  Exam,
  ExamType,
  Language,
} from '@/shared/types';
import type { ConfirmedSeed } from './components/seed/SeedIdentifyCard';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  cancelAutoConfigJob,
  createAutoConfigJob,
  extractEdital,
  getActiveAutoConfigJob,
  identifyExam,
  locateEdital,
} from '@/features/connectors';
import { useLimitModal } from '@/features/hooks/useLimitModal.hook';
import { DEFAULT_QUESTION_FORMAT } from '@/config/question-formats';
import { classifyEditalUrl } from '@/lib/edital-classifier';
import { classifyEditalDomain } from '@/lib/edital-domains';
import { AUTO_CONFIG_URL } from '@/config/constants';

export type ExamSeedState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'identifying'; readonly query: string; readonly startedAt: number }
  | {
      readonly kind: 'disambiguating';
      readonly examName: string;
      readonly matches: AutoConfigMatch[];
      readonly startedAt: number;
    }
  | {
      readonly kind: 'selecting-role';
      readonly examName: string;
      readonly match: AutoConfigMatch;
      // The edital candidate the user approved on the previous step (null = proceed without).
      readonly edital: { readonly url: string; readonly isPriorYear: boolean } | null;
      readonly startedAt: number;
    }
  | { readonly kind: 'clarifying'; readonly examName: string; readonly message: string; readonly startedAt: number }
  // public_exam only: after the concurso is identified, locate the official edital PDF before
  // showing the cargo selection step. The user then approves a candidate (or skips) and only
  // after that picks their cargo. Never blocks — a failed locate transitions to approving-edital
  // with an empty list so the user can still type a number or continue without.
  | {
      readonly kind: 'locating-edital';
      readonly examName: string;
      readonly match: AutoConfigMatch;
      readonly startedAt: number;
    }
  // Located edital(s) are presented for the user's approval. Carries all candidates returned by
  // locateEdital; targetYearFound tells the UI which one to highlight as the official match.
  // confirmedFound is false when locateEdital's verification loop never confirmed any
  // candidate — the UI still lists what it found, but leads with the "not confirmed" framing
  // instead of presenting one of them as the edital. The user can approve a candidate, type an
  // edital number to re-search, or skip entirely.
  | {
      readonly kind: 'approving-edital';
      readonly examName: string;
      readonly match: AutoConfigMatch;
      readonly editais: readonly EditalCandidate[];
      readonly targetYearFound: boolean;
      readonly confirmedFound: boolean;
      readonly startedAt: number;
    }
  // The identify call itself failed. Unlike a blueprint failure — where the exam is already
  // known and a prefilled editor is useful — there is nothing to prefill here, so the flow
  // stays on the loading screen and offers a retry instead of a blank form.
  | { readonly kind: 'identify-failed'; readonly query: string; readonly startedAt: number }
  // The certification/concurso is confirmed — the editor (Tela 2) mounts now, showing a
  // skeleton where the distribution table will land, rather than holding the user on Tela 1
  // through the whole research→review→format pipeline. `stage` tracks SSE progress so the
  // skeleton can show what's happening instead of a mute spinner.
  | {
      readonly kind: 'loading-blueprint';
      // Full match, not just the name: the loading screen surfaces the exam code, role and
      // year it already resolved, which otherwise stay invisible until the editor.
      readonly seed: ConfirmedSeed;
      readonly stage: AutoConfigStage | null;
      readonly startedAt: number;
    }
  | { readonly kind: 'extracting-edital'; readonly fileName: string; readonly startedAt: number }
  | {
      readonly kind: 'ready';
      readonly draft: Exam;
      readonly context: string;
      readonly sources: string[];
      // public_exam via auto-config only — how confident the data is (real edital PDF vs.
      // estimated from web research). Absent for blank starts and the manual-upload path.
      readonly confidence?: BlueprintConfidence;
    }
  // The pipeline failed or returned something unparseable — open the editor blank rather
  // than dead-end the user; `seedName` pre-fills the name field so nothing typed is lost.
  | { readonly kind: 'error'; readonly messageKey: string; readonly seedName: string };

// Exported so page.tsx can build the same blank shape for the error-fallback path.
export function emptyExamDraft(type: ExamType): Exam {
  return {
    type,
    name: '',
    role: null,
    year: null,
    key: null,
    totalQuestions: 0,
    examDurationMinutes: null,
    passingScore: null,
    questionFormat: DEFAULT_QUESTION_FORMAT,
    provider: null,
    examBoard: null,
    sections: [],
  };
}

interface DoneEventData {
  readonly exam: {
    readonly examDraft: Exam;
    readonly context: string;
    readonly sources: string[];
    readonly confidence?: BlueprintConfidence;
  } | null;
}

interface UseExamSeedReturn {
  readonly state: ExamSeedState;
  readonly identifyByName: (query: string) => Promise<void>;
  readonly selectMatch: (match: AutoConfigMatch) => Promise<void>;
  readonly confirmRole: (role: string) => Promise<void>;
  readonly approveEdital: (candidate: EditalCandidate) => void;
  readonly relocateEdital: (editalKey: string) => Promise<void>;
  readonly skipEdital: () => void;
  readonly uploadEdital: (file: File, role: string | undefined) => Promise<void>;
  readonly startBlank: () => void;
  readonly reset: () => void;
}

export function useExamSeed(type: ExamType, language: Language): UseExamSeedReturn {
  const [state, setState] = useState<ExamSeedState>({ kind: 'idle' });
  // Mirrors `state` for synchronous reads inside event-handler callbacks below (confirmRole,
  // selectPriorEdital, continueWithoutEdital) — those need "whatever the state is right now"
  // without waiting for a render. Reading it via a setState(prev => ...) updater used to work
  // by relying on React's eager-bailout optimization (which runs the updater synchronously
  // when the fiber has no other pending work), but that optimization is skipped whenever
  // anything else has scheduled a render — e.g. right after the async locate-edital step's own
  // setState — silently making the read return stale/null data. A ref updated every render
  // has no such precondition.
  const stateRef = useRef(state);

  stateRef.current = state;
  const eventSourceRef = useRef<EventSource | null>(null);
  const jobIdRef = useRef<string | null>(null);
  // Flips true on the first user-initiated action (search, blank start, edital upload,
  // discard). Guards the mount-time reconnect below: if the user already acted before the
  // "is there a job in flight" check resolves, that stale result must not override them.
  const userActedRef = useRef(false);
  const { showLimitIfBlocked } = useLimitModal();

  const closeStream = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);

  // Invalidated by reset() so a stale extractEdital() response can't clobber a user-initiated
  // cancel — extractEdital is a plain HTTP call with no server-side job to close out.
  const runIdRef = useRef(0);

  const reset = useCallback(() => {
    userActedRef.current = true;
    runIdRef.current += 1;
    closeStream();
    if (jobIdRef.current) {
      const jobId = jobIdRef.current;

      jobIdRef.current = null;
      void cancelAutoConfigJob(jobId).catch(() => {
        /* best-effort — the job's own TTL will clean it up otherwise */
      });
    }
    setState({ kind: 'idle' });
  }, [closeStream]);

  const startBlank = useCallback(() => {
    userActedRef.current = true;
    setState({ kind: 'ready', draft: emptyExamDraft(type), context: '', sources: [] });
  }, [type]);

  const watchJob = useCallback(
    (jobId: string, examName: string) => {
      closeStream();
      jobIdRef.current = jobId;

      const es = new EventSource(`/api${AUTO_CONFIG_URL}/${jobId}/stream`);
      eventSourceRef.current = es;

      es.addEventListener('progress', (e) => {
        const data = JSON.parse((e as MessageEvent).data) as { stage: AutoConfigStage | null };

        setState((prev) => (prev.kind === 'loading-blueprint' ? { ...prev, stage: data.stage } : prev));
      });

      es.addEventListener('done', (e) => {
        closeStream();
        jobIdRef.current = null;
        const data = JSON.parse((e as MessageEvent).data) as DoneEventData;

        if (!data.exam) {
          setState({ kind: 'error', messageKey: 'error.aiSeedNoBlueprint', seedName: examName });
          return;
        }
        setState({
          kind: 'ready',
          draft: data.exam.examDraft,
          context: data.exam.context,
          sources: data.exam.sources,
          confidence: data.exam.confidence,
        });
      });

      es.addEventListener('error', () => {
        closeStream();
        jobIdRef.current = null;
        setState({ kind: 'error', messageKey: 'error.aiSeedNoBlueprint', seedName: examName });
      });

      es.addEventListener('cancelled', () => {
        closeStream();
        jobIdRef.current = null;
        setState({ kind: 'idle' });
      });

      // Native EventSource 'error' (network/connection failure) — same fallback as an
      // application-level failure, since the pipeline's own state is now unreachable.
      es.onerror = () => {
        closeStream();
        jobIdRef.current = null;
        setState({ kind: 'error', messageKey: 'error.aiSeedNoBlueprint', seedName: examName });
      };
    },
    [closeStream]
  );

  const confirmMatch = useCallback(
    async (match: AutoConfigMatch, edital?: { readonly url: string; readonly isPriorYear: boolean } | null) => {
      userActedRef.current = true;
      const runId = ++runIdRef.current;
      const seed: ConfirmedSeed = {
        label: match.label,
        key: match.key,
        provider: match.provider,
        examBoard: match.examBoard,
        role: match.role,
        year: match.year,
      };

      // Coming straight off identify (single match, no user input in between) the clock keeps
      // running — it's one continuous wait. Any other path (disambiguation, edital approval,
      // cargo selection) restarts the clock so the user's deliberation time isn't billed to the
      // pipeline.
      setState((prev) => ({
        kind: 'loading-blueprint',
        seed,
        stage: null,
        startedAt: prev.kind === 'identifying' ? prev.startedAt : Date.now(),
      }));

      try {
        const { jobId } = await createAutoConfigJob({
          type,
          name: match.label,
          key: match.key,
          provider: match.provider,
          examBoard: match.examBoard,
          role: match.role,
          year: match.year,
          language,
          edital,
        });

        if (runIdRef.current !== runId) return;
        watchJob(jobId, match.label);
      } catch (err) {
        if (runIdRef.current !== runId) return;
        if (showLimitIfBlocked(err)) {
          setState({ kind: 'idle' });
          return;
        }
        setState({ kind: 'error', messageKey: 'error.aiSeedNoBlueprint', seedName: match.label });
      }
    },
    [type, language, watchJob, showLimitIfBlocked]
  );

  // public_exam only: right after the concurso match is selected, look for the official edital
  // PDF. Always routes to approving-edital so the user can review/approve the result — never
  // silently auto-confirms. An error here still reaches approving-edital with an empty list so
  // the user can type a number manually or continue without a PDF.
  const locateEditalStep = useCallback(
    async (match: AutoConfigMatch) => {
      const runId = ++runIdRef.current;

      setState((prev) => ({
        kind: 'locating-edital',
        examName: match.label,
        match,
        startedAt: prev.kind === 'identifying' ? prev.startedAt : Date.now(),
      }));

      try {
        const result = await locateEdital({
          examName: match.label,
          examBoard: match.examBoard,
          editalKey: match.key,
          year: match.year,
          role: match.role ?? '',
          language,
        });

        if (runIdRef.current !== runId) return;

        setState({
          kind: 'approving-edital',
          examName: match.label,
          match,
          editais: result.editais,
          targetYearFound: result.targetYearFound,
          confirmedFound: result.confirmedFound,
          startedAt: Date.now(),
        });
      } catch (err) {
        if (runIdRef.current !== runId) return;
        if (showLimitIfBlocked(err)) {
          setState({ kind: 'idle' });
          return;
        }
        // Locate failed — still show the approval screen so the user can type a number or skip.
        setState({
          kind: 'approving-edital',
          examName: match.label,
          match,
          editais: [],
          targetYearFound: false,
          confirmedFound: false,
          startedAt: Date.now(),
        });
      }
    },
    [language, showLimitIfBlocked]
  );

  const selectMatch = useCallback(
    async (match: AutoConfigMatch) => {
      if (type === 'certification') {
        await confirmMatch(match);
        return;
      }
      await locateEditalStep(match);
    },
    [type, confirmMatch, locateEditalStep]
  );

  const confirmRole = useCallback(
    async (role: string) => {
      const current = stateRef.current;

      if (current.kind !== 'selecting-role') return;
      await confirmMatch({ ...current.match, role: role.trim() }, current.edital);
    },
    [confirmMatch]
  );

  const approveEdital = useCallback((candidate: EditalCandidate) => {
    const current = stateRef.current;

    if (current.kind !== 'approving-edital') return;
    const { match, targetYearFound } = current;
    const isPriorYear = candidate.year != null && match.year != null ? candidate.year !== match.year : !targetYearFound;

    setState({
      kind: 'selecting-role',
      examName: match.label,
      match,
      edital: { url: candidate.url, isPriorYear },
      startedAt: Date.now(),
    });
  }, []);

  const relocateEdital = useCallback(
    async (editalKey: string) => {
      const current = stateRef.current;

      if (current.kind !== 'approving-edital') return;

      const trimmed = editalKey.trim();

      // If the user pasted a direct PDF URL, approve it immediately without a new search.
      if (/^https?:\/\//.test(trimmed)) {
        approveEdital({
          url: trimmed,
          editalNumber: current.match.key,
          year: current.match.year,
          orgao: null,
          isOfficialDomain: false,
          coversRole: !!current.match.role,
          documentKind: classifyEditalUrl(trimmed),
          domainClass: classifyEditalDomain(trimmed),
          // Never downloaded/read — nothing here has verified it's the real edital, unlike a
          // candidate that came out of locateEdital's verification loop.
          verification: 'unchecked',
        });
        return;
      }

      await locateEditalStep({ ...current.match, key: trimmed || current.match.key });
    },
    [locateEditalStep, approveEdital]
  );

  const skipEdital = useCallback(() => {
    const current = stateRef.current;

    if (current.kind !== 'approving-edital') return;
    setState({
      kind: 'selecting-role',
      examName: current.match.label,
      match: current.match,
      edital: null,
      startedAt: Date.now(),
    });
  }, []);

  const identifyByName = useCallback(
    async (query: string) => {
      const trimmed = query.trim();

      if (!trimmed) return;

      userActedRef.current = true;
      const runId = ++runIdRef.current;
      const startedAt = Date.now();

      setState({ kind: 'identifying', query: trimmed, startedAt });

      try {
        const result = await identifyExam(trimmed, type, language);

        if (runIdRef.current !== runId) return;
        if (result.matches.length === 0) {
          setState({
            kind: 'clarifying',
            examName: trimmed,
            message: result.clarification ?? '',
            startedAt,
          });
          return;
        }
        if (result.matches.length === 1) {
          await selectMatch(result.matches[0]);
          return;
        }
        setState({ kind: 'disambiguating', examName: trimmed, matches: result.matches, startedAt });
      } catch (err) {
        if (runIdRef.current !== runId) return;
        if (showLimitIfBlocked(err)) {
          setState({ kind: 'idle' });
          return;
        }
        setState({ kind: 'identify-failed', query: trimmed, startedAt });
      }
    },
    [type, language, selectMatch, showLimitIfBlocked]
  );

  const uploadEdital = useCallback(
    async (file: File, role: string | undefined) => {
      userActedRef.current = true;
      const runId = ++runIdRef.current;

      setState({ kind: 'extracting-edital', fileName: file.name, startedAt: Date.now() });
      try {
        const exam = await extractEdital(file, role);

        if (runIdRef.current !== runId) return;
        setState({ kind: 'ready', draft: exam, context: '', sources: [] });
      } catch (err: unknown) {
        if (runIdRef.current !== runId) return;
        if (showLimitIfBlocked(err)) {
          setState({ kind: 'idle' });

          return;
        }
        setState({ kind: 'error', messageKey: 'error.aiSeedEditalFailed', seedName: '' });
      }
    },
    [showLimitIfBlocked]
  );

  // Reconnect to an in-flight job on mount — a reload mid-pipeline shouldn't strand the
  // user back on the picker with no memory of the exam they already confirmed.
  useEffect(() => {
    let cancelled = false;

    void getActiveAutoConfigJob(type).then((job) => {
      if (cancelled || userActedRef.current || !job || (job.status !== 'queued' && job.status !== 'running')) return;
      setState({
        kind: 'loading-blueprint',
        seed: {
          label: job.seedName,
          key: job.seedKey,
          provider: job.seedProvider,
          examBoard: job.seedBoard,
          role: job.seedRole,
          year: job.seedYear,
        },
        stage: (job.stage as AutoConfigStage) ?? null,
        startedAt: new Date(job.createdAt).getTime(),
      });
      watchJob(job.id, job.seedName);
    });

    return () => {
      cancelled = true;
    };
    // Runs once per mount for this exam type — the type is fixed by the URL for the
    // lifetime of this page (see NewExamContent's remount-on-type-change comment).
  }, [type]);

  useEffect(() => () => closeStream(), [closeStream]);

  return {
    state,
    identifyByName,
    selectMatch,
    confirmRole,
    approveEdital,
    relocateEdital,
    skipEdital,
    uploadEdital,
    startBlank,
    reset,
  };
}

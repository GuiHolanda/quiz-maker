'use client';
import type { AutoConfigMatch, AutoConfigStage, Exam, ExamType, Language } from '@/shared/types';
import type { ConfirmedSeed } from './components/seed/SeedIdentifyCard';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  cancelAutoConfigJob,
  createAutoConfigJob,
  extractEdital,
  getActiveAutoConfigJob,
  identifyExam,
} from '@/features/connectors';
import { useLimitModal } from '@/features/hooks/useLimitModal.hook';
import { DEFAULT_QUESTION_FORMAT } from '@/config/question-formats';
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
  | { readonly kind: 'clarifying'; readonly examName: string; readonly message: string; readonly startedAt: number }
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
  | { readonly kind: 'ready'; readonly draft: Exam; readonly context: string; readonly sources: string[] }
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
  readonly exam: { readonly examDraft: Exam; readonly context: string; readonly sources: string[] } | null;
}

interface UseExamSeedReturn {
  readonly state: ExamSeedState;
  readonly identifyByName: (query: string) => Promise<void>;
  readonly confirmMatch: (match: AutoConfigMatch) => Promise<void>;
  readonly uploadEdital: (file: File, role: string | undefined) => Promise<void>;
  readonly startBlank: () => void;
  readonly reset: () => void;
}

export function useExamSeed(type: ExamType, language: Language): UseExamSeedReturn {
  const [state, setState] = useState<ExamSeedState>({ kind: 'idle' });
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
        setState({ kind: 'ready', draft: data.exam.examDraft, context: data.exam.context, sources: data.exam.sources });
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
    async (match: AutoConfigMatch) => {
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
      // running — it's one continuous wait. Picked from a disambiguation list, it restarts, so
      // the user's own deliberation time isn't billed to the pipeline.
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
          await confirmMatch(result.matches[0]);
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
    [type, language, confirmMatch, showLimitIfBlocked]
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
          key: null,
          provider: job.seedProvider,
          examBoard: null,
          role: null,
          year: null,
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

  return { state, identifyByName, confirmMatch, uploadEdital, startBlank, reset };
}

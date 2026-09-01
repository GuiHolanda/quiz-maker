'use client';

import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import type { AIExamQuestion, GenerationJobStatus, GenerationJobTopicStatus } from '@/shared/types';
import type { GenerationLanguage } from '@/config/generation-languages';
import {
  createGenerationJob,
  getActiveGenerationJobs,
  getGenerationJob,
  cancelGenerationJob,
  saveGenerationJob,
} from '@/features/connectors';
import { SIMULADO_NEW_PREFILL_KEY, GENERATION_MAX_ACTIVE_JOBS_PER_USER } from '@/config/constants';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { useNotificationsContext } from '@/features/hooks/useNotificationsContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';

export type GenerationJobType = 'certification' | 'public_exam';

// Um job ativo rastreado no cliente, com todos os campos que a UI precisa.
export interface TrackedJob {
  readonly jobId: string;
  readonly type: GenerationJobType;
  readonly refKey: string;
  readonly refName: string;
  readonly status: 'queued' | 'running' | 'awaiting_review' | 'done' | 'error';
  readonly doneTopics: number;
  readonly totalTopics: number;
  readonly queuedTopics: number;
  readonly topics: GenerationJobTopicStatus[];
  readonly isSaving: boolean;
  // Contexto para pré-preencher o simulado após salvar.
  readonly prefill: { totalQuestions: number };
}

interface StartJobInput {
  readonly type: GenerationJobType;
  readonly refKey: string;
  readonly refName: string;
  readonly examBoardName?: string;
  readonly language?: GenerationLanguage;
  readonly totalQuestions: number;
  readonly distribution: Array<{ topicName: string; questionCount: number }>;
}

interface GenerationJobsContextValue {
  readonly jobs: TrackedJob[];
  readonly startJob: (input: StartJobInput) => Promise<void>;
  readonly cancelJob: (jobId: string) => Promise<void>;
  readonly saveAllJob: (jobId: string) => Promise<void>;
  readonly getJobPendingQuestions: (jobId: string) => Promise<Array<AIExamQuestion>>;
}

export const GenerationJobsContext = createContext<GenerationJobsContextValue>({
  jobs: [],
  startJob: async () => {},
  cancelJob: async () => {},
  saveAllJob: async () => {},
  getJobPendingQuestions: async () => [],
});

export function GenerationJobsProvider({ children }: { readonly children: ReactNode }) {
  const { t } = useTranslation();
  const { refreshUsage } = useUsageContext();
  const { addNotification } = useNotificationsContext();

  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  // Um EventSource por jobId — sobrevive enquanto o job está ativo.
  const sourcesRef = useRef<Map<string, EventSource>>(new Map());

  const updateJob = useCallback((jobId: string, patch: Partial<TrackedJob>) => {
    setJobs((prev) => prev.map((job) => (job.jobId === jobId ? { ...job, ...patch } : job)));
  }, []);

  const closeSource = useCallback((jobId: string) => {
    const es = sourcesRef.current.get(jobId);
    if (es) {
      es.close();
      sourcesRef.current.delete(jobId);
    }
  }, []);

  const fireDoneNotification = useCallback(
    (job: TrackedJob, savedCount: number, topicsDone: number) => {
      refreshUsage();
      try {
        localStorage.setItem(
          SIMULADO_NEW_PREFILL_KEY,
          JSON.stringify({ type: job.type, examId: job.refKey, totalQuestions: job.prefill.totalQuestions })
        );
      } catch {}
      addNotification({
        title: t('notification.fullExamTitle'),
        description: t('notification.fullExamDescription', {
          certName: job.refName,
          total: savedCount,
          topics: topicsDone,
        }),
        ctaLabel: t('generate.createSimulado'),
        ctaHref: '/simulados',
      });
    },
    [addNotification, refreshUsage, t]
  );

  const connectStream = useCallback(
    (jobId: string) => {
      closeSource(jobId);
      // EventSource é API nativa do browser — usa o path absoluto /api (não o axios baseURL).
      const es = new EventSource(`/api/generation-job/${jobId}/stream`);
      sourcesRef.current.set(jobId, es);

      const applyProgress = (e: MessageEvent) => {
        const data = JSON.parse(e.data) as {
          doneTopics: number;
          totalTopics: number;
          queuedTopics?: number;
          topics?: GenerationJobTopicStatus[];
        };
        updateJob(jobId, {
          doneTopics: data.doneTopics,
          totalTopics: data.totalTopics,
          queuedTopics: data.queuedTopics ?? 0,
          ...(data.topics ? { topics: data.topics } : {}),
        });
      };

      es.addEventListener('progress', applyProgress);

      es.addEventListener('awaiting_review', (e) => {
        applyProgress(e as MessageEvent);
        updateJob(jobId, { status: 'awaiting_review' });
        closeSource(jobId);
        refreshUsage();
      });

      es.addEventListener('done', (e) => {
        const data = JSON.parse((e as MessageEvent).data) as {
          doneTopics: number;
          totalTopics: number;
          savedCount: number;
          topics?: GenerationJobTopicStatus[];
        };
        closeSource(jobId);
        setJobs((prev) => {
          const job = prev.find((j) => j.jobId === jobId);
          if (job) fireDoneNotification(job, data.savedCount, data.doneTopics);
          // Remove o job da lista ativa; o histórico assume a partir daqui.
          return prev.filter((j) => j.jobId !== jobId);
        });
      });

      es.addEventListener('error', () => {
        closeSource(jobId);
        updateJob(jobId, { status: 'error' });
      });

      es.addEventListener('cancelled', () => {
        closeSource(jobId);
        setJobs((prev) => prev.filter((j) => j.jobId !== jobId));
      });
    },
    [closeSource, updateJob, fireDoneNotification]
  );

  const startJob = useCallback(
    async (input: StartJobInput) => {
      const validTopics = input.distribution.filter((entry) => entry.questionCount > 0);
      if (validTopics.length === 0) return;

      try {
        const { jobId } = await createGenerationJob({
          type: input.type,
          refKey: input.refKey,
          refName: input.refName,
          examBoardName: input.examBoardName,
          language: input.language,
          distribution: validTopics,
        });
        setJobs((prev) => [
          ...prev,
          {
            jobId,
            type: input.type,
            refKey: input.refKey,
            refName: input.refName,
            status: 'running',
            doneTopics: 0,
            totalTopics: validTopics.length,
            queuedTopics: validTopics.length,
            // Semeia os tópicos localmente (todos "queued") para o card já nascer completo,
            // evitando o flicker até o primeiro evento SSE chegar com os IDs reais.
            topics: validTopics.map((entry, i) => ({
              id: `pending-${jobId}-${i}`,
              topicName: entry.topicName,
              questionCount: entry.questionCount,
              status: 'queued' as const,
              savedCount: 0,
              errorMessage: null,
              errorType: null,
            })),
            isSaving: false,
            prefill: { totalQuestions: input.totalQuestions },
          },
        ]);
        connectStream(jobId);
      } catch (e: unknown) {
        // O único 429 possível neste endpoint é o teto de jobs ativos simultâneos (A2).
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (status === 429) {
          notify.warning(
            t('generate.tooManyJobsTitle'),
            t('generate.tooManyJobsDescription', { max: GENERATION_MAX_ACTIVE_JOBS_PER_USER })
          );
          return;
        }
        notify.error(t('toast.error'), t('toast.somethingWrong'));
      }
    },
    [connectStream, t]
  );

  const cancelJob = useCallback(
    async (jobId: string) => {
      closeSource(jobId);
      try {
        await cancelGenerationJob(jobId);
      } catch {}
      setJobs((prev) => prev.filter((j) => j.jobId !== jobId));
    },
    [closeSource]
  );

  const saveAllJob = useCallback(
    async (jobId: string) => {
      updateJob(jobId, { isSaving: true });
      try {
        const job = jobs.find((j) => j.jobId === jobId);
        const { savedCount } = await saveGenerationJob(jobId);
        if (job) fireDoneNotification(job, savedCount, job.topics.filter((topic) => topic.status === 'done').length);
        setJobs((prev) => prev.filter((j) => j.jobId !== jobId));
      } catch {
        notify.error(t('toast.error'), t('toast.somethingWrong'));
        updateJob(jobId, { isSaving: false });
      }
    },
    [jobs, fireDoneNotification, updateJob, t]
  );

  const getJobPendingQuestions = useCallback(async (jobId: string) => {
    const job = await getGenerationJob(jobId);
    const pending = job.topics
      .filter((topic) => topic.status === 'done')
      .flatMap((topic) => {
        const withJson = topic as GenerationJobTopicStatus & { pendingQuestionsJson?: string };
        return withJson.pendingQuestionsJson
          ? (JSON.parse(withJson.pendingQuestionsJson) as Array<AIExamQuestion>)
          : [];
      });
    // Cada tópico numera suas questões a partir de 1 — reindexa para IDs únicos na lista unificada.
    return pending.map((question, i) => ({ ...question, id: i + 1 }));
  }, []);

  // Reconecta a todos os jobs ativos no mount (ex.: reload da página).
  useEffect(() => {
    getActiveGenerationJobs()
      .then((active) => {
        if (active.length === 0) return;
        setJobs(
          active.map((job: GenerationJobStatus) => ({
            jobId: job.id,
            type: job.type,
            refKey: job.refKey,
            refName: job.refName,
            status: job.status === 'done' ? 'awaiting_review' : job.status,
            doneTopics: job.doneTopics,
            totalTopics: job.totalTopics,
            queuedTopics: job.queuedTopics,
            topics: job.topics,
            isSaving: false,
            prefill: { totalQuestions: job.totalTopics },
          }))
        );
        for (const job of active) {
          if (job.status === 'queued' || job.status === 'running') connectStream(job.id);
        }
      })
      .catch(() => {
        // Silently ignore errors (network failure, test abort) — the page still works
        // without reconnect; the user can manually trigger a new job.
      });
  }, []);

  useEffect(() => {
    const sources = sourcesRef.current;
    return () => {
      for (const es of Array.from(sources.values())) es.close();
      sources.clear();
    };
  }, []);

  return (
    <GenerationJobsContext.Provider value={{ jobs, startJob, cancelJob, saveAllJob, getJobPendingQuestions }}>
      {children}
    </GenerationJobsContext.Provider>
  );
}

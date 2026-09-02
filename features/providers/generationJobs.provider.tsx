'use client';

import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import type { GenerationJobStatus, GenerationJobTopicStatus } from '@/shared/types';
import type { GenerationLanguage } from '@/config/generation-languages';
import { createGenerationJob, getActiveGenerationJobs, cancelGenerationJob } from '@/features/connectors';
import {
  buildSimuladoPrefillFromJob,
  writeSimuladoPrefill,
} from '@/app/(workspace)/simulados/components/create/simuladoPrefill';
import { GENERATION_MAX_ACTIVE_JOBS_PER_USER } from '@/config/constants';
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
  readonly status: 'queued' | 'running' | 'saving' | 'done' | 'error';
  readonly doneTopics: number;
  readonly totalTopics: number;
  readonly queuedTopics: number;
  readonly topics: GenerationJobTopicStatus[];
}

interface StartJobInput {
  readonly type: GenerationJobType;
  readonly refKey: string;
  readonly refName: string;
  readonly examBoardName?: string;
  readonly language?: GenerationLanguage;
  readonly distribution: Array<{ topicName: string; questionCount: number }>;
}

interface GenerationJobsContextValue {
  readonly jobs: TrackedJob[];
  readonly startJob: (input: StartJobInput) => Promise<void>;
  readonly cancelJob: (jobId: string) => Promise<void>;
  readonly dismissJob: (jobId: string) => void;
}

export const GenerationJobsContext = createContext<GenerationJobsContextValue>({
  jobs: [],
  startJob: async () => {},
  cancelJob: async () => {},
  dismissJob: () => {},
});

export function GenerationJobsProvider({ children }: { readonly children: ReactNode }) {
  const { t } = useTranslation();
  const { refreshUsage } = useUsageContext();
  const { addNotification } = useNotificationsContext();

  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  // Espelha o estado atual para leitura dentro de callbacks de evento SSE, sem
  // disparar efeitos colaterais de dentro do updater do setJobs.
  const jobsRef = useRef<TrackedJob[]>(jobs);
  jobsRef.current = jobs;
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
    (job: TrackedJob, savedCount: number, topicsDone: number, topics: GenerationJobTopicStatus[]) => {
      refreshUsage();
      try {
        const prefill = buildSimuladoPrefillFromJob({ refKey: job.refKey, topics });
        if (prefill) writeSimuladoPrefill(prefill);
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

      es.addEventListener('done', (e) => {
        const data = JSON.parse((e as MessageEvent).data) as {
          doneTopics: number;
          totalTopics: number;
          savedCount: number;
          topics?: GenerationJobTopicStatus[];
        };
        closeSource(jobId);
        const topics = data.topics ?? [];
        const job = jobsRef.current.find((j) => j.jobId === jobId);
        if (job) {
          fireDoneNotification(job, data.savedCount, data.doneTopics, topics.length > 0 ? topics : job.topics);
        }
        setJobs((prev) =>
          prev.map((j) =>
            j.jobId === jobId
              ? {
                  ...j,
                  status: 'done' as const,
                  doneTopics: data.doneTopics,
                  totalTopics: data.totalTopics,
                  ...(topics.length > 0 ? { topics } : {}),
                }
              : j
          )
        );
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

  const dismissJob = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.jobId !== jobId));
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
            status: job.status,
            doneTopics: job.doneTopics,
            totalTopics: job.totalTopics,
            queuedTopics: job.queuedTopics,
            topics: job.topics,
          }))
        );
        for (const job of active) {
          if (job.status === 'queued' || job.status === 'running' || job.status === 'saving') connectStream(job.id);
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
    <GenerationJobsContext.Provider value={{ jobs, startJob, cancelJob, dismissJob }}>
      {children}
    </GenerationJobsContext.Provider>
  );
}

'use client';

import type { Exam } from '@/shared/types';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { normalizeMock, UnifiedSimulado } from '../list/normalizeSimulado';
import { SimuladoFormState, buildCreatePayload } from './simuladoFormState';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useMockExamsContext } from '@/features/providers/mockExams.provider';
import { createMockExam, ensureMockExamAnswers, startMockExamAttempt } from '@/features/connectors';
import { notify } from '@/shared/lib/notify';

export type GenerationPhase = 'config' | 'gerando' | 'pronto';

const STEP_INTERVAL_MS = 1600;
const LAST_STEP = 4;

function extractMessage(error: unknown): string | undefined {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
}

interface UseSimuladoGenerationParams {
  readonly exam: Exam | null;
  readonly state: SimuladoFormState;
}

export function useSimuladoGeneration({ exam, state }: UseSimuladoGenerationParams) {
  const { t } = useTranslation();
  const router = useRouter();
  const { addMockExam } = useMockExamsContext();

  const [phase, setPhase] = useState<GenerationPhase>('config');
  const [stepIndex, setStepIndex] = useState(0);
  const [postDone, setPostDone] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [createdSimulado, setCreatedSimulado] = useState<UnifiedSimulado | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'gerando') return;

    if (stepIndex >= LAST_STEP && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (stepIndex >= LAST_STEP && postDone) {
      setPhase('pronto');
      setIsBusy(false);
    }
  }, [phase, stepIndex, postDone]);

  function clearGenerationInterval() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function backToConfig() {
    clearGenerationInterval();
    setPhase('config');
    setStepIndex(0);
    setPostDone(false);
    setCreatedSimulado(null);
    setIsBusy(false);
    setIsStarting(false);
  }

  async function create() {
    if (!exam || phase !== 'config') return;

    setIsBusy(true);
    setPhase('gerando');
    setStepIndex(0);
    setPostDone(false);
    setCreatedSimulado(null);

    clearGenerationInterval();
    intervalRef.current = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, LAST_STEP));
    }, STEP_INTERVAL_MS);

    try {
      const saved = await createMockExam(buildCreatePayload(state, exam));

      addMockExam(saved);
      notify.success(t('simulado.created'), t('simulado.createdDescription', { name: saved.name ?? exam.name }));
      setCreatedSimulado(normalizeMock(saved));
      setPostDone(true);
    } catch (err) {
      clearGenerationInterval();
      setPhase('config');
      setStepIndex(0);
      setPostDone(false);
      setIsBusy(false);
      notify.error(t('toast.error'), extractMessage(err) ?? t('toast.somethingWrong'));
    }
  }

  async function start() {
    if (!createdSimulado) return;

    setIsStarting(true);
    try {
      ensureMockExamAnswers(createdSimulado.id).catch(() => {});
      const attempt = await startMockExamAttempt(createdSimulado.id);

      router.push(`/simulados/${createdSimulado.id}/tentativa/${attempt.id}`);
    } catch (err) {
      notify.error(t('toast.error'), extractMessage(err) ?? t('toast.somethingWrong'));
      setIsStarting(false);
    }
  }

  return { phase, stepIndex, isBusy, isStarting, createdSimulado, create, start, backToConfig };
}

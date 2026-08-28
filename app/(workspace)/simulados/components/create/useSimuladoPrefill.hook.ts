'use client';

import type { Exam, ExamType } from '@/shared/types';

import { useEffect, useRef } from 'react';

import { readSimuladoPrefill, writeSimuladoPrefill } from './simuladoPrefill';
import { SimuladoFormState, TimeMode } from './simuladoFormState';

interface UseSimuladoPrefillParams {
  readonly isLoading: boolean;
  readonly certifications: Exam[];
  readonly publicExams: Exam[];
  readonly onApply: (state: SimuladoFormState) => void;
}

export function useSimuladoPrefill({ isLoading, certifications, publicExams, onApply }: UseSimuladoPrefillParams) {
  const prefillApplied = useRef(false);
  const onApplyRef = useRef(onApply);

  onApplyRef.current = onApply;

  useEffect(() => {
    if (isLoading || prefillApplied.current) return;
    if (certifications.length === 0 && publicExams.length === 0) return;
    prefillApplied.current = true;
    applyPrefill();
  }, [isLoading, certifications, publicExams]);

  useEffect(() => {
    const handler = () => {
      if (!isLoading) applyPrefill();
    };

    window.addEventListener('simulado-prefill', handler);

    return () => window.removeEventListener('simulado-prefill', handler);
  }, [isLoading, certifications, publicExams]);

  function applyPrefill() {
    const prefill = readSimuladoPrefill();

    if (!prefill) return;

    const scope: ExamType = certifications.some((candidate) => candidate.id === prefill.examId)
      ? 'certification'
      : 'public_exam';
    const targetList = scope === 'certification' ? certifications : publicExams;
    const target = targetList.find((candidate) => candidate.id === prefill.examId);

    if (!target) {
      const listIsLoaded = !isLoading && targetList.length > 0;

      if (!listIsLoaded) {
        writeSimuladoPrefill(prefill);
        prefillApplied.current = false;
      }

      return;
    }

    const officialMinutes = target.examDurationMinutes ?? null;

    let timeMode: TimeMode;
    let customMinutes: number;

    if (prefill.durationMinutes === undefined) {
      timeMode = 'oficial';
      customMinutes = officialMinutes ?? 60;
    } else if (prefill.durationMinutes === null) {
      timeMode = 'livre';
      customMinutes = officialMinutes ?? 60;
    } else if (prefill.durationMinutes === officialMinutes) {
      timeMode = 'oficial';
      customMinutes = prefill.durationMinutes;
    } else {
      timeMode = 'personalizado';
      customMinutes = prefill.durationMinutes;
    }

    const selectedSections =
      prefill.sections.length > 0
        ? prefill.sections.map((section) => section.sectionName)
        : target.sections.map((section) => section.name);

    onApplyRef.current({
      name: prefill.name ?? '',
      scope,
      examId: prefill.examId,
      totalQuestions: prefill.totalQuestions,
      timeMode,
      customMinutes,
      source: prefill.questionSource,
      selectedSections,
    });
  }
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { addToast } from '@heroui/toast';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { useMockExamsContext } from '@/features/providers/mockExams.provider';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { createMockExam } from '@/features/connectors';
import { PublicExamManager } from '@/shared/components/PublicExamManager';
import { MockExamSubjectConfig } from '@/shared/types';

interface NewSimuladoTabProps {
  readonly onCreated: () => void;
}

export function NewSimuladoTab({ onCreated }: NewSimuladoTabProps) {
  const { t } = useTranslation();
  const { selectedPublicExam } = usePublicExamsContext();
  const { addMockExam } = useMockExamsContext();
  const [name, setName] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [distribution, setDistribution] = useState<MockExamSubjectConfig[]>([]);
  const { loading, request } = useRequest(createMockExam);

  useEffect(() => {
    if (!selectedPublicExam || !totalQuestions) {
      setDistribution([]);
      return;
    }
    const total = Number(totalQuestions);
    if (isNaN(total) || total <= 0) return;

    const totalMax = selectedPublicExam.subjects.reduce((acc, s) => acc + s.maxQuestions, 0);
    const suggested = selectedPublicExam.subjects.map((s) => ({
      subjectName: s.name,
      questionCount: Math.round((s.maxQuestions / totalMax) * total),
    }));

    const sum = suggested.reduce((acc, s) => acc + s.questionCount, 0);
    if (suggested.length > 0) suggested[suggested.length - 1].questionCount += total - sum;

    setDistribution(suggested);
  }, [selectedPublicExam, totalQuestions]);

  const distributedTotal = distribution.reduce((acc, s) => acc + s.questionCount, 0);
  const total = Number(totalQuestions) || 0;
  const isDistributionValid = distribution.length > 0 && distributedTotal === total;

  function handleSubjectChange(subjectName: string, value: string) {
    setDistribution((prev) =>
      prev.map((s) => (s.subjectName === subjectName ? { ...s, questionCount: Number(value) || 0 } : s)),
    );
  }

  async function handleCreate() {
    if (!selectedPublicExam?.id) return;
    const saved = await request({
      publicExamId: selectedPublicExam.id,
      name: name.trim() || undefined,
      totalQuestions: total,
      subjects: distribution,
    });

    if (saved) {
      addMockExam(saved);
      addToast({ title: t('toast.success'), description: t('simulado.pageTitle'), color: 'success' });
      onCreated();
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Input
        label={t('simulado.nameLabel')}
        placeholder={
          selectedPublicExam
            ? t('simulado.namePlaceholder', { examName: selectedPublicExam.name, count: totalQuestions || '?' })
            : ''
        }
        value={name}
        onValueChange={setName}
        variant="bordered"
        labelPlacement="outside"
        autoComplete="off"
      />

      <PublicExamManager noSubjects />

      <Input
        label={t('simulado.totalQuestions')}
        type="number"
        min={1}
        value={totalQuestions}
        onValueChange={setTotalQuestions}
        variant="bordered"
        labelPlacement="outside"
      />

      {distribution.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold">{t('simulado.distribution')}</p>
          {distribution.map((s) => (
            <div key={s.subjectName} className="flex items-center justify-between gap-4">
              <span className="text-sm flex-1">{s.subjectName}</span>
              <Input
                type="number"
                min={0}
                value={String(s.questionCount)}
                onValueChange={(v) => handleSubjectChange(s.subjectName, v)}
                variant="bordered"
                className="w-24"
                size="sm"
              />
            </div>
          ))}
          <p className={`text-xs ${isDistributionValid ? 'text-success' : 'text-danger'}`}>
            {t('simulado.distributed', { distributed: distributedTotal, total })}
          </p>
        </div>
      )}

      <Button
        color="primary"
        isLoading={loading}
        isDisabled={!selectedPublicExam || !isDistributionValid}
        onPress={handleCreate}
      >
        {t('simulado.createButton')}
      </Button>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { addToast } from '@heroui/toast';
import { Divider } from '@heroui/divider';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { useMockExamsContext } from '@/features/providers/mockExams.provider';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { createMockExam } from '@/features/connectors';
import { PublicExamManager } from '@/shared/components/PublicExamManager';
import { inputProperties } from '@/config/constants/inputStyles';
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
      prev.map((s) => (s.subjectName === subjectName ? { ...s, questionCount: Number(value) || 0 } : s))
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
    <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6">
      <PublicExamManager noSubjects className="w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          autoComplete="off"
          label={t('simulado.nameLabel')}
          placeholder={
            selectedPublicExam
              ? t('simulado.namePlaceholder', { examName: selectedPublicExam.name, count: totalQuestions || '?' })
              : ''
          }
          value={name}
          onValueChange={setName}
          {...inputProperties.input}
        />

        <Input
          label={t('simulado.totalQuestions')}
          min={1}
          type="number"
          value={totalQuestions}
          onValueChange={setTotalQuestions}
          {...inputProperties.input}
        />
      </div>

      {distribution.length > 0 && renderDistribution()}

      <div className="flex justify-end pt-2">
        <Button
          className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
          isDisabled={!selectedPublicExam || !isDistributionValid}
          isLoading={loading}
          onPress={handleCreate}
        >
          {t('simulado.createButton')}
        </Button>
      </div>
    </div>
  );

  function renderDistribution() {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col">
          <Divider />
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs font-semibold">{t('simulado.distribution')}</p>
            <span className={`text-xs font-medium ${isDistributionValid ? 'text-success' : 'text-danger'}`}>
              {t('simulado.distributed', { distributed: distributedTotal, total })}
            </span>
          </div>
        </div>
        <div className="bg-content1 border border-default-200 rounded-xl overflow-hidden">
          {distribution.map((s, i) => (
            <div
              key={s.subjectName}
              className={`flex items-center justify-between gap-4 px-4 py-3 ${i < distribution.length - 1 ? 'border-b border-default-200' : ''}`}
            >
              <span className="text-sm text-foreground flex-1">{s.subjectName}</span>
              <Input
                className="w-24 shrink-0"
                classNames={{ inputWrapper: 'h-8' }}
                min={0}
                size="sm"
                type="number"
                value={String(s.questionCount)}
                variant="bordered"
                onValueChange={(v) => handleSubjectChange(s.subjectName, v)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
}

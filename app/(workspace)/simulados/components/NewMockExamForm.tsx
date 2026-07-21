'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Divider } from '@heroui/divider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faCheck, faRotateLeft } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import usePublicExamsContext from '@/features/hooks/usePublicExamsContext.hook';
import { useMockExamsContext } from '@/features/providers/mockExams.provider';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { createMockExam, getPublicExamBrowseSummary } from '@/features/connectors';
import { PublicExamManager } from '@/shared/components/PublicExamManager';
import { notify } from '@/shared/lib/notify';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { MockExamSubjectConfig, PublicExamBrowseSummary } from '@/shared/types';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { PUBLIC_EXAMS_LOCAL_STORAGE_KEY } from '@/config/constants';

interface NewMockExamFormProps {
  readonly onCreated: () => void;
}

interface LocalSubjectEntry extends MockExamSubjectConfig {
  isTemporary?: boolean;
}

export function NewMockExamForm({ onCreated }: NewMockExamFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { publicExams, isLoading: isExamsLoading, selectedPublicExam } = usePublicExamsContext();
  const { addMockExam } = useMockExamsContext();
  const [name, setName] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [distribution, setDistribution] = useState<LocalSubjectEntry[]>([]);
  const [originalDistribution, setOriginalDistribution] = useState<LocalSubjectEntry[]>([]);
  const [totalSavedQuestions, setTotalSavedQuestions] = useState<number | null>(null);
  const [browseSummary, setBrowseSummary] = useState<PublicExamBrowseSummary | null>(null);
  const [availableCounts, setAvailableCounts] = useState<Record<string, number>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCount, setNewSubjectCount] = useState('');
  const { loading, request } = useRequest(createMockExam);

  useEffect(() => {
    if (isExamsLoading || publicExams.length === 0) return;
    getPublicExamBrowseSummary()
      .then((data) => {
        const total = data.publicExams.reduce((acc, e) => acc + e.totalCount, 0);

        setTotalSavedQuestions(total);
        setBrowseSummary(data);
      })
      .catch(() => setTotalSavedQuestions(0));
  }, [isExamsLoading, publicExams.length]);

  useEffect(() => {
    if (!selectedPublicExam || !browseSummary) {
      setAvailableCounts({});

      return;
    }
    const examData = browseSummary.publicExams.find((e) => e.id === selectedPublicExam.id);

    if (!examData) {
      setAvailableCounts({});

      return;
    }
    const counts: Record<string, number> = {};

    examData.subjects.forEach((s) => {
      counts[s.name] = s.questionCount;
    });
    setAvailableCounts(counts);
  }, [selectedPublicExam, browseSummary]);

  useEffect(() => {
    if (!selectedPublicExam || !totalQuestions) {
      setDistribution([]);

      return;
    }
    const total = Number(totalQuestions);

    if (isNaN(total) || total <= 0) return;

    const totalMax = selectedPublicExam.subjects.reduce((acc, s) => acc + s.maxQuestions, 0);
    const suggested: LocalSubjectEntry[] = selectedPublicExam.subjects.map((s) => ({
      subjectName: s.name,
      questionCount: totalMax > 0 ? Math.round((s.maxQuestions / totalMax) * total) : 0,
    }));

    const sum = suggested.reduce((acc, entry) => acc + entry.questionCount, 0);

    if (suggested.length > 0) suggested[suggested.length - 1].questionCount += total - sum;

    setDistribution(suggested);
    setOriginalDistribution(suggested.map((entry) => ({ ...entry })));
    setShowAddForm(false);
  }, [selectedPublicExam, totalQuestions]);

  if (isExamsLoading || (publicExams.length > 0 && totalSavedQuestions === null)) {
    return <SkeletonListLoader count={3} height="h-12" />;
  }

  if (publicExams.length === 0) {
    return (
      <EmptyState
        action={{ href: '/public-exams/configure', label: t('concurso.tabNew') }}
        description={t('concurso.noExamsDescription')}
        title={t('concurso.noExamsTitle')}
      />
    );
  }

  if (totalSavedQuestions === 0) {
    return (
      <EmptyState
        action={{ href: '/public-exams/questions', label: t('simulado.noQuestionsGoToQuestions') }}
        description={t('simulado.noQuestionsDescription')}
        title={t('simulado.noQuestionsTitle')}
      />
    );
  }

  const distributedTotal = distribution.reduce((acc, entry) => acc + entry.questionCount, 0);
  const total = Number(totalQuestions) || 0;
  const isDistributionValid = distribution.length > 0 && distributedTotal === total;
  const isDistributionModified =
    distribution.length !== originalDistribution.length ||
    distribution.some((entry, i) => {
      const original = originalDistribution[i];

      return !original || original.subjectName !== entry.subjectName || original.questionCount !== entry.questionCount;
    });

  function handleResetDistribution() {
    setDistribution(originalDistribution.map((entry) => ({ ...entry })));
    setShowAddForm(false);
  }

  function handleSubjectChange(subjectName: string, value: string) {
    setDistribution((prev) =>
      prev.map((entry) => (entry.subjectName === subjectName ? { ...entry, questionCount: Number(value) || 0 } : entry)),
    );
  }

  function handleRemoveSubject(subjectName: string) {
    setDistribution((prev) => prev.filter((entry) => entry.subjectName !== subjectName));
  }

  function handleAddSubject() {
    const subjectName = newSubjectName.trim();
    const count = Number(newSubjectCount) || 0;

    if (!subjectName) return;
    setDistribution((prev) => [...prev, { subjectName, questionCount: count, isTemporary: true }]);
    setNewSubjectName('');
    setNewSubjectCount('');
    setShowAddForm(false);
  }

  async function handleCreate() {
    if (!selectedPublicExam?.id) return;
    const saved = await request({
      publicExamId: selectedPublicExam.id,
      name: name.trim() || undefined,
      totalQuestions: total,
      subjects: distribution.map(({ subjectName, questionCount }) => ({ subjectName, questionCount })),
    });

    if (saved) {
      addMockExam(saved);
      notify.success(
        t('simulado.created'),
        t('simulado.createdDescription', { name: saved.name ?? selectedPublicExam.name }),
      );
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
              : t('simulado.nameFallbackPlaceholder')
          }
          value={name}
          onValueChange={setName}
          {...inputProperties.input}
        />

        <Input
          label={t('simulado.totalQuestions')}
          min={1}
          placeholder={t('simulado.totalQuestionsPlaceholder')}
          type="number"
          value={totalQuestions}
          onValueChange={setTotalQuestions}
          {...inputProperties.input}
        />
      </div>

      {distribution.length > 0 && renderDistribution()}

      <div className="flex justify-end pt-2">
        <Button
          className={buttonStyles.primary}
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
            <div className="flex items-center gap-3">
              {isDistributionModified && (
                <Button className={buttonStyles.flat} size="sm" onPress={handleResetDistribution}>
                  <FontAwesomeIcon icon={faRotateLeft} />
                  {t('simulado.resetDistribution')}
                </Button>
              )}
              <span className={`text-xs font-medium ${isDistributionValid ? 'text-success' : 'text-danger'}`}>
                {t('simulado.distributed', { distributed: distributedTotal, total })}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-content1 border border-default-200 rounded-xl overflow-hidden">
          {distribution.map((entry, i) => {
            const available = entry.isTemporary ? undefined : availableCounts[entry.subjectName];
            const isInsufficient = !entry.isTemporary && (available === undefined || entry.questionCount > available);
            const isLast = i === distribution.length - 1;

            return (
              <div
                key={entry.subjectName}
                className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-default-200' : ''} ${isInsufficient ? 'border-l-2 border-l-danger bg-danger/5' : ''}`}
              >
                <span className="text-sm text-foreground flex-1 min-w-0 truncate">{entry.subjectName}</span>
                <span className={`text-xs shrink-0 ${isInsufficient ? 'text-danger' : 'text-default-400'}`}>
                  {t('simulado.availableQuestions', { count: available ?? 0 })}
                </span>
                {isInsufficient && (
                  <Button
                    className={buttonStyles.primarySm}
                    size="sm"
                    onPress={() => {
                      try {
                        const current = JSON.parse(localStorage.getItem(PUBLIC_EXAMS_LOCAL_STORAGE_KEY) ?? '{}');

                        localStorage.setItem(
                          PUBLIC_EXAMS_LOCAL_STORAGE_KEY,
                          JSON.stringify({ ...current, selectedPublicExam, selectedSubjects: [entry.subjectName] }),
                        );
                      } catch {}
                      router.push('/public-exams/questions?tab=generate');
                    }}
                  >
                    {t('simulado.generateMissing')}
                  </Button>
                )}
                <Input
                  className="w-20 shrink-0"
                  classNames={{ inputWrapper: 'h-8' }}
                  min={0}
                  size="sm"
                  type="number"
                  value={String(entry.questionCount)}
                  variant="bordered"
                  onValueChange={(v) => handleSubjectChange(entry.subjectName, v)}
                />
                <Button
                  isIconOnly
                  aria-label={t('simulado.removeTopicAriaLabel')}
                  className={buttonStyles.iconOnly.danger}
                  isDisabled={distribution.length <= 1}
                  size="sm"
                  variant="light"
                  onPress={() => handleRemoveSubject(entry.subjectName)}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </Button>
              </div>
            );
          })}
          {renderAddSubjectRow()}
        </div>
      </div>
    );
  }

  function renderAddSubjectRow() {
    if (!showAddForm) {
      return (
        <div className="px-4 py-3 border-t border-default-200">
          <Button className={buttonStyles.flat} size="sm" onPress={() => setShowAddForm(true)}>
            {t('simulado.addTemporaryTopic')}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-end gap-3 px-4 py-3 border-t border-default-200">
        <Input
          className="flex-1"
          label={t('simulado.temporaryTopicName')}
          placeholder={t('simulado.temporaryTopicNamePlaceholder')}
          size="sm"
          value={newSubjectName}
          onValueChange={setNewSubjectName}
          {...inputProperties.input}
        />
        <Input
          className="w-28 shrink-0"
          label={t('simulado.temporaryTopicCount')}
          min={0}
          placeholder={t('simulado.temporaryTopicCountPlaceholder')}
          size="sm"
          type="number"
          value={newSubjectCount}
          onValueChange={setNewSubjectCount}
          {...inputProperties.input}
        />
        <div className="flex gap-1 shrink-0 pb-1">
          <Button
            isIconOnly
            aria-label={t('common.save')}
            className={buttonStyles.iconOnly.primary}
            size="sm"
            onPress={handleAddSubject}
          >
            <FontAwesomeIcon icon={faCheck} />
          </Button>
          <Button
            isIconOnly
            aria-label={t('common.cancel')}
            className={buttonStyles.iconOnly.neutral}
            size="sm"
            variant="light"
            onPress={() => {
              setShowAddForm(false);
              setNewSubjectName('');
              setNewSubjectCount('');
            }}
          >
            <FontAwesomeIcon icon={faXmark} />
          </Button>
        </div>
      </div>
    );
  }
}

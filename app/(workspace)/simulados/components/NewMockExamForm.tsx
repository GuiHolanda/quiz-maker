'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Divider } from '@heroui/divider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faCheck, faRotateLeft } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { useMockExamsContext } from '@/features/providers/mockExams.provider';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { createMockExam, getBrowseSummary } from '@/features/connectors';
import { EntitySelect } from '@/shared/components/EntitySelect';
import { notify } from '@/shared/lib/notify';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { Exam, MockExamSectionConfig, BrowseSummary } from '@/shared/types';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { EXAMS_LOCAL_STORAGE_KEY, SIMULADO_NEW_PREFILL_KEY } from '@/config/constants';

interface NewMockExamFormProps {
  readonly onCreated: () => void;
}

interface LocalSectionEntry extends MockExamSectionConfig {
  isTemporary?: boolean;
}

function referenceName(exam: Exam): string {
  return exam.provider?.name ?? exam.examBoard?.name ?? '';
}

export function NewMockExamForm({ onCreated }: NewMockExamFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { exams, isLoading: isExamsLoading, selectedExam, selectExam } = useExamsContext();
  const { addMockExam } = useMockExamsContext();
  const [name, setName] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [distribution, setDistribution] = useState<LocalSectionEntry[]>([]);
  const [originalDistribution, setOriginalDistribution] = useState<LocalSectionEntry[]>([]);
  const [totalSavedQuestions, setTotalSavedQuestions] = useState<number | null>(null);
  const [browseSummary, setBrowseSummary] = useState<BrowseSummary | null>(null);
  const [availableCounts, setAvailableCounts] = useState<Record<string, number>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionCount, setNewSectionCount] = useState('');
  const { loading, request } = useRequest(createMockExam);

  useEffect(() => {
    if (isExamsLoading || exams.length === 0) return;
    try {
      const raw = localStorage.getItem(SIMULADO_NEW_PREFILL_KEY);
      if (raw) {
        const prefill = JSON.parse(raw);
        if (prefill.examId) {
          const exam = exams.find((e) => e.id === prefill.examId);
          if (exam) {
            selectExam(exam);
            if (prefill.totalQuestions) setTotalQuestions(String(prefill.totalQuestions));
          }
        }
        localStorage.removeItem(SIMULADO_NEW_PREFILL_KEY);
      }
    } catch {}
  }, [isExamsLoading, exams, selectExam]);

  useEffect(() => {
    if (isExamsLoading || exams.length === 0) return;
    getBrowseSummary()
      .then((data) => {
        const total = data.exams.reduce((acc, e) => acc + e.totalCount, 0);

        setTotalSavedQuestions(total);
        setBrowseSummary(data);
      })
      .catch(() => setTotalSavedQuestions(0));
  }, [isExamsLoading, exams.length]);

  useEffect(() => {
    if (!selectedExam || !browseSummary) {
      setAvailableCounts({});

      return;
    }
    const examData = browseSummary.exams.find((e) => e.id === selectedExam.id);

    if (!examData) {
      setAvailableCounts({});

      return;
    }
    const counts: Record<string, number> = {};

    examData.sections.forEach((s) => {
      counts[s.name] = s.questionCount;
    });
    setAvailableCounts(counts);
  }, [selectedExam, browseSummary]);

  useEffect(() => {
    if (!selectedExam || !totalQuestions) {
      setDistribution([]);

      return;
    }
    const total = Number(totalQuestions);

    if (isNaN(total) || total <= 0) return;

    const totalMax = selectedExam.sections.reduce((acc, s) => acc + s.maxQuestions, 0);
    const suggested: LocalSectionEntry[] = selectedExam.sections.map((s) => ({
      sectionName: s.name,
      questionCount: totalMax > 0 ? Math.round((s.maxQuestions / totalMax) * total) : 0,
    }));

    const sum = suggested.reduce((acc, entry) => acc + entry.questionCount, 0);

    if (suggested.length > 0) suggested[suggested.length - 1].questionCount += total - sum;

    setDistribution(suggested);
    setOriginalDistribution(suggested.map((entry) => ({ ...entry })));
    setShowAddForm(false);
  }, [selectedExam, totalQuestions]);

  if (isExamsLoading || (exams.length > 0 && totalSavedQuestions === null)) {
    return <SkeletonListLoader count={3} height="h-12" />;
  }

  if (exams.length === 0) {
    return (
      <EmptyState
        action={{ href: '/exams?type=public_exam', label: t('exam.tabNew') }}
        description={t('exam.noExamsDescription')}
        title={t('exam.noExamsTitle')}
      />
    );
  }

  if (totalSavedQuestions === 0) {
    return (
      <EmptyState
        action={{ href: '/questions', label: t('simulado.noQuestionsGoToQuestions') }}
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

      return !original || original.sectionName !== entry.sectionName || original.questionCount !== entry.questionCount;
    });

  function handleResetDistribution() {
    setDistribution(originalDistribution.map((entry) => ({ ...entry })));
    setShowAddForm(false);
  }

  function handleSectionChange(sectionName: string, value: string) {
    setDistribution((prev) =>
      prev.map((entry) => (entry.sectionName === sectionName ? { ...entry, questionCount: Number(value) || 0 } : entry))
    );
  }

  function handleRemoveSection(sectionName: string) {
    setDistribution((prev) => prev.filter((entry) => entry.sectionName !== sectionName));
  }

  function handleAddSection() {
    const sectionName = newSectionName.trim();
    const count = Number(newSectionCount) || 0;

    if (!sectionName) return;
    setDistribution((prev) => [...prev, { sectionName, questionCount: count, isTemporary: true }]);
    setNewSectionName('');
    setNewSectionCount('');
    setShowAddForm(false);
  }

  async function handleCreate() {
    if (!selectedExam?.id) return;
    const saved = await request({
      examId: selectedExam.id,
      name: name.trim() || undefined,
      totalQuestions: total,
      sections: distribution.map(({ sectionName, questionCount }) => ({ sectionName, questionCount })),
    });

    if (saved) {
      addMockExam(saved);
      notify.success(
        t('simulado.created'),
        t('simulado.createdDescription', { name: saved.name ?? selectedExam.name })
      );
      onCreated();
    }
  }

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6">
      <EntitySelect
        className="w-full"
        items={exams.map((e) => ({
          key: e.id ?? e.name,
          label: [e.name, e.role, referenceName(e)].filter(Boolean).join(' · '),
        }))}
        label={t('exam.selectExam')}
        name="examName"
        placeholder={t('exam.selectExamPlaceholder')}
        selectedKey={selectedExam ? (selectedExam.id ?? selectedExam.name) : null}
        onSelect={(key) => selectExam(exams.find((e) => (e.id ?? e.name) === key) ?? null)}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          autoComplete="off"
          label={t('simulado.nameLabel')}
          placeholder={
            selectedExam
              ? t('simulado.namePlaceholder', { examName: selectedExam.name, count: totalQuestions || '?' })
              : t('simulado.nameFallbackPlaceholder')
          }
          value={name}
          onValueChange={setName}
          {...inputProperties.input}
        />

        <Input
          data-testid="simulado-total-input"
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
          data-testid="simulado-create-btn"
          className={buttonStyles.primary}
          isDisabled={!selectedExam || !isDistributionValid}
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
            const available = entry.isTemporary ? undefined : availableCounts[entry.sectionName];
            const isInsufficient = !entry.isTemporary && (available === undefined || entry.questionCount > available);
            const isLast = i === distribution.length - 1;

            return (
              <div
                key={entry.sectionName}
                className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-default-200' : ''} ${isInsufficient ? 'border border-danger bg-danger/5 rounded-lg' : ''}`}
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm text-foreground truncate">{entry.sectionName}</span>
                  {!entry.isTemporary && (
                    <span className={`text-xs ${isInsufficient ? 'text-danger' : 'text-default-400'}`}>
                      {t('simulado.availableQuestions', { count: available ?? 0 })}
                    </span>
                  )}
                </div>
                {isInsufficient && (
                  <Button
                    className={buttonStyles.primarySm}
                    size="sm"
                    onPress={() => {
                      try {
                        const current = JSON.parse(localStorage.getItem(EXAMS_LOCAL_STORAGE_KEY) ?? '{}');

                        localStorage.setItem(
                          EXAMS_LOCAL_STORAGE_KEY,
                          JSON.stringify({ ...current, selectedExam, selectedSections: [entry.sectionName] })
                        );
                      } catch {}
                      router.push('/questions');
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
                  onValueChange={(v) => handleSectionChange(entry.sectionName, v)}
                />
                <Button
                  isIconOnly
                  aria-label={t('simulado.removeTopicAriaLabel')}
                  className={buttonStyles.iconOnly.danger}
                  isDisabled={distribution.length <= 1}
                  size="sm"
                  variant="light"
                  onPress={() => handleRemoveSection(entry.sectionName)}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </Button>
              </div>
            );
          })}
          {renderAddSectionRow()}
        </div>
      </div>
    );
  }

  function renderAddSectionRow() {
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
          value={newSectionName}
          onValueChange={setNewSectionName}
          {...inputProperties.input}
        />
        <Input
          className="w-28 shrink-0"
          label={t('simulado.temporaryTopicCount')}
          min={0}
          placeholder={t('simulado.temporaryTopicCountPlaceholder')}
          size="sm"
          type="number"
          value={newSectionCount}
          onValueChange={setNewSectionCount}
          {...inputProperties.input}
        />
        <div className="flex gap-1 shrink-0 pb-1">
          <Button
            isIconOnly
            aria-label={t('common.save')}
            className={buttonStyles.iconOnly.primary}
            size="sm"
            onPress={handleAddSection}
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
              setNewSectionName('');
              setNewSectionCount('');
            }}
          >
            <FontAwesomeIcon icon={faXmark} />
          </Button>
        </div>
      </div>
    );
  }
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Divider } from '@heroui/divider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faCheck, faRotateLeft } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useCertSimuladosContext } from '@/features/providers/certSimulados.provider';
import { useCertificationsContext } from '@/features/hooks/useCertificationsContext.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { createCertSimulado, getBrowseSummary } from '@/features/connectors';
import { notify } from '@/shared/lib/notify';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { CertSimuladoTopicConfig, Certification, BrowseSummary } from '@/shared/types';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { CERTIFICATIONS_LOCAL_STORAGE_KEY, SIMULADO_NEW_PREFILL_KEY } from '@/config/constants';

interface NewCertSimuladoFormProps {
  readonly onCreated: () => void;
}

interface LocalTopicEntry extends CertSimuladoTopicConfig {
  isTemporary?: boolean;
}

export function NewCertSimuladoForm({ onCreated }: NewCertSimuladoFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { certifications, isLoading: isCertsLoading } = useCertificationsContext();
  const { addSimulado } = useCertSimuladosContext();
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [name, setName] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [distribution, setDistribution] = useState<LocalTopicEntry[]>([]);
  const [totalSavedQuestions, setTotalSavedQuestions] = useState<number | null>(null);
  const [browseSummary, setBrowseSummary] = useState<BrowseSummary | null>(null);
  const [availableCounts, setAvailableCounts] = useState<Record<string, number>>({});
  const [originalDistribution, setOriginalDistribution] = useState<LocalTopicEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicCount, setNewTopicCount] = useState('');
  const { loading, request } = useRequest(createCertSimulado);

  useEffect(() => {
    if (isCertsLoading || certifications.length === 0) return;
    try {
      const raw = localStorage.getItem(SIMULADO_NEW_PREFILL_KEY);
      if (raw) {
        const prefill = JSON.parse(raw);
        if (prefill.type === 'certification' && prefill.certKey) {
          const cert = certifications.find((c) => c.key === prefill.certKey);
          if (cert) {
            setSelectedCert(cert);
            if (prefill.totalQuestions) setTotalQuestions(String(prefill.totalQuestions));
          }
        }
        localStorage.removeItem(SIMULADO_NEW_PREFILL_KEY);
      }
    } catch {}
  }, [isCertsLoading, certifications]);

  useEffect(() => {
    if (isCertsLoading || certifications.length === 0) return;
    getBrowseSummary()
      .then((data) => {
        const total = data.certifications.reduce((acc, c) => acc + c.totalCount, 0);

        setTotalSavedQuestions(total);
        setBrowseSummary(data);
      })
      .catch(() => setTotalSavedQuestions(0));
  }, [isCertsLoading, certifications.length]);

  useEffect(() => {
    if (!selectedCert || !browseSummary) {
      setAvailableCounts({});

      return;
    }
    const certData = browseSummary.certifications.find((c) => c.key === selectedCert.key);

    if (!certData) {
      setAvailableCounts({});

      return;
    }
    const counts: Record<string, number> = {};

    certData.topics.forEach((topic) => {
      counts[topic.name] = topic.questionCount;
    });
    setAvailableCounts(counts);
  }, [selectedCert, browseSummary]);

  useEffect(() => {
    if (!selectedCert || !totalQuestions) {
      setDistribution([]);

      return;
    }
    const total = Number(totalQuestions);

    if (isNaN(total) || total <= 0) return;

    const totalMax = selectedCert.topics.reduce((acc, topic) => acc + topic.maxQuestions, 0);
    const suggested: LocalTopicEntry[] = selectedCert.topics.map((topic) => ({
      topicName: topic.name,
      questionCount: totalMax > 0 ? Math.round((topic.maxQuestions / totalMax) * total) : 0,
    }));

    const sum = suggested.reduce((acc, entry) => acc + entry.questionCount, 0);

    if (suggested.length > 0) suggested[suggested.length - 1].questionCount += total - sum;

    setDistribution(suggested);
    setOriginalDistribution(suggested.map((entry) => ({ ...entry })));
    setShowAddForm(false);
  }, [selectedCert, totalQuestions]);

  if (isCertsLoading || (certifications.length > 0 && totalSavedQuestions === null)) {
    return <SkeletonListLoader count={3} height="h-12" />;
  }

  if (certifications.length === 0) {
    return (
      <EmptyState
        action={{ href: '/certifications/configure', label: t('certification.tabNew') }}
        description={t('certification.noCertificationsDescription')}
        title={t('certification.noCertificationsTitle')}
      />
    );
  }

  if (totalSavedQuestions === 0) {
    return (
      <EmptyState
        action={{ href: '/questions?type=certification', label: t('simulado.noQuestionsGoToQuestions') }}
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

      return !original || original.topicName !== entry.topicName || original.questionCount !== entry.questionCount;
    });

  async function handleCreate() {
    if (!selectedCert) return;
    const saved = await request({
      certKey: selectedCert.key,
      name: name.trim() || undefined,
      topics: distribution.map(({ topicName, questionCount }) => ({ topicName, questionCount })),
    });

    if (saved) {
      addSimulado(saved);
      notify.success(
        t('simulado.created'),
        t('simulado.createdDescription', { name: saved.name ?? selectedCert.label }),
      );
      onCreated();
    }
  }

  function handleResetDistribution() {
    setDistribution(originalDistribution.map((entry) => ({ ...entry })));
    setShowAddForm(false);
  }

  function handleTopicChange(topicName: string, value: string) {
    setDistribution((prev) =>
      prev.map((entry) => (entry.topicName === topicName ? { ...entry, questionCount: Number(value) || 0 } : entry)),
    );
  }

  function handleRemoveTopic(topicName: string) {
    setDistribution((prev) => prev.filter((entry) => entry.topicName !== topicName));
  }

  function handleAddTopic() {
    const topicName = newTopicName.trim();
    const count = Number(newTopicCount) || 0;

    if (!topicName) return;
    setDistribution((prev) => [...prev, { topicName, questionCount: count, isTemporary: true }]);
    setNewTopicName('');
    setNewTopicCount('');
    setShowAddForm(false);
  }

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6">
      <Select
        label={t('certification.selectCertification')}
        placeholder={t('certification.selectCertificationPlaceholder')}
        selectedKeys={selectedCert ? [selectedCert.key] : []}
        onSelectionChange={(keys) => {
          const key = Array.from(keys)[0] as string;

          setSelectedCert(certifications.find((c) => c.key === key) ?? null);
        }}
        {...inputProperties.select}
      >
        {certifications.map((c) => (
          <SelectItem key={c.key}>{c.label}</SelectItem>
        ))}
      </Select>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          autoComplete="off"
          label={t('simulado.nameLabel')}
          placeholder={
            selectedCert
              ? t('simulado.namePlaceholder', { examName: selectedCert.label, count: totalQuestions || '?' })
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
          isDisabled={!selectedCert || !isDistributionValid}
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
            <p className="text-xs font-semibold">{t('simulado.distributionByTopic')}</p>
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
            const available = entry.isTemporary ? undefined : availableCounts[entry.topicName];
            const isInsufficient = !entry.isTemporary && (available === undefined || entry.questionCount > available);
            const isLast = i === distribution.length - 1;

            return (
              <div
                key={entry.topicName}
                className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-default-200' : ''} ${isInsufficient ? 'border border-danger bg-danger/5 rounded-lg' : ''}`}
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm text-foreground truncate">{entry.topicName}</span>
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
                        const current = JSON.parse(localStorage.getItem(CERTIFICATIONS_LOCAL_STORAGE_KEY) ?? '{}');

                        localStorage.setItem(
                          CERTIFICATIONS_LOCAL_STORAGE_KEY,
                          JSON.stringify({
                            ...current,
                            selectedCertification: selectedCert,
                            selectedTopics: [entry.topicName],
                          }),
                        );
                      } catch {}
                      router.push('/questions?type=certification');
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
                  onValueChange={(v) => handleTopicChange(entry.topicName, v)}
                />
                <Button
                  isIconOnly
                  aria-label={t('simulado.removeTopicAriaLabel')}
                  className={buttonStyles.iconOnly.danger}
                  isDisabled={distribution.length <= 1}
                  size="sm"
                  variant="light"
                  onPress={() => handleRemoveTopic(entry.topicName)}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </Button>
              </div>
            );
          })}
          {renderAddTopicRow()}
        </div>
      </div>
    );
  }

  function renderAddTopicRow() {
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
          value={newTopicName}
          onValueChange={setNewTopicName}
          {...inputProperties.input}
        />
        <Input
          className="w-28 shrink-0"
          label={t('simulado.temporaryTopicCount')}
          min={0}
          placeholder={t('simulado.temporaryTopicCountPlaceholder')}
          size="sm"
          type="number"
          value={newTopicCount}
          onValueChange={setNewTopicCount}
          {...inputProperties.input}
        />
        <div className="flex gap-1 shrink-0 pb-1">
          <Button
            isIconOnly
            aria-label={t('common.save')}
            className={buttonStyles.iconOnly.primary}
            size="sm"
            onPress={handleAddTopic}
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
              setNewTopicName('');
              setNewTopicCount('');
            }}
          >
            <FontAwesomeIcon icon={faXmark} />
          </Button>
        </div>
      </div>
    );
  }
}

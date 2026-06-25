'use client';

import { useEffect, useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Divider } from '@heroui/divider';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useCertSimuladosContext } from '@/features/providers/certSimulados.provider';
import { useCertificationsContext } from '@/features/hooks/useCertificationsContext.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { createCertSimulado } from '@/features/connectors';
import { notify } from '@/shared/lib/notify';
import { inputProperties } from '@/config/constants/inputStyles';
import { CertSimuladoTopicConfig, Certification } from '@/shared/types';

interface NewSimuladoTabProps {
  readonly onCreated: () => void;
}

export function NewSimuladoTab({ onCreated }: NewSimuladoTabProps) {
  const { t } = useTranslation();
  const { certifications } = useCertificationsContext();
  const { addSimulado } = useCertSimuladosContext();
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [name, setName] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [distribution, setDistribution] = useState<CertSimuladoTopicConfig[]>([]);
  const { loading, request } = useRequest(createCertSimulado);

  useEffect(() => {
    if (!selectedCert || !totalQuestions) {
      setDistribution([]);
      return;
    }
    const total = Number(totalQuestions);

    if (isNaN(total) || total <= 0) return;

    const totalMax = selectedCert.topics.reduce((acc, t) => acc + t.maxQuestions, 0);
    const suggested = selectedCert.topics.map((topic) => ({
      topicName: topic.name,
      questionCount: totalMax > 0 ? Math.round((topic.maxQuestions / totalMax) * total) : 0,
    }));

    const sum = suggested.reduce((acc, s) => acc + s.questionCount, 0);

    if (suggested.length > 0) suggested[suggested.length - 1].questionCount += total - sum;

    setDistribution(suggested);
  }, [selectedCert, totalQuestions]);

  const distributedTotal = distribution.reduce((acc, s) => acc + s.questionCount, 0);
  const total = Number(totalQuestions) || 0;
  const isDistributionValid = distribution.length > 0 && distributedTotal === total;

  function handleTopicChange(topicName: string, value: string) {
    setDistribution((prev) =>
      prev.map((s) => (s.topicName === topicName ? { ...s, questionCount: Number(value) || 0 } : s))
    );
  }

  async function handleCreate() {
    if (!selectedCert) return;
    const saved = await request({
      certKey: selectedCert.key,
      name: name.trim() || undefined,
      topics: distribution,
    });

    if (saved) {
      addSimulado(saved);
      notify.success(
        t('simulado.created'),
        t('simulado.createdDescription', { name: saved.name ?? selectedCert.label })
      );
      onCreated();
    }
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
          className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
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
            <span className={`text-xs font-medium ${isDistributionValid ? 'text-success' : 'text-danger'}`}>
              {t('simulado.distributed', { distributed: distributedTotal, total })}
            </span>
          </div>
        </div>
        <div className="bg-content1 border border-default-200 rounded-xl overflow-hidden">
          {distribution.map((s, i) => (
            <div
              key={s.topicName}
              className={`flex items-center justify-between gap-4 px-4 py-3 ${
                i < distribution.length - 1 ? 'border-b border-default-200' : ''
              }`}
            >
              <span className="text-sm text-foreground flex-1">{s.topicName}</span>
              <Input
                className="w-24 shrink-0"
                classNames={{ inputWrapper: 'h-8' }}
                min={0}
                size="sm"
                type="number"
                value={String(s.questionCount)}
                variant="bordered"
                onValueChange={(v) => handleTopicChange(s.topicName, v)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
}

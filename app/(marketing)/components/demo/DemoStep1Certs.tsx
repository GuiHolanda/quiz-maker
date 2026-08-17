'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DemoCatalogExam } from '@/shared/types';
import { DemoCertCard } from './DemoCertCard';
import { DemoStickyBar } from './DemoStickyBar';
import { DemoStepHeader } from './DemoStepHeader';

interface DemoStep1CertsProps {
  readonly exams: readonly DemoCatalogExam[];
  readonly onSelect: (examId: string) => void;
}

const ALL_VENDORS = '__all__';

export function DemoStep1Certs({ exams, onSelect }: DemoStep1CertsProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeVendor, setActiveVendor] = useState<string>(ALL_VENDORS);

  // The catalog has no track taxonomy, so the vendor — which is real data —
  // is what the filter offers.
  const vendors = useMemo(() => {
    const unique = new Set(exams.map((exam) => exam.vendor).filter(Boolean));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [exams]);

  const filtered = activeVendor === ALL_VENDORS ? exams : exams.filter((exam) => exam.vendor === activeVendor);
  const selectedExam = selectedId ? (exams.find((exam) => exam.id === selectedId) ?? null) : null;

  function handleCardClick(examId: string) {
    setSelectedId((prev) => (prev === examId ? null : examId));
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="max-w-xl">
          <DemoStepHeader
            kick={t('demo.step1.kick')}
            heading={t('demo.step1.heading')}
            subtext={t('demo.step1.subtext')}
          />
        </div>
        <div className="mono text-xs text-mkt-text md:text-right mt-2 space-y-0.5">
          <div className="text-mkt-accent">01 EXAME</div>
          <div className="opacity-30">02 TÓPICOS</div>
          <div className="opacity-30">03 QUESTÕES</div>
        </div>
      </div>

      {vendors.length > 1 && (
        <div className="max-w-7xl mx-auto px-6 mb-6 flex gap-2 flex-wrap">
          {[ALL_VENDORS, ...vendors].map((vendor) => (
            <button
              key={vendor}
              onClick={() => setActiveVendor(vendor)}
              className={`mono text-xs uppercase tracking-widest px-3 py-1.5 border transition-colors ${
                activeVendor === vendor
                  ? 'bg-mkt-accent text-white border-mkt-accent'
                  : 'bg-transparent text-mkt-text border-mkt-divider opacity-60 hover:opacity-100'
              }`}
            >
              {vendor === ALL_VENDORS ? t('demo.step1.filterAll') : vendor}
            </button>
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map((exam) => (
          <DemoCertCard
            key={exam.id}
            exam={exam}
            isSelected={selectedId === exam.id}
            onSelect={() => handleCardClick(exam.id)}
          />
        ))}
      </div>

      <DemoStickyBar
        leftLabel={selectedExam ? selectedExam.name : t('demo.step1.stickyPlaceholder')}
        leftAccent={!!selectedExam}
        rightHint={t('demo.step1.stickyHint')}
        buttonLabel={t('demo.step1.continueBtn')}
        buttonDisabled={!selectedId}
        onAction={() => {
          if (selectedId) onSelect(selectedId);
        }}
      />
    </div>
  );
}

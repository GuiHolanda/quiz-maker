'use client';

import { useState } from 'react';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { DEMO_CATALOG } from './data/demoCatalog';
import { DemoCertCard } from './DemoCertCard';
import { DemoStickyBar } from './DemoStickyBar';

interface DemoStep1CertsProps {
  readonly onSelect: (certId: string) => void;
}

const ALL_TRACKS = ['Todos', 'Cloud', 'Ágil', 'Segurança', 'DevOps'] as const;

export function DemoStep1Certs({ onSelect }: DemoStep1CertsProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTrack, setActiveTrack] = useState<string>('Todos');

  const filtered =
    activeTrack === 'Todos' ? DEMO_CATALOG : DEMO_CATALOG.filter((cert) => cert.track === activeTrack);

  const selectedCert = selectedId ? (DEMO_CATALOG.find((cert) => cert.id === selectedId) ?? null) : null;

  function handleCardClick(certId: string) {
    setSelectedId((prev) => (prev === certId ? null : certId));
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="max-w-xl">
          <span className="kick">{t('demo.step1.kick')}</span>
          <h1 className="ds-heading text-mkt-text text-4xl mt-2">{t('demo.step1.heading')}</h1>
          <p className="text-mkt-text opacity-60 text-sm mt-3">{t('demo.step1.subtext')}</p>
        </div>
        <div className="mono text-xs text-mkt-text md:text-right mt-2 space-y-0.5">
          <div className="text-mkt-accent">01 EXAME</div>
          <div className="opacity-30">02 TÓPICOS</div>
          <div className="opacity-30">03 QUESTÕES</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="max-w-6xl mx-auto px-6 mb-6 flex gap-2 flex-wrap">
        {ALL_TRACKS.map((track) => (
          <button
            key={track}
            onClick={() => setActiveTrack(track)}
            className={`mono text-xs uppercase tracking-widest px-3 py-1.5 border transition-colors ${
              activeTrack === track
                ? 'bg-mkt-accent text-white border-mkt-accent'
                : 'bg-transparent text-mkt-text border-mkt-divider opacity-60 hover:opacity-100'
            }`}
          >
            {track}
          </button>
        ))}
      </div>

      {/* Cert grid */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((cert) => (
          <DemoCertCard
            key={cert.id}
            cert={cert}
            isSelected={selectedId === cert.id}
            onSelect={() => handleCardClick(cert.id)}
          />
        ))}
      </div>

      <DemoStickyBar
        leftLabel={selectedCert ? selectedCert.name : t('demo.step1.stickyPlaceholder')}
        leftAccent={!!selectedCert}
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

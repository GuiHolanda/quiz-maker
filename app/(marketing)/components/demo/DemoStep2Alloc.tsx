'use client';

import { useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines, faClock, faCircleCheck, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DemoCert } from './data/demoCatalog';
import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';

interface DemoStep2AllocProps {
  readonly cert: DemoCert;
  readonly onGenerate: (alloc: Record<string, number>) => void;
  readonly onBack: () => void;
}

const TOTAL = 10;

function autoDistribute(
  domains: ReadonlyArray<{ readonly name: string; readonly weight: number }>,
): Record<string, number> {
  const weightSum = domains.reduce((sum, domain) => sum + domain.weight, 0);
  if (weightSum === 0) return Object.fromEntries(domains.map((domain) => [domain.name, 0]));

  const items = domains.map((domain) => {
    const exact = (domain.weight / weightSum) * TOTAL;
    return { name: domain.name, floor: Math.floor(exact), remainder: exact % 1 };
  });

  let remaining = TOTAL - items.reduce((sum, item) => sum + item.floor, 0);
  const byRemainder = [...items].sort((a, b) => b.remainder - a.remainder);

  for (const item of byRemainder) {
    if (remaining <= 0) break;
    const original = items.find((i) => i.name === item.name)!;
    original.floor += 1;
    remaining -= 1;
  }

  return Object.fromEntries(items.map((item) => [item.name, item.floor]));
}

export function DemoStep2Alloc({ cert, onGenerate, onBack }: DemoStep2AllocProps) {
  const { t } = useTranslation();

  const getInitialAlloc = useCallback(() => autoDistribute(cert.domains), [cert.domains]);
  const [alloc, setAlloc] = useState<Record<string, number>>(getInitialAlloc);
  const [removedDomains, setRemovedDomains] = useState<string[]>([]);

  const activeDomains = cert.domains.filter((domain) => !removedDomains.includes(domain.name));
  const total = Object.values(alloc).reduce((sum, v) => sum + v, 0);
  const isFull = total === TOTAL;

  function handleDistribute() {
    const newAlloc = autoDistribute(activeDomains);
    setAlloc((prev) => {
      const updated = { ...prev };
      removedDomains.forEach((name) => {
        updated[name] = 0;
      });
      Object.entries(newAlloc).forEach(([name, count]) => {
        updated[name] = count;
      });
      return updated;
    });
  }

  function handleChange(domainName: string, value: number) {
    setAlloc((prev) => ({ ...prev, [domainName]: Math.max(0, Math.min(TOTAL, value)) }));
  }

  function handleRemove(domainName: string) {
    const newActive = activeDomains.filter((domain) => domain.name !== domainName);
    setRemovedDomains((prev) => [...prev, domainName]);
    if (newActive.length > 0) {
      const newAlloc = autoDistribute(newActive);
      setAlloc((prev) => {
        const updated = { ...prev, [domainName]: 0 };
        Object.entries(newAlloc).forEach(([name, count]) => {
          updated[name] = count;
        });
        return updated;
      });
    } else {
      setAlloc((prev) => ({ ...prev, [domainName]: 0 }));
    }
  }

  function handleRestore(domainName: string) {
    const restoredDomain = cert.domains.find((domain) => domain.name === domainName)!;
    const newActive = [...activeDomains, restoredDomain];
    setRemovedDomains((prev) => prev.filter((name) => name !== domainName));
    const newAlloc = autoDistribute(newActive);
    setAlloc((prev) => {
      const updated = { ...prev };
      newActive.forEach((domain) => {
        updated[domain.name] = newAlloc[domain.name] ?? 0;
      });
      return updated;
    });
  }

  const stickyHint = isFull
    ? t('demo.step2.stickyReady')
    : total < TOTAL
      ? t('demo.step2.stickyNeed', { n: TOTAL - total })
      : t('demo.step2.stickyReduce', { n: total - TOTAL });

  const stats = [
    { icon: faFileLines, label: t('demo.step2.statQuestions'), value: `${cert.questions} questões` },
    { icon: faClock, label: t('demo.step2.statMinutes'), value: `${cert.minutes} min` },
    { icon: faCircleCheck, label: t('demo.step2.statPassing'), value: cert.passing, accent: true },
    {
      icon: faLayerGroup,
      label: t('demo.step2.statTopics'),
      value: `${activeDomains.length} de ${cert.domains.length}`,
    },
  ];

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <button
          onClick={onBack}
          className="mono text-xs text-mkt-accent uppercase tracking-widest hover:opacity-70 transition-opacity"
        >
          ← {t('demo.step2.backBtn')}
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-4 pb-8">
        <span className="kick">{t('demo.step2.kick')}</span>
        <h1 className="ds-heading text-mkt-text text-4xl mt-2">{t('demo.step2.heading')}</h1>
      </div>

      <div
        className="max-w-6xl mx-auto px-6"
        style={{ display: 'grid', gridTemplateColumns: '0.65fr 1.35fr', gap: '24px', alignItems: 'start' }}
      >
        {/* Left: exam info card */}
        <div className="relative border border-mkt-divider p-5">
          <BlueprintCorners />
          <span className="kick text-[10px]">{t('demo.step2.examSelected')}</span>
          <p className="ds-heading text-mkt-text text-lg mt-1 leading-tight">{cert.name}</p>
          <p className="text-mkt-text opacity-50 text-xs mt-0.5">
            {cert.vendor} · {cert.year}
          </p>

          <div className="mt-4 space-y-2.5 border-t border-mkt-divider pt-4">
            {stats.map(({ icon, label, value, accent }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-mkt-text opacity-60">
                  <FontAwesomeIcon icon={icon} className="w-3 h-3 flex-shrink-0" />
                  {label}
                </span>
                <span className={`mono text-xs font-medium ${accent ? 'text-mkt-accent' : 'text-mkt-text'}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleDistribute}
            className="w-full mt-5 border border-mkt-divider text-mkt-text text-xs mono uppercase tracking-widest py-2 hover:border-mkt-accent hover:text-mkt-accent transition-colors"
          >
            {t('demo.step2.distributeBtn')}
          </button>
          <p className="text-mkt-text opacity-40 text-xs mt-3 leading-relaxed">{t('demo.step2.planNote')}</p>
        </div>

        {/* Right: allocation table */}
        <div className="relative border border-mkt-divider">
          <BlueprintCorners />
          <div
            className="grid border-b border-mkt-divider px-4 py-2.5 bg-mkt-surface"
            style={{ gridTemplateColumns: '1fr 80px 40px 80px 28px' }}
          >
            <span className="text-xs text-mkt-text opacity-50">{t('demo.step2.colTopic')}</span>
            <span className="text-xs text-mkt-text opacity-50">{t('demo.step2.colWeight')}</span>
            <span className="text-xs text-mkt-text opacity-50">{t('demo.step2.colPct')}</span>
            <span className="text-xs text-mkt-text opacity-50 text-center">{t('demo.step2.colQuestions')}</span>
            <span />
          </div>

          {activeDomains.map((domain) => (
            <div
              key={domain.name}
              className="grid border-b border-mkt-divider px-4 py-3 items-center last:border-b-0"
              style={{ gridTemplateColumns: '1fr 80px 40px 80px 28px' }}
            >
              <span className="text-xs text-mkt-text truncate pr-2">{domain.name}</span>
              <div className="h-1.5 bg-mkt-divider">
                <div className="h-full bg-mkt-accent" style={{ width: `${domain.weight}%` }} />
              </div>
              <span className="mono text-xs text-mkt-text opacity-50">{domain.weight}%</span>
              <input
                type="number"
                min={0}
                max={TOTAL}
                value={alloc[domain.name] ?? 0}
                onChange={(e) => handleChange(domain.name, Number(e.target.value))}
                className="w-14 border border-mkt-divider text-center mono text-xs text-mkt-text bg-transparent py-0.5 focus:border-mkt-accent focus:outline-none"
              />
              <button
                onClick={() => handleRemove(domain.name)}
                aria-label={`Remove ${domain.name}`}
                className="text-mkt-text opacity-30 hover:opacity-70 text-xs text-center transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}

          {removedDomains.length > 0 && (
            <div className="px-4 py-3 border-t border-mkt-divider">
              <span className="kick text-[10px] block mb-2">{t('demo.step2.removed')}</span>
              <div className="flex flex-wrap gap-2">
                {removedDomains.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleRestore(name)}
                    className="mono text-xs border border-mkt-divider px-2 py-0.5 text-mkt-text opacity-50 hover:opacity-100 hover:border-mkt-accent transition-all"
                  >
                    {name} +
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer bar — inline, not fixed */}
      <div className="max-w-6xl mx-auto px-6 mt-6 border-t border-mkt-divider pt-4 flex items-center gap-4">
        <span
          className={`mono text-xs px-2 py-1 border flex-shrink-0 ${
            isFull
              ? 'border-mkt-accent bg-mkt-accent/10 text-mkt-accent'
              : 'border-mkt-divider text-mkt-text opacity-60'
          }`}
        >
          {total}/{TOTAL} {t('demo.step2.stickyDistributed')}
        </span>

        <span className="mono text-xs text-mkt-text opacity-40 flex-1">{stickyHint}</span>

        <div className="relative flex-shrink-0">
          <BlueprintCorners />
          <button
            onClick={() => onGenerate(alloc)}
            disabled={!isFull}
            className={`mono text-xs uppercase tracking-widest px-5 py-2.5 border transition-colors ${
              !isFull
                ? 'border-mkt-divider text-mkt-text opacity-30 cursor-not-allowed'
                : 'border-mkt-accent bg-mkt-accent text-white hover:bg-mkt-accent/90'
            }`}
          >
            {t('demo.step2.generateBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}

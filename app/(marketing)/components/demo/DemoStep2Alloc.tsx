'use client';

import { useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines, faClock, faCircleCheck, faRectangleList } from '@fortawesome/free-regular-svg-icons';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DemoCatalogExam, DemoCatalogDomain } from '@/shared/types';
import { distributeByWeight } from '@/lib/largest-remainder';
import { PLAN_LIMITS } from '@/config/constants';
import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';
import { DemoProgressBar } from './DemoProgressBar';
import { DemoStepHeader } from './DemoStepHeader';
import { DemoBackButton } from './DemoBackButton';

interface DemoStep2AllocProps {
  readonly exam: DemoCatalogExam;
  readonly onGenerate: (alloc: Record<string, number>) => void;
  readonly onBack: () => void;
}

const TOTAL = 10;

// Shares the apportionment used server-side to build the slice, so the split
// suggested here can always be served — `available` is the ceiling per domain.
function autoDistribute(domains: readonly DemoCatalogDomain[]): Record<string, number> {
  return distributeByWeight(
    domains.map((domain) => ({ key: domain.name, weight: domain.weight, capacity: domain.available })),
    TOTAL
  );
}

export function DemoStep2Alloc({ exam, onGenerate, onBack }: DemoStep2AllocProps) {
  const { t } = useTranslation();

  const getInitialAlloc = useCallback(() => autoDistribute(exam.domains), [exam.domains]);
  const [alloc, setAlloc] = useState<Record<string, number>>(getInitialAlloc);
  const [removedDomains, setRemovedDomains] = useState<string[]>([]);

  const activeDomains = exam.domains.filter((domain) => !removedDomains.includes(domain.name));
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
    const available = exam.domains.find((domain) => domain.name === domainName)?.available ?? 0;
    const ceiling = Math.min(TOTAL, available);

    setAlloc((prev) => ({ ...prev, [domainName]: Math.max(0, Math.min(ceiling, value)) }));
  }

  function canRemove(domainName: string): boolean {
    const remainingCapacity = activeDomains
      .filter((domain) => domain.name !== domainName)
      .reduce((sum, domain) => sum + domain.available, 0);

    return remainingCapacity >= TOTAL;
  }

  function handleRemove(domainName: string) {
    if (!canRemove(domainName)) return;

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
    const restoredDomain = exam.domains.find((domain) => domain.name === domainName)!;
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
    { icon: faFileLines, label: t('demo.step2.statQuestions'), value: `${exam.questions} questões` },
    { icon: faClock, label: t('demo.step2.statMinutes'), value: `${exam.minutes} min` },
    { icon: faCircleCheck, label: t('demo.step2.statPassing'), value: exam.passing, accent: true },
    {
      icon: faRectangleList,
      label: t('demo.step2.statTopics'),
      value: `${activeDomains.length} de ${exam.domains.length}`,
    },
  ];

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <DemoBackButton onClick={onBack} label={t('demo.step2.backBtn')} />
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-4 pb-8">
        <DemoStepHeader kick={t('demo.step2.kick')} heading={t('demo.step2.heading')} headingSize="5xl" />
      </div>

      <div
        className="max-w-6xl mx-auto px-6"
        style={{ display: 'grid', gridTemplateColumns: '0.50fr 1.35fr', gap: '24px', alignItems: 'start' }}
      >
        {/* Left: exam info card */}
        <div className="blueprint overflow-visible p-5">
          <BlueprintCorners />
          <span className="kick text-xs mb-2">{t('demo.step2.examSelected')}</span>
          <p className="ds-heading text-mkt-text text-lg mt-1 leading-tight">{exam.name}</p>
          <p className="text-mkt-text opacity-50 text-xs mt-1">
            {exam.vendor} · {exam.year}
          </p>

          <div className="mt-6 space-y-2.5 border-t border-mkt-divider pt-4">
            {stats.map(({ icon, label, value, accent }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-mkt-text opacity-60">
                  <FontAwesomeIcon icon={icon} className="w-3 h-3 flex-shrink-0 text-mkt-accent" />
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
            className="w-full mt-6 border border-mkt-divider text-sm font-semibold py-2 hover:border-mkt-accent text-mkt-text hover:text-mkt-accent transition-colors tracking-tight"
          >
            {t('demo.step2.distributeBtn')}
          </button>
          <p className="text-mkt-text opacity-40 text-xs mt-4 leading-relaxed">
            {t('demo.step2.planNote', { free: PLAN_LIMITS.free.questionsPerPeriod })}
          </p>
        </div>

        {/* Right: allocation table */}
        <div className="blueprint overflow-visible">
          <BlueprintCorners />
          <div
            className="grid border-b border-mkt-divider px-4 py-2.5 bg-mkt-surface"
            style={{ gridTemplateColumns: '1fr 269px 40px 80px 28px' }}
          >
            <span className="text-sm text-mkt-text opacity-50">{t('demo.step2.colTopic')}</span>
            <span className="text-sm text-mkt-text opacity-50" style={{ gridColumn: 'span 2' }}>
              {t('demo.step2.colWeight')}
            </span>
            <span className="text-sm text-mkt-text opacity-50 text-center">{t('demo.step2.colQuestions')}</span>
            <span />
          </div>

          {activeDomains.map((domain) => (
            <div
              key={domain.name}
              className="grid border-b border-mkt-divider px-4 py-3 items-center last:border-b-0"
              style={{ gridTemplateColumns: '1fr 269px 40px 80px 28px' }}
            >
              <span className="text-base text-mkt-text truncate pr-2 py-2">{domain.name}</span>
              <DemoProgressBar pct={domain.weight} className="h-1.5 mr-2" />
              <span className="mono text-xs text-mkt-text opacity-50">{domain.weight}%</span>
              <input
                type="number"
                min={0}
                max={Math.min(TOTAL, domain.available)}
                value={alloc[domain.name] ?? 0}
                onChange={(e) => handleChange(domain.name, Number(e.target.value))}
                className="w-14 border border-mkt-divider text-center mono text-xs text-mkt-text bg-transparent py-0.5 focus:border-mkt-accent focus:outline-none"
              />
              <button
                onClick={() => handleRemove(domain.name)}
                disabled={!canRemove(domain.name)}
                aria-label={`Remove ${domain.name}`}
                title={canRemove(domain.name) ? undefined : t('demo.step2.removeDisabled', { n: TOTAL })}
                className={`text-xs text-center transition-opacity ${
                  canRemove(domain.name)
                    ? 'text-mkt-text opacity-30 hover:opacity-70'
                    : 'text-mkt-text opacity-10 cursor-not-allowed'
                }`}
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

        <button
          onClick={() => onGenerate(alloc)}
          disabled={!isFull}
          className={`blueprint overflow-visible flex-shrink-0 mono text-xs uppercase tracking-widest px-5 py-2.5 transition-colors ${
            !isFull
              ? '!border-mkt-divider text-mkt-text opacity-30 cursor-not-allowed'
              : '!border-mkt-accent bg-mkt-accent text-white hover:bg-mkt-accent/90'
          }`}
        >
          <BlueprintCorners />
          {t('common.generateQuestions')}
        </button>
      </div>
    </div>
  );
}

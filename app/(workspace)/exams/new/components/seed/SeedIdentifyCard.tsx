'use client';

import type { AutoConfigMatch, ExamType } from '@/shared/types';

import NextLink from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faChevronRight,
  faCircleExclamation,
  faLayerGroup,
  faPenToSquare,
} from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { ExamSearchForm } from './ExamSearchForm';

export type IdentifyPhase =
  | { readonly kind: 'searching' }
  | { readonly kind: 'disambiguating'; readonly matches: readonly AutoConfigMatch[] }
  // Search returned nothing usable. `message` is the model's own request for detail when it
  // gave one; `kind: 'failed'` is the same shape for a request that errored outright.
  | { readonly kind: 'clarifying'; readonly message: string }
  | { readonly kind: 'failed' }
  | { readonly kind: 'confirmed'; readonly match: ConfirmedSeed };

// Subset of AutoConfigMatch the loading screen carries forward once a match is confirmed —
// these fields are already resolved at that point but today get dropped until the editor.
export interface ConfirmedSeed {
  readonly label: string;
  readonly key: string | null;
  readonly provider: string | null;
  readonly examBoard: string | null;
  readonly role: string | null;
  readonly year: number | null;
}

interface SeedIdentifyCardProps {
  readonly type: ExamType;
  readonly phase: IdentifyPhase;
  readonly query: string;
  readonly onSelectMatch?: (match: AutoConfigMatch) => void;
  readonly onRetry?: (query: string) => void;
  readonly onStartBlank?: () => void;
}

const SKELETON_WIDTHS_PCT = [68, 52, 60] as const;

// Takes the slot the modules skeleton used to occupy. Unlike that skeleton — which never
// filled, since the blueprint only exists once the job is done — every phase here shows
// something the flow actually knows at that moment, and neither failure phase dead-ends.
export function SeedIdentifyCard({ type, phase, query, onSelectMatch, onRetry, onStartBlank }: SeedIdentifyCardProps) {
  const { t } = useTranslation();
  const isRecoverable = phase.kind === 'clarifying' || phase.kind === 'failed';

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-6">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-widest text-default-400">
          {t('exam.identifyCardTitle')}
        </span>
        {phase.kind === 'disambiguating' && (
          <span className="font-mono text-[11px] text-default-400">
            {t('exam.identifyMatchCount', { count: String(phase.matches.length) })}
          </span>
        )}
      </div>

      <div className="mt-4">{renderPhase()}</div>

      {isRecoverable && (
        <div className="mt-5 pt-5 border-t border-divider flex flex-col gap-4">
          <ExamSearchForm
            compact
            initialQuery={query}
            isBusy={false}
            isSearching={false}
            showLabel={false}
            type={type}
            onSubmit={(next) => onRetry?.(next)}
          />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <button
              className="inline-flex items-center gap-2 text-sm text-default-500 hover:text-foreground transition-colors duration-200"
              data-testid="exam-seed-blank-btn"
              type="button"
              onClick={onStartBlank}
            >
              <FontAwesomeIcon className="w-3 h-3" icon={faPenToSquare} />
              {t('exam.aiSeedStartBlank')}
            </button>
            <NextLink
              className="inline-flex items-center gap-2 text-sm text-default-500 hover:text-foreground transition-colors duration-200"
              href={`/exams/catalog?type=${type}`}
            >
              <FontAwesomeIcon className="w-3 h-3" icon={faLayerGroup} />
              {t('catalog.browseAction')}
            </NextLink>
          </div>
        </div>
      )}
    </div>
  );

  function renderPhase() {
    switch (phase.kind) {
      case 'searching':
        return (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-default-500">{t('exam.identifySearching')}</p>
            {SKELETON_WIDTHS_PCT.map((width, i) => (
              <div key={i} className="bg-content2 rounded-lg px-4 py-3.5 animate-pulse">
                <div className="h-2.5 rounded-full bg-default-200" style={{ width: `${width}%` }} />
              </div>
            ))}
          </div>
        );

      case 'disambiguating':
        return (
          <div className="flex flex-col gap-2">
            {phase.matches.map((match) => (
              <button
                key={match.label}
                className="group flex items-center gap-3 text-left bg-content2 border border-default-200 rounded-lg px-4 py-3 hover:bg-primary/10 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors duration-200"
                data-testid="seed-identify-match-option"
                type="button"
                onClick={() => onSelectMatch?.(match)}
              >
                <span className="min-w-0 grow">
                  <span className="block text-sm font-semibold text-foreground truncate">{match.label}</span>
                  {matchMeta(match) && (
                    <span className="block mt-1 font-mono text-[11px] text-default-400 truncate">
                      {matchMeta(match)}
                    </span>
                  )}
                </span>
                <FontAwesomeIcon
                  className="w-3 h-3 shrink-0 text-default-400 group-hover:text-primary transition-colors duration-200"
                  icon={faChevronRight}
                />
              </button>
            ))}
          </div>
        );

      case 'clarifying':
      case 'failed':
        return (
          <div className="flex items-start gap-3">
            <FontAwesomeIcon className="w-4 h-4 mt-0.5 shrink-0 text-primary" icon={faCircleExclamation} />
            <div>
              {phase.kind === 'clarifying' && phase.message && (
                <p className="text-sm text-foreground text-pretty">{phase.message}</p>
              )}
              <p
                className={`text-[13px] leading-relaxed text-default-400 text-pretty ${
                  phase.kind === 'clarifying' && phase.message ? 'mt-1.5' : ''
                }`}
              >
                {t('exam.identifyRefineHint')}
              </p>
            </div>
          </div>
        );

      case 'confirmed':
        return renderConfirmed(phase.match);
    }
  }

  function renderConfirmed(match: ConfirmedSeed) {
    const organization = match.provider ?? match.examBoard;
    const facts: { readonly labelKey: string; readonly value: string }[] = [];

    if (organization) {
      facts.push({ labelKey: match.provider ? 'certification.providerLabel' : 'exam.examBoard', value: organization });
    }
    if (match.key) facts.push({ labelKey: 'exam.keyLabel', value: match.key });
    if (match.role) facts.push({ labelKey: 'concurso.cargo', value: match.role });
    if (match.year) facts.push({ labelKey: 'exam.year', value: String(match.year) });

    return (
      <div>
        <div className="flex items-start gap-3">
          <span className="w-5 h-5 mt-0.5 shrink-0 rounded-full bg-success/15 flex items-center justify-center">
            <FontAwesomeIcon className="w-3 h-3 text-success" icon={faCheck} />
          </span>
          <span className="text-base font-bold text-foreground text-balance" data-testid="seed-identify-confirmed-label">
            {match.label}
          </span>
        </div>
        {facts.length > 0 && (
          <dl className="mt-4 flex flex-col">
            {facts.map((fact) => (
              <div
                key={fact.labelKey}
                className="flex items-baseline justify-between gap-4 py-2 border-t border-default-200"
              >
                <dt className="text-sm text-default-500">{t(fact.labelKey)}</dt>
                <dd className="font-mono text-[11px] text-default-400 text-right">{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    );
  }
}

function matchMeta(match: AutoConfigMatch): string {
  return [match.provider ?? match.examBoard, match.key, match.role, match.year].filter(Boolean).join(' · ');
}

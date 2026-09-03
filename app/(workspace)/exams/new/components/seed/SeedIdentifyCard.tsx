'use client';

import type { AutoConfigMatch, EditalCandidate, ExamType } from '@/shared/types';

import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
  faCheck,
  faChevronRight,
  faCircleCheck,
  faCircleExclamation,
  faCircleQuestion,
  faFileCircleQuestion,
  faForwardStep,
  faLayerGroup,
  faMagnifyingGlass,
  faPenToSquare,
} from '@fortawesome/free-solid-svg-icons';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { CardHeading } from '@/shared/components/ui/CardHeading';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { inputProperties } from '@/config/constants/inputStyles';
import { ExamSearchForm } from './ExamSearchForm';

export type IdentifyPhase =
  | { readonly kind: 'searching' }
  | { readonly kind: 'disambiguating'; readonly matches: readonly AutoConfigMatch[] }
  | { readonly kind: 'clarifying'; readonly message: string }
  | { readonly kind: 'failed' }
  | { readonly kind: 'selecting-role'; readonly match: AutoConfigMatch }
  | { readonly kind: 'locating' }
  // Edital candidates returned by locateEdital — user approves one, re-searches with a
  // number, or skips. Replaces the old edital-not-found phase.
  | {
      readonly kind: 'approving-edital';
      readonly match: AutoConfigMatch;
      readonly editais: readonly EditalCandidate[];
      readonly targetYearFound: boolean;
      // False when locateEdital's verification loop opened its candidates but never confirmed
      // one carries the conteúdo programático — the card still lists what it found, framed as
      // unconfirmed, rather than presenting any of them as the edital.
      readonly confirmedFound: boolean;
    }
  | { readonly kind: 'confirmed'; readonly match: ConfirmedSeed };

// Subset of AutoConfigMatch the loading screen carries forward once a match is confirmed.
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
  readonly onSelectRole?: (role: string) => void;
  readonly onApproveEdital?: (candidate: EditalCandidate) => void;
  readonly onRelocateEdital?: (editalKey: string) => void;
  readonly onSkipEdital?: () => void;
}

const SKELETON_WIDTHS_PCT = [68, 52, 60] as const;

export function SeedIdentifyCard({
  type,
  phase,
  query,
  onSelectMatch,
  onRetry,
  onStartBlank,
  onSelectRole,
  onApproveEdital,
  onRelocateEdital,
  onSkipEdital,
}: SeedIdentifyCardProps) {
  const { t } = useTranslation();
  const initialRole = phase.kind === 'selecting-role' ? (phase.match.role ?? '') : '';
  const [roleInputValue, setRoleInputValue] = useState(initialRole);
  const [editalKeyInputValue, setEditalKeyInputValue] = useState(
    phase.kind === 'approving-edital' ? (phase.match.key ?? '') : ''
  );
  const isRecoverable = phase.kind === 'clarifying' || phase.kind === 'failed';

  const matchRole = phase.kind === 'selecting-role' ? (phase.match.role ?? '') : null;

  // Re-sync role input when the match changes (e.g. after a disambiguate + re-identify cycle).
  useEffect(() => {
    if (matchRole === null) return;
    setRoleInputValue(matchRole);
  }, [matchRole]);

  // Re-seed edital key input when transitioning into approving-edital.
  const approvingEditalKey = phase.kind === 'approving-edital' ? (phase.match.key ?? '') : null;

  useEffect(() => {
    if (approvingEditalKey === null) return;
    setEditalKeyInputValue(approvingEditalKey);
  }, [approvingEditalKey]);

  return (
    <div className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6">
      <CardHeading
        action={
          phase.kind === 'disambiguating' && (
            <span className="font-mono text-[11px] text-default-400">
              {t('exam.identifyMatchCount', { count: String(phase.matches.length) })}
            </span>
          )
        }
      >
        {t('exam.identifyCardTitle')}
      </CardHeading>

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

      case 'selecting-role':
        return renderSelectingRole(phase.match);

      case 'locating':
        return (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-default-500">{t('exam.identifyLocatingEdital')}</p>
            {SKELETON_WIDTHS_PCT.map((width, i) => (
              <div key={i} className="bg-content2 rounded-lg px-4 py-3.5 animate-pulse">
                <div className="h-2.5 rounded-full bg-default-200" style={{ width: `${width}%` }} />
              </div>
            ))}
          </div>
        );

      case 'approving-edital':
        return renderApprovingEdital(phase.editais, phase.targetYearFound, phase.confirmedFound);

      case 'confirmed':
        return renderConfirmed(phase.match);
    }
  }

  function renderVerificationNote(verification: EditalCandidate['verification']) {
    switch (verification) {
      case 'confirmed':
        return (
          <span
            className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-success"
            data-testid="seed-identify-edital-verified-badge"
          >
            <FontAwesomeIcon className="w-3 h-3 shrink-0" icon={faCircleCheck} />
            {t('exam.editalApproveVerifiedBadge')}
          </span>
        );
      case 'annex':
        return (
          <span
            className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-warning"
            data-testid="seed-identify-edital-annex-warning"
          >
            <FontAwesomeIcon className="w-3 h-3 shrink-0" icon={faCircleExclamation} />
            {t('exam.editalApproveAnnexWarning')}
          </span>
        );
      case 'unreadable':
        return (
          <span
            className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-warning"
            data-testid="seed-identify-edital-unreadable-badge"
          >
            <FontAwesomeIcon className="w-3 h-3 shrink-0" icon={faCircleExclamation} />
            {t('exam.editalApproveUnreadable')}
          </span>
        );
      case 'unchecked':
        return (
          <span className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-default-400">
            <FontAwesomeIcon className="w-3 h-3 shrink-0" icon={faCircleQuestion} />
            {t('exam.editalApproveUnverified')}
          </span>
        );
    }
  }

  function renderApprovingEdital(
    editais: readonly EditalCandidate[],
    targetYearFound: boolean,
    confirmedFound: boolean
  ) {
    const hasEditais = editais.length > 0;

    return (
      <div data-testid={!confirmedFound ? 'seed-identify-edital-unconfirmed' : undefined}>
        <div className="flex items-start gap-3">
          <FontAwesomeIcon className="w-4 h-4 mt-0.5 shrink-0 text-primary" icon={faFileCircleQuestion} />
          <div>
            <p className="text-sm text-foreground text-pretty">
              {!hasEditais
                ? t('exam.editalApproveNoneFound')
                : confirmedFound
                  ? t('exam.editalApproveTitle')
                  : t('exam.editalApproveUnconfirmedTitle')}
            </p>
            {hasEditais && (
              <p className="mt-1.5 text-[13px] leading-relaxed text-default-400 text-pretty">
                {confirmedFound ? t('exam.editalApproveSubtitle') : t('exam.editalApproveUnconfirmedSubtitle')}
              </p>
            )}
          </div>
        </div>

        {hasEditais && (
          <div className="mt-4 flex flex-col gap-2">
            {!confirmedFound && (
              <p className="text-xs font-semibold text-default-400">{t('exam.editalApproveUnconfirmedListLabel')}</p>
            )}
            {editais.map((candidate, index) => {
              const isOfficial = targetYearFound && index === 0 && candidate.verification === 'confirmed';

              return (
                <div
                  key={candidate.url}
                  className="flex items-stretch bg-content2 border border-default-200 rounded-lg overflow-hidden hover:border-primary/40 transition-colors duration-200"
                >
                  <button
                    className="group flex items-center gap-3 text-left grow px-4 py-3 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-primary transition-colors duration-200"
                    data-testid="seed-identify-approve-edital-option"
                    type="button"
                    onClick={() => onApproveEdital?.(candidate)}
                  >
                    <span className="min-w-0 grow">
                      <span className="block text-sm font-semibold text-foreground truncate">
                        {isOfficial
                          ? t('exam.editalApproveOfficialBadge')
                          : t('exam.editalNotFoundUsePriorYear', { year: String(candidate.year ?? '—') })}
                      </span>
                      <span className="block mt-1 font-mono text-[11px] text-default-400 truncate">
                        {[candidate.editalNumber, candidate.orgao].filter(Boolean).join(' · ')}
                      </span>
                      {!isOfficial && renderVerificationNote(candidate.verification)}
                    </span>
                    <FontAwesomeIcon
                      className="w-3 h-3 shrink-0 text-default-400 group-hover:text-primary transition-colors duration-200"
                      icon={faChevronRight}
                    />
                  </button>
                  <a
                    aria-label={t('exam.editalPreviewBtn')}
                    className="shrink-0 flex items-center px-3 border-l border-default-200 text-default-400 hover:text-primary hover:bg-primary/10 transition-colors duration-200"
                    href={candidate.url}
                    rel="noopener noreferrer"
                    target="_blank"
                    title={t('exam.editalPreviewBtn')}
                  >
                    <FontAwesomeIcon className="w-3 h-3" icon={faArrowUpRightFromSquare} />
                  </a>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-1.5">
          <p className="text-sm font-medium text-default-500">{t('exam.editalKeyLabel')}</p>
          <div className="flex gap-2 items-center">
            <Input
              {...inputProperties.input}
              className="grow"
              data-testid="seed-identify-edital-key-input"
              label=""
              placeholder={t('exam.editalKeyOrUrlPlaceholder')}
              value={editalKeyInputValue}
              onValueChange={setEditalKeyInputValue}
            />
            <Button
              className={buttonStyles.primarySm}
              data-testid="seed-identify-edital-search-btn"
              isDisabled={!editalKeyInputValue.trim()}
              type="button"
              onPress={() => {
                if (editalKeyInputValue.trim()) onRelocateEdital?.(editalKeyInputValue.trim());
              }}
            >
              <FontAwesomeIcon className="w-3 h-3" icon={faMagnifyingGlass} />
              {t('exam.editalApproveSearchBtn')}
            </Button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-divider">
          <button
            className="inline-flex items-center gap-2 text-sm text-default-500 hover:text-foreground transition-colors duration-200"
            data-testid="seed-identify-skip-edital-btn"
            type="button"
            onClick={onSkipEdital}
          >
            <FontAwesomeIcon className="w-3 h-3" icon={faForwardStep} />
            {t('exam.editalNotFoundContinueWithoutIt')}
          </button>
        </div>
      </div>
    );
  }

  function renderFacts(match: ConfirmedSeed) {
    const organization = match.provider ?? match.examBoard;
    const facts: { readonly labelKey: string; readonly value: string }[] = [];

    if (organization) {
      facts.push({ labelKey: match.provider ? 'certification.providerLabel' : 'exam.examBoard', value: organization });
    }
    if (match.key) {
      facts.push({ labelKey: type === 'public_exam' ? 'exam.editalKeyLabel' : 'exam.keyLabel', value: match.key });
    }
    if (match.year) facts.push({ labelKey: 'exam.year', value: String(match.year) });

    if (facts.length === 0) return null;
    return (
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
    );
  }

  function renderConfirmed(match: ConfirmedSeed) {
    const organization = match.provider ?? match.examBoard;
    const facts: { readonly labelKey: string; readonly value: string }[] = [];

    if (organization) {
      facts.push({ labelKey: match.provider ? 'certification.providerLabel' : 'exam.examBoard', value: organization });
    }
    if (match.key) {
      facts.push({ labelKey: type === 'public_exam' ? 'exam.editalKeyLabel' : 'exam.keyLabel', value: match.key });
    }
    if (match.role) facts.push({ labelKey: 'concurso.cargo', value: match.role });
    if (match.year) facts.push({ labelKey: 'exam.year', value: String(match.year) });

    return (
      <div>
        <div className="flex items-start gap-3">
          <span className="w-5 h-5 mt-0.5 shrink-0 rounded-full bg-success/15 flex items-center justify-center">
            <FontAwesomeIcon className="w-3 h-3 text-success" icon={faCheck} />
          </span>
          <span
            className="text-base font-bold text-foreground text-balance"
            data-testid="seed-identify-confirmed-label"
          >
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

  function renderSelectingRole(match: AutoConfigMatch) {
    return (
      <div>
        <div className="flex items-start gap-3 mb-4">
          <span className="min-w-0">
            <span className="block text-base font-bold text-foreground text-balance">{match.label}</span>
          </span>
        </div>
        {renderFacts(match)}
        <div className="mt-4 flex flex-col gap-2">
          {match.roles.length > 0 ? (
            match.roles.map((role) => (
              <button
                key={role}
                className="group flex items-center gap-3 text-left bg-content2 border border-default-200 rounded-lg px-4 py-3 hover:bg-primary/10 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors duration-200"
                data-testid="seed-identify-role-option"
                type="button"
                onClick={() => onSelectRole?.(role)}
              >
                <span className="min-w-0 grow">
                  <span className="block text-sm font-semibold text-foreground truncate">{role}</span>
                </span>
                <FontAwesomeIcon
                  className="w-3 h-3 shrink-0 text-default-400 group-hover:text-primary transition-colors duration-200"
                  icon={faChevronRight}
                />
              </button>
            ))
          ) : (
            <p className="text-sm text-default-500">{t('exam.identifyRoleEmptyHint')}</p>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {match.roles.length > 0 && (
            <p className="text-sm font-medium text-default-500">{t('exam.identifyRoleOtherLabel')}</p>
          )}
          <div className="flex gap-2 items-center">
            <Input
              {...inputProperties.input}
              className="grow"
              data-testid="seed-identify-role-input"
              label=""
              placeholder={t('exam.identifyRoleOtherPlaceholder')}
              value={roleInputValue}
              onValueChange={setRoleInputValue}
            />
            <Button
              className={buttonStyles.primarySm}
              data-testid="seed-identify-role-confirm-btn"
              isDisabled={!roleInputValue.trim()}
              type="button"
              onPress={() => {
                if (roleInputValue.trim()) onSelectRole?.(roleInputValue.trim());
              }}
            >
              {t('exam.identifyRoleConfirmAction')}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

function matchMeta(match: AutoConfigMatch): string {
  return [match.provider ?? match.examBoard, match.key, match.role, match.year].filter(Boolean).join(' · ');
}

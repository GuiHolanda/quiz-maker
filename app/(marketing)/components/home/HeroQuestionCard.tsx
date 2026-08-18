'use client';

import NextLink from 'next/link';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';

interface QuestionOption {
  readonly letter: string;
  readonly text: string;
  readonly correct?: boolean;
}

// Service names are the same in every language, so they stay literal.
const OPTIONS: readonly QuestionOption[] = [
  { letter: 'A', text: 'Amazon S3 com Cross-Region Replication' },
  { letter: 'B', text: 'Amazon EFS', correct: true },
  { letter: 'C', text: 'Amazon EBS Multi-Attach' },
  { letter: 'D', text: 'AWS Storage Gateway' },
];

export function HeroQuestionCard() {
  const { t } = useTranslation();

  return (
    <div className="blueprint bg-mkt-bg overflow-visible">
      <BlueprintCorners />

      <div className="flex items-center justify-between px-5 py-3 border-b border-mkt-divider">
        <span className="kick">{t('homepage.heroCard.kick')}</span>
        {/* This slot used to claim "<200ms per question". The generation chain is
            built to wait up to 280s, so the number was off by orders of
            magnitude. Freshness is the argument here, not latency. */}
        <span className="mono text-[11px] text-mkt-text opacity-50">{t('homepage.heroCard.meta')}</span>
      </div>

      <div className="p-5">
        <span className="kick">{t('homepage.heroCard.tag')}</span>
        <p className="ds-heading text-mkt-text text-lg mt-2 mb-5 leading-snug text-pretty">
          {t('homepage.heroCard.stem')}
        </p>

        <div className="flex flex-col gap-2">
          {OPTIONS.map((opt) => (
            <div
              key={opt.letter}
              className={
                opt.correct
                  ? 'flex items-center justify-between px-4 py-2.5 border border-mkt-accent bg-mkt-accent-100 text-sm text-mkt-text'
                  : 'flex items-center px-4 py-2.5 border border-mkt-divider bg-mkt-surface text-sm text-mkt-text opacity-60'
              }
            >
              <span>
                <span className="mono font-medium mr-2">{opt.letter}</span>
                {opt.text}
              </span>
              {opt.correct && <span className="kick ml-4 shrink-0">{t('homepage.heroCard.correct')}</span>}
            </div>
          ))}
        </div>

        <div className="border-t border-mkt-divider pt-4 mt-4">
          <p className="text-xs text-mkt-text opacity-55 leading-relaxed text-pretty">
            {t('homepage.heroCard.explanation')}
          </p>
        </div>

        <NextLink
          className="block w-full text-center text-sm font-semibold bg-mkt-accent text-white py-2.5 mt-4 hover:opacity-90 transition-opacity"
          href="/register"
        >
          {t('homepage.heroCard.cta')}
        </NextLink>
      </div>
    </div>
  );
}

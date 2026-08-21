'use client';

import NextLink from 'next/link';
import { Divider } from '@heroui/divider';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { BlueprintFrame } from '@/app/(marketing)/components/shared/BlueprintFrame';
import { PLAN_LIMITS } from '@/config/constants';

interface DemoResultActionsProps {
  readonly onRestart: () => void;
}

const BULLET_KEYS = [
  'demo.step4.ctaBullet1',
  'demo.step4.ctaBullet2',
  'demo.step4.ctaBullet3',
  'demo.step4.ctaBullet4',
] as const;

export function DemoResultActions({ onRestart }: DemoResultActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <BlueprintFrame dark className="p-6 bg-mkt-accent-800 border-mkt-accent/40 text-white">
        <span className="kick text-white/50">{t('demo.step4.ctaKick')}</span>
        <h3 className="ds-heading text-white text-3xl mt-2 leading-tight mb-4">{t('demo.step4.ctaHeading')}</h3>

        <Divider />

        <ul className="mt-4 space-y-4">
          {BULLET_KEYS.map((key) => (
            <li key={key} className="text-base font-semibold text-white/80">
              {t(key, { free: PLAN_LIMITS.free.questionsPerPeriod })}
            </li>
          ))}
        </ul>

        <NextLink
          href="/register"
          className="block mt-6 w-full text-center border border-white py-3 text-sm font-semibold tracking-tight bg-white text-mkt-accent-700 hover:opacity-90 transition-opacity"
        >
          {t('demo.step4.ctaBtn')}
        </NextLink>
        <p className="mono text-xs mt-4 text-center text-mkt-surface/80">
          {t('demo.step4.ctaNote', { free: PLAN_LIMITS.free.questionsPerPeriod })}
        </p>
      </BlueprintFrame>

      <BlueprintFrame className="p-6">
        <h3 className="ds-heading text-mkt-text text-lg">{t('demo.step4.restartHeading')}</h3>
        <p className="text-sm text-mkt-text opacity-60 mt-2">{t('demo.step4.restartBody')}</p>
        <button
          onClick={onRestart}
          className="mt-4 border border-mkt-divider px-4 py-2 font-semibold tracking-tighter text-sm text-mkt-accent hover:border-mkt-accent transition-colors"
        >
          {t('demo.step4.restartBtn')}
        </button>
      </BlueprintFrame>
    </div>
  );
}

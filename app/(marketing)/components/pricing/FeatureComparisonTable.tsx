'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface FeatureRow {
  readonly labelKey: string;
  readonly free: string | boolean;
  readonly pro: string | boolean;
  readonly proAi: string | boolean;
  readonly sprint: string | boolean;
}

// Sprint is "tudo do Pro AI" for a fixed 90-day term — every row mirrors proAi's value.
const FEATURES: readonly FeatureRow[] = [
  {
    labelKey: 'pricing.features.autoConfig',
    free: 'pricing.features.free.autoConfig',
    pro: 'pricing.features.pro.autoConfig',
    proAi: 'pricing.features.proAi.autoConfig',
    sprint: 'pricing.features.proAi.autoConfig',
  },
  {
    labelKey: 'pricing.features.questionsPerMonth',
    free: 'pricing.features.free.questions',
    pro: 'pricing.features.pro.questions',
    proAi: 'pricing.features.proAi.questions',
    sprint: 'pricing.features.proAi.questions',
  },
  {
    labelKey: 'pricing.features.customExams',
    free: 'pricing.features.free.certifications',
    pro: 'pricing.features.pro.certifications',
    proAi: 'pricing.features.proAi.certifications',
    sprint: 'pricing.features.proAi.certifications',
  },
  { labelKey: 'pricing.features.canEditExams', free: false, pro: true, proAi: true, sprint: true },
  { labelKey: 'pricing.features.aiExplanations', free: true, pro: true, proAi: true, sprint: true },
  { labelKey: 'pricing.features.topicDistribution', free: true, pro: true, proAi: true, sprint: true },
  { labelKey: 'pricing.features.simulados', free: true, pro: true, proAi: true, sprint: true },
  { labelKey: 'pricing.features.browseQuestions', free: true, pro: true, proAi: true, sprint: true },
  { labelKey: 'pricing.features.aiChat', free: false, pro: false, proAi: true, sprint: true },
];

interface FeatureCellProps {
  readonly value: string | boolean;
}

function FeatureCell({ value }: FeatureCellProps) {
  const { t } = useTranslation();

  if (typeof value === 'boolean') {
    return (
      <div className="flex justify-center">
        <FontAwesomeIcon
          className={value ? 'text-mkt-accent' : 'text-mkt-text opacity-30'}
          icon={value ? faCheck : faXmark}
        />
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <span className="mono text-sm font-semibold text-mkt-text">{t(value)}</span>
    </div>
  );
}

export function FeatureComparisonTable() {
  const { t } = useTranslation();

  return (
    <div>
      <span className="kick mb-8 block">{t('pricing.features.sectionLabel')}</span>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-mkt-divider">
              <th className="py-4 text-left mono text-xs text-mkt-text opacity-60 uppercase tracking-widest w-1/3">
                {t('pricing.features.sectionLabel')}
              </th>
              <th className="py-4 text-center mono text-xs text-mkt-text opacity-60 uppercase tracking-widest w-1/6">
                {t('pricing.plan.free')}
              </th>
              <th className="py-4 text-center mono text-xs text-mkt-text opacity-60 uppercase tracking-widest w-1/6">
                {t('pricing.plan.pro')}
              </th>
              <th className="py-4 text-center mono text-xs text-mkt-accent-700 uppercase tracking-widest w-1/6">
                {t('pricing.plan.proAi')}
              </th>
              <th className="py-4 text-center mono text-xs text-mkt-text opacity-60 uppercase tracking-widest w-1/6">
                {t('pricing.plan.sprint')}
              </th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((row, i) => {
              const isAlternate = i % 2 !== 0;
              return (
                <tr key={row.labelKey} className={`border-b border-mkt-divider ${isAlternate ? 'bg-mkt-surface' : ''}`}>
                  <td className="py-3.5 mono text-xs text-mkt-text opacity-60">{t(row.labelKey)}</td>
                  <td className="py-3.5">
                    <FeatureCell value={row.free} />
                  </td>
                  <td className="py-3.5">
                    <FeatureCell value={row.pro} />
                  </td>
                  <td className="py-3.5">
                    <FeatureCell value={row.proAi} />
                  </td>
                  <td className="py-3.5">
                    <FeatureCell value={row.sprint} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

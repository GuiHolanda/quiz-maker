'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface FeatureRow {
  readonly labelKey: string;
  readonly free: string | boolean;
  readonly pro: string | boolean;
  readonly proAi: string | boolean;
}

const FEATURES: readonly FeatureRow[] = [
  {
    labelKey: 'pricing.features.questionsPerMonth',
    free: 'pricing.features.free.questions',
    pro: 'pricing.features.pro.questions',
    proAi: 'pricing.features.proAi.questions',
  },
  {
    labelKey: 'pricing.features.customCertifications',
    free: 'pricing.features.free.certifications',
    pro: 'pricing.features.pro.certifications',
    proAi: 'pricing.features.proAi.certifications',
  },
  {
    labelKey: 'pricing.features.publicExams',
    free: 'pricing.features.free.publicExams',
    pro: 'pricing.features.pro.publicExams',
    proAi: 'pricing.features.proAi.publicExams',
  },
  { labelKey: 'pricing.features.aiExplanations', free: true, pro: true, proAi: true },
  { labelKey: 'pricing.features.topicDistribution', free: true, pro: true, proAi: true },
  { labelKey: 'pricing.features.simulados', free: true, pro: true, proAi: true },
  { labelKey: 'pricing.features.browseQuestions', free: true, pro: true, proAi: true },
  { labelKey: 'pricing.features.aiChat', free: false, pro: false, proAi: true },
  { labelKey: 'pricing.features.prioritySupport', free: false, pro: false, proAi: true },
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
          className={value ? 'text-accent' : 'text-navy-700'}
          icon={value ? faCheck : faXmark}
        />
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <span className="font-mono text-sm font-semibold text-white">{t(value)}</span>
    </div>
  );
}

export function FeatureComparisonTable() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-px h-4 bg-accent" />
        <span className="font-mono text-xs text-navy-400 tracking-widest uppercase">
          {t('pricing.features.sectionLabel')}
        </span>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-navy-800/60">
              <th className="py-4 text-left font-mono text-xs text-navy-500 uppercase tracking-widest w-2/5">
                {t('pricing.features.sectionLabel')}
              </th>
              <th className="py-4 text-center font-mono text-xs text-navy-400 uppercase tracking-widest w-1/5">
                {t('pricing.plan.free')}
              </th>
              <th className="py-4 text-center font-mono text-xs text-navy-400 uppercase tracking-widest w-1/5">
                {t('pricing.plan.pro')}
              </th>
              <th className="py-4 text-center font-mono text-xs uppercase tracking-widest w-1/5" style={{ color: '#00d4ff' }}>
                {t('pricing.plan.proAi')}
              </th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((row, i) => (
              <tr
                key={row.labelKey}
                className={`border-b border-navy-800/40 ${i % 2 === 0 ? '' : 'bg-navy-950/30'}`}
              >
                <td className="py-3.5 font-mono text-xs text-navy-400">{t(row.labelKey)}</td>
                <td className="py-3.5">
                  <FeatureCell value={row.free} />
                </td>
                <td className="py-3.5">
                  <FeatureCell value={row.pro} />
                </td>
                <td className="py-3.5">
                  <FeatureCell value={row.proAi} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

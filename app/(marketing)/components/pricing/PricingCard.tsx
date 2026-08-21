'use client';

import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark, faArrowRight } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface PricingFeature {
  readonly labelKey: string;
  readonly included: boolean;
  readonly value?: string;
}

interface PricingCardProps {
  readonly planKey: 'free' | 'pro' | 'pro_ai' | 'sprint';
  readonly nameKey: string;
  readonly priceKey: string;
  readonly priceSuffixKey?: string;
  readonly sublineKey?: string;
  readonly features: readonly PricingFeature[];
  readonly ctaLabelKey: string;
  readonly isPopular?: boolean;
  readonly isCurrent?: boolean;
  readonly isLoading?: boolean;
  readonly onCtaPress: () => void;
}

export function PricingCard({
  planKey,
  nameKey,
  priceKey,
  priceSuffixKey = 'pricing.plan.perMonth',
  sublineKey,
  features,
  ctaLabelKey,
  isPopular,
  isCurrent,
  isLoading,
  onCtaPress,
}: PricingCardProps) {
  const { t } = useTranslation();
  const isProAi = planKey === 'pro_ai';

  return (
    <div
      className={`relative flex flex-col gap-6 p-7 ${
        isProAi ? 'bg-mkt-accent-100 border-2 border-mkt-accent' : 'bg-mkt-surface border border-mkt-divider'
      }`}
    >
      {isPopular && (
        <div className="absolute top-4 right-4">
          <span className="mono text-[10px] uppercase tracking-widest px-2 py-1 bg-mkt-accent text-white">
            {t('pricing.plan.mostPopular')}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <p className={`text-xs font-medium ${isProAi ? 'text-mkt-accent-700' : 'text-mkt-text opacity-60'}`}>
          {t(nameKey)}
        </p>
        <div className="flex items-end gap-2">
          <span className="ds-heading text-mkt-text text-3xl">{t(priceKey)}</span>
          <span className="text-xs text-mkt-text opacity-60 mb-1.5">{t(priceSuffixKey)}</span>
        </div>
        <p className="text-xs text-mkt-text opacity-60 min-h-[1rem]">{sublineKey ? t(sublineKey) : ''}</p>
      </div>

      {isCurrent ? (
        <button
          type="button"
          disabled
          className="w-full text-xs text-mkt-text opacity-50 py-3 border border-mkt-divider cursor-default"
        >
          {t(ctaLabelKey)}
        </button>
      ) : (
        <Button
          className={`w-full font-semibold text-sm ${
            isProAi
              ? 'bg-mkt-accent text-white hover:opacity-90'
              : 'text-mkt-text bg-transparent border border-mkt-divider hover:border-mkt-accent'
          }`}
          isLoading={isLoading}
          radius="none"
          variant={isProAi ? undefined : 'bordered'}
          onPress={onCtaPress}
        >
          {t(ctaLabelKey)}
          {isProAi && <FontAwesomeIcon className="ml-2 text-xs" icon={faArrowRight} />}
        </Button>
      )}

      <div className="flex flex-col">
        {features.map((feature) => (
          <div
            key={feature.labelKey}
            className="flex items-center gap-3 py-2.5 border-b border-mkt-divider last:border-0"
          >
            <FontAwesomeIcon
              className={`text-xs w-4 shrink-0 ${feature.included ? 'text-mkt-accent' : 'text-mkt-text opacity-30'}`}
              icon={feature.included ? faCheck : faXmark}
            />
            <span className={`text-sm text-mkt-text ${feature.included ? '' : 'opacity-50'}`}>
              {feature.value ? (
                <>
                  <span className="font-semibold">{feature.value}</span> {t(feature.labelKey)}
                </>
              ) : (
                t(feature.labelKey)
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

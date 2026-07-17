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
  readonly planKey: 'free' | 'pro' | 'pro_ai';
  readonly nameKey: string;
  readonly priceKey: string;
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
      className={`relative flex flex-col gap-6 rounded-lg p-7 transition-colors duration-200 ${
        isProAi
          ? 'bg-navy-950/60 border-2 border-accent/40'
          : 'bg-navy-950/40 border border-navy-700/60'
      }`}
    >
      {isPopular && (
        <div className="absolute top-4 right-4">
          <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20">
            {t('pricing.plan.mostPopular')}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <p className={`text-xs font-medium ${isProAi ? 'text-accent' : 'text-navy-400'}`}>
          {t(nameKey)}
        </p>
        <div className="flex items-end gap-2">
          <span className="font-sora font-extrabold text-white text-3xl">{t(priceKey)}</span>
          <span className="text-xs text-navy-400 mb-1.5">{t('pricing.plan.perMonth')}</span>
        </div>
        <p className="text-xs text-navy-400 min-h-[1rem]">
          {sublineKey ? t(sublineKey) : ''}
        </p>
      </div>

      {isCurrent ? (
        <button
          type="button"
          disabled
          className="w-full text-xs text-navy-600 py-3 rounded border border-navy-800/40 cursor-default"
        >
          {t(ctaLabelKey)}
        </button>
      ) : (
        <Button
          className={`w-full font-sans font-semibold text-sm rounded tracking-wide ${
            isProAi
              ? 'bg-accent hover:bg-electric text-navy-950 transition-colors duration-200'
              : 'text-navy-400 hover:text-white border border-navy-700 hover:border-navy-500'
          }`}
          isLoading={isLoading}
          variant={isProAi ? undefined : 'bordered'}
          onPress={onCtaPress}
        >
          {t(ctaLabelKey)}
          {isProAi && <FontAwesomeIcon className="ml-2 text-xs" icon={faArrowRight} />}
        </Button>
      )}

      <div className="space-y-0">
        {features.map((feature) => (
          <div
            key={feature.labelKey}
            className="flex items-center gap-3 py-2.5 border-b border-navy-800/40 last:border-0"
          >
            <FontAwesomeIcon
              className={`text-xs w-4 shrink-0 ${feature.included ? 'text-accent' : 'text-navy-700'}`}
              icon={feature.included ? faCheck : faXmark}
            />
            <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-navy-400'}`}>
              {feature.value ? (
                <>
                  <span className="font-semibold">{feature.value}</span>{' '}
                  {t(feature.labelKey)}
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

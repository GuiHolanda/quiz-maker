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
        isProAi ? 'bg-white/[0.07] border-2 border-primary/40' : 'bg-white/[0.04] border border-white/10'
      }`}
    >
      {isPopular && (
        <div className="absolute top-4 right-4">
          <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
            {t('pricing.plan.mostPopular')}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <p className={`text-xs font-medium ${isProAi ? 'text-primary' : 'text-slate-400'}`}>{t(nameKey)}</p>
        <div className="flex items-end gap-2">
          <span className="font-sora font-extrabold text-white text-3xl">{t(priceKey)}</span>
          <span className="text-xs text-slate-400 mb-1.5">{t('pricing.plan.perMonth')}</span>
        </div>
        <p className="text-xs text-slate-400 min-h-[1rem]">{sublineKey ? t(sublineKey) : ''}</p>
      </div>

      {isCurrent ? (
        <button
          type="button"
          disabled
          className="w-full text-xs text-slate-600 py-3 rounded border border-white/[0.06] cursor-default"
        >
          {t(ctaLabelKey)}
        </button>
      ) : (
        <Button
          className={`w-full font-sans font-semibold text-sm rounded tracking-wide ${
            isProAi
              ? 'bg-primary hover:opacity-90 text-[#0f172a] transition-opacity duration-200'
              : 'text-slate-400 hover:text-white border border-white/[0.12] hover:border-white/30'
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
            className="flex items-center gap-3 py-2.5 border-b border-white/[0.06] last:border-0"
          >
            <FontAwesomeIcon
              className={`text-xs w-4 shrink-0 ${feature.included ? 'text-primary' : 'text-slate-700'}`}
              icon={feature.included ? faCheck : faXmark}
            />
            <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-slate-400'}`}>
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

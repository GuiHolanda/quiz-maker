'use client';

import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

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
  const isFree = planKey === 'free';

  return (
    <div
      className={`relative flex flex-col gap-6 rounded-xl border p-6 transition-colors duration-200 ${
        isProAi
          ? 'border-primary/40 bg-primary/5'
          : 'bg-content1 border border-default-200'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Chip color="primary" size="sm" variant="flat">
            {t('pricing.plan.mostPopular')}
          </Chip>
        </div>
      )}

      <div className="flex flex-col gap-2 min-h-[6rem]">
        <p className="text-xs font-semibold text-primary">{t(nameKey)}</p>
        <div className="flex items-end gap-1">
          <span className="text-4xl font-extrabold text-foreground">{t(priceKey)}</span>
          {!isFree && (
            <span className="text-sm text-default-400 mb-1">{t('pricing.plan.perMonth')}</span>
          )}
        </div>
        <p className="text-xs text-default-400 min-h-[1rem]">
          {sublineKey ? t(sublineKey) : ''}
        </p>
      </div>

      <Button
        className={isCurrent ? buttonStyles.secondary : buttonStyles.primary}
        disabled={isCurrent}
        isLoading={isLoading}
        size="md"
        variant={isCurrent ? 'bordered' : undefined}
        onPress={onCtaPress}
      >
        {t(ctaLabelKey)}
      </Button>

      <div className="flex flex-col gap-3">
        {features.map((feature) => (
          <div key={feature.labelKey} className="flex items-center gap-3">
            <FontAwesomeIcon
              className={feature.included ? 'text-success' : 'text-default-300'}
              icon={feature.included ? faCheck : faXmark}
            />
            <span className="text-sm text-default-500">
              {feature.value ? (
                <>
                  <span className="font-semibold text-foreground">{feature.value}</span>{' '}
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

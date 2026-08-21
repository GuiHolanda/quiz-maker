'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';
import { Button } from '@heroui/button';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface NewExamHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly stepLabel?: string;
  readonly activeStep?: 1 | 2 | 3;
  readonly isStepRunning?: boolean;
  readonly showStepper?: boolean;
  readonly cancelHref?: string;
  readonly onCancel?: () => void;
  readonly actions?: ReactNode;
}

export function NewExamHeader({
  title,
  subtitle,
  stepLabel,
  activeStep = 1,
  isStepRunning = false,
  showStepper = true,
  cancelHref,
  onCancel,
  actions,
}: NewExamHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mt-5 pb-6 border-b border-divider">
      <div className="flex flex-col gap-3.5">
        {showStepper && (
          <div className="flex items-center gap-3.5">
            <span className="text-xs font-semibold text-primary">{stepLabel ?? t('exam.newStepIndicator')}</span>
            <div className="flex gap-[5px] w-[180px]">
              {([1, 2, 3] as const).map((step) => (
                <div key={step} className="flex-1 h-[3px] rounded-full bg-content2 overflow-hidden">
                  {step < activeStep ? (
                    <div className="w-full h-full bg-primary" />
                  ) : step === activeStep ? (
                    isStepRunning ? (
                      <div className="w-1/3 h-full bg-primary step-sweep" />
                    ) : (
                      <div className="w-full h-full bg-primary" />
                    )
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
        <h1 className="page-header-title tracking-tight max-w-[640px] text-balance">{title}</h1>
        <p className="text-base leading-relaxed text-default-500 max-w-4xl text-pretty">
          {subtitle ?? t('exam.aiSeedSubtitle')}
        </p>
      </div>
      {actions ? (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      ) : onCancel ? (
        <Button
          className={`${buttonStyles.secondary} shrink-0`}
          data-testid="seed-loading-cancel-btn"
          size="sm"
          variant="bordered"
          onPress={onCancel}
        >
          {t('exam.loadingCancel')}
        </Button>
      ) : cancelHref ? (
        <Link
          className="text-sm border border-divider rounded-md px-4 py-2 text-default-800 font-bold hover:text-foreground shrink-0"
          href={cancelHref}
        >
          {t('common.back')}
        </Link>
      ) : null}
    </div>
  );
}

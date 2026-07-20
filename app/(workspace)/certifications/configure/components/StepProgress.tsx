'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Chip } from '@heroui/chip';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface StepProgressProps {
  readonly currentStep: 1 | 2 | 3;
}

const STEP_KEYS = ['certification.step1Title', 'certification.step2Title', 'certification.step3Title'] as const;

export function StepProgress({ currentStep }: StepProgressProps) {
  const { t } = useTranslation();
  const percent = Math.round((currentStep / 3) * 100);
  const title = t(STEP_KEYS[currentStep - 1]);
  const isComplete = percent === 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-end">
        <span className="text-sm font-semibold text-foreground">
          {t('certification.stepProgress', { current: String(currentStep), total: '3', title })}
        </span>
        <AnimatePresence mode="wait">
          <motion.div
            key={isComplete ? 'complete' : 'progress'}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            initial={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Chip color={isComplete ? 'success' : 'primary'} size="sm" variant="flat">
              <span className="text-xs font-extrabold">
                {t('certification.percentComplete', { percent: String(percent) })}
              </span>
            </Chip>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="w-full h-1.5 bg-content2 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${percent}%` }}
          className={`h-full rounded-full ${isComplete ? 'bg-success' : 'bg-primary'}`}
          initial={false}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

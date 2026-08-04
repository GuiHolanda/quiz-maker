'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';

interface SidebarUsageCountersProps {
  readonly isCollapsed?: boolean;
}

export function SidebarUsageCounters({ isCollapsed }: SidebarUsageCountersProps) {
  const { t } = useTranslation();
  const { usage } = useUsageContext();

  if (!usage) return null;

  const questionsUnlimited = usage.questionsLimit === -1;
  const examsUnlimited = usage.examsLimit === -1;
  const usageRatio = questionsUnlimited ? 0 : usage.questionsUsed / usage.questionsLimit;
  const progressColor = usageRatio > 0.9 ? 'bg-danger' : usageRatio > 0.7 ? 'bg-warning' : 'bg-primary';

  return (
    <div className={`border-t border-divider px-4 py-4 flex flex-col gap-3 shrink-0 ${isCollapsed ? 'hidden' : ''}`}>
      {/* Questions counter */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-default-400">{t('sidebar.questionsUsed')}</span>
          <span className="text-xs font-medium text-foreground">
            {questionsUnlimited ? '∞' : `${usage.questionsUsed}/${usage.questionsLimit}`}
          </span>
        </div>
        {!questionsUnlimited && (
          <div className="w-full h-1 bg-default-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
              style={{ width: `${Math.min(100, Math.round(usageRatio * 100))}%` }}
            />
          </div>
        )}
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs text-default-400">
            {t('sidebar.questionsGenerated', { count: usage.questionsUsed })}
          </span>
          <span className="text-xs text-default-400">
            {t('sidebar.questionsSavedInLibrary', { count: usage.questionsSavedInLibrary })}
          </span>
        </div>
      </div>

      {/* Exams counter */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-default-400">{t('sidebar.examsUsed')}</span>
          <span className="text-xs font-medium text-foreground">
            {examsUnlimited ? '∞' : `${usage.examsUsed}/${usage.examsLimit}`}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs text-default-400">
            {t('sidebar.certificationsUsed')} {usage.certificationsUsed}
          </span>
          <span className="text-xs text-default-400">
            {t('sidebar.publicExamsUsed')} {usage.publicExamsUsed}
          </span>
        </div>
      </div>
    </div>
  );
}

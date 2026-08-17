'use client';

import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHashtag, faClock, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';
import { DemoProgressBar } from './DemoProgressBar';
import type { DemoCatalogExam } from '@/shared/types';

interface DemoCertCardProps {
  readonly exam: DemoCatalogExam;
  readonly isSelected: boolean;
  readonly onSelect: () => void;
}

export function DemoCertCard({ exam, isSelected, onSelect }: DemoCertCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      isPressable
      className={`flex flex-col gap-6 p-6 blueprint rounded-none overflow-visible transition-colors ${isSelected ? '!border-mkt-accent bg-mkt-accent/5' : '!border-mkt-divider bg-mkt-bg hover:!border-mkt-accent/50'}`}
      onPress={onSelect}
      shadow="none"
      data-sel={isSelected ? '1' : undefined}
      classNames={{
        base: `blueprint rounded-none overflow-visible transition-colors ${isSelected ? '!border-mkt-accent bg-mkt-accent/5' : '!border-mkt-divider bg-mkt-bg hover:!border-mkt-accent/50'}`,
      }}
    >
      <BlueprintCorners />
      <CardHeader className="flex gap-2 text-start p-0">
        <div className="flex items-center gap-4 w-full">
          <div className="w-14 h-14 flex-shrink-0 bg-mkt-surface border border-mkt-divider flex items-center justify-center p-2">
            {exam.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={exam.logoUrl} alt="" className="max-w-full max-h-full object-contain" loading="lazy" />
            ) : (
              <span className="mono text-xs font-bold text-mkt-text">{exam.mark}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-mkt-text font-semibold text-lg leading-snug">{exam.name}</p>
            <p className="text-mkt-text opacity-50 text-xs mt-0.5">
              {exam.vendor}
              {exam.year && ` · ${exam.year}`}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="flex flex-col gap-4 p-0">
        <div className="flex gap-4 flex-wrap border-y py-4 border-mkt-divider">
          <span className="mono text-xs text-mkt-text opacity-60 flex items-center gap-1">
            <FontAwesomeIcon icon={faHashtag} className="w-3 h-3" />
            {t('demo.card.questions', { n: exam.questions })}
          </span>
          <span className="mono text-xs text-mkt-text opacity-60 flex items-center gap-1">
            <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
            {t('demo.card.minutes', { n: exam.minutes })}
          </span>
          {exam.passing && (
            <span className="mono text-xs text-mkt-accent flex items-center gap-1">
              <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3" />
              {t('demo.card.passing', { value: exam.passing })}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-mkt-accent text-sm font-semibold">{t('demo.card.domainsHeading')}</span>
            <span className="mono text-xs text-mkt-text opacity-40 border border-mkt-divider px-1.5">
              {t('demo.card.domainsCount', { n: exam.domains.length })}
            </span>
          </div>
          <div className="space-y-1.5">
            {exam.domains.map((domain) => (
              <div key={domain.name} className="flex items-center gap-2">
                <span className="text-sm text-mkt-text opacity-70 flex-1 min-w-0 truncate">{domain.name}</span>
                <DemoProgressBar pct={domain.weight} className="w-48 h-1 flex-shrink-0" />
                <span className="mono text-xs text-mkt-text opacity-50 w-8 text-right flex-shrink-0">
                  {domain.weight}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardBody>

      <CardFooter className="p-0 pt-6 border-t border-mkt-divider">
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-mkt-text opacity-40">
            {t('demo.card.updated')} <RelativeDate date={exam.updatedAt} />
          </span>
          <span className="mono text-xs text-mkt-text opacity-40 uppercase tracking-widest">
            {t('demo.card.select')}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}

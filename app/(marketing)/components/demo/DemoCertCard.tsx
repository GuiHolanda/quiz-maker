'use client';

import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHashtag, faClock, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';
import type { DemoCert } from './data/demoCatalog';

interface DemoCertCardProps {
  readonly cert: DemoCert;
  readonly isSelected: boolean;
  readonly onSelect: () => void;
}

export function DemoCertCard({ cert, isSelected, onSelect }: DemoCertCardProps) {
  return (
    <Card
      isPressable
      onPress={onSelect}
      shadow="none"
      data-sel={isSelected ? '1' : undefined}
      classNames={{
        base: `rounded-none border transition-colors ${isSelected ? 'border-mkt-accent bg-mkt-accent/5' : 'border-mkt-divider bg-mkt-bg hover:border-mkt-accent/50'}`,
        header: 'rounded-none px-5 pt-5 pb-3 flex-col items-start gap-0',
        body: 'rounded-none px-5 pt-0 pb-4',
        footer: 'rounded-none px-5 py-3 border-t border-mkt-divider',
      }}
    >
      <CardHeader>
        <BlueprintCorners />

        <div className="flex items-start gap-4 w-full">
          <div className="w-14 h-14 flex-shrink-0 bg-mkt-surface border border-mkt-divider flex items-center justify-center">
            <span className="mono text-xs font-bold text-mkt-text">{cert.mark}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-mkt-text font-semibold text-sm leading-snug">{cert.name}</p>
            <p className="text-mkt-text opacity-50 text-xs mt-0.5">
              {cert.vendor} · {cert.year}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardBody>
        <div className="flex gap-4 flex-wrap mb-4">
          <span className="mono text-xs text-mkt-text opacity-60 flex items-center gap-1">
            <FontAwesomeIcon icon={faHashtag} className="w-3 h-3" />
            {cert.questions} questões
          </span>
          <span className="mono text-xs text-mkt-text opacity-60 flex items-center gap-1">
            <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
            {cert.minutes} min
          </span>
          <span className="mono text-xs text-mkt-accent flex items-center gap-1">
            <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3" />
            Aprovação: {cert.passing}
          </span>
        </div>

        <div className="border-t border-mkt-divider pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="kick text-[10px]">Domínios de estudo</span>
            <span className="mono text-xs text-mkt-text opacity-40 border border-mkt-divider px-1.5">
              {cert.domains.length} domínios
            </span>
          </div>
          <div className="space-y-1.5">
            {cert.domains.map((domain) => (
              <div key={domain.name} className="flex items-center gap-2">
                <span className="text-xs text-mkt-text opacity-70 flex-1 min-w-0 truncate">{domain.name}</span>
                <div className="w-28 h-1 bg-mkt-divider flex-shrink-0">
                  <div className="h-full bg-mkt-accent" style={{ width: `${domain.weight}%` }} />
                </div>
                <span className="mono text-xs text-mkt-text opacity-50 w-8 text-right flex-shrink-0">
                  {domain.weight}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardBody>

      <CardFooter>
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-mkt-text opacity-40">{cert.updated}</span>
          <span className="mono text-xs text-mkt-text opacity-40 uppercase tracking-widest">Selecionar</span>
        </div>
      </CardFooter>
    </Card>
  );
}

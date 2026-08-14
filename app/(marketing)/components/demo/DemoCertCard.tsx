import { BlueprintCorners } from '@/app/(marketing)/components/shared/BlueprintCorners';
import type { DemoCert } from './data/demoCatalog';

interface DemoCertCardProps {
  readonly cert: DemoCert;
  readonly isSelected: boolean;
  readonly onSelect: () => void;
}

export function DemoCertCard({ cert, isSelected, onSelect }: DemoCertCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect();
      }}
      data-sel={isSelected ? '1' : undefined}
      className={`relative cursor-pointer p-5 transition-colors ${
        isSelected
          ? 'border border-mkt-accent bg-mkt-accent/5'
          : 'border border-mkt-divider bg-mkt-bg hover:border-mkt-accent/50'
      }`}
    >
      <BlueprintCorners />

      <div className="flex items-start gap-4">
        {/* Mark badge */}
        <div className="w-14 h-14 flex-shrink-0 bg-mkt-surface border border-mkt-divider flex items-center justify-center">
          <span className="mono text-xs font-bold text-mkt-text">{cert.mark}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-mkt-text font-semibold text-sm leading-snug">{cert.name}</p>
          <p className="text-mkt-text opacity-50 text-xs mt-0.5">
            {cert.vendor} · {cert.year}
          </p>

          <div className="flex gap-4 mt-3 flex-wrap">
            <span className="mono text-xs text-mkt-text opacity-60">{cert.questions}q</span>
            <span className="mono text-xs text-mkt-text opacity-60">{cert.minutes}min</span>
            <span className="mono text-xs text-mkt-accent">{cert.passing}</span>
            <span className="mono text-xs text-mkt-text opacity-40 border border-mkt-divider px-1.5">
              {cert.track}
            </span>
          </div>
        </div>
      </div>

      {/* Domains */}
      <div className="mt-4 border-t border-mkt-divider pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="kick text-[10px]">Domínios</span>
          <span className="mono text-xs text-mkt-text opacity-40">{cert.domains.length}</span>
        </div>
        <div className="space-y-1.5">
          {cert.domains.map((domain) => (
            <div key={domain.name} className="flex items-center gap-2">
              <span className="text-xs text-mkt-text opacity-70 flex-1 min-w-0 truncate">
                {domain.name}
              </span>
              <div className="w-16 h-1 bg-mkt-divider flex-shrink-0">
                <div className="h-full bg-mkt-accent" style={{ width: `${domain.weight}%` }} />
              </div>
              <span className="mono text-xs text-mkt-text opacity-50 w-8 text-right flex-shrink-0">
                {domain.weight}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

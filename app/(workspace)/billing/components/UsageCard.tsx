'use client';

interface UsageCardProps {
  readonly label: string;
  readonly used: number;
  readonly limit: number | null;
  readonly limitLabel: string;
}

export function UsageCard({ label, used, limit, limitLabel }: UsageCardProps) {
  const isUnlimited = limit === null || limit === -1;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit!) * 100));

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-6">
      <p className="text-xs font-semibold text-primary mb-3">{label}</p>
      <div className="flex items-end justify-between mb-3">
        <span className="text-3xl font-extrabold text-foreground">{used}</span>
        <span className="text-sm text-default-400">/ {limitLabel}</span>
      </div>
      {!isUnlimited && (
        <div className="w-full h-1.5 bg-default-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

'use client';

interface DemoStepHeaderProps {
  readonly kick: string;
  readonly heading: string;
  readonly headingSize?: '4xl' | '5xl';
  readonly subtext?: string;
  readonly note?: string;
}

export function DemoStepHeader({ kick, heading, headingSize = '4xl', subtext, note }: DemoStepHeaderProps) {
  return (
    <>
      <span className="kick">{kick}</span>
      <h1 className={`ds-heading text-mkt-text text-${headingSize} mt-2`}>{heading}</h1>
      {subtext && <p className="text-mkt-text opacity-60 text-sm mt-3">{subtext}</p>}
      {note && <p className="mono text-xs text-mkt-text opacity-50 mt-1">{note}</p>}
    </>
  );
}

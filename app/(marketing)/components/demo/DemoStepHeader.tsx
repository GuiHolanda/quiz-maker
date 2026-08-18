'use client';

interface DemoStepHeaderProps {
  readonly kick: string;
  readonly heading: string;
  readonly headingSize?: '4xl' | '5xl';
  readonly subtext?: string;
  readonly note?: string;
  // The Suspense fallback ships in the initial HTML alongside the resolved content, so a
  // skeleton that also rendered an <h1> gave crawlers two identical H1s on /demo. Loading
  // placeholders pass "presentational" and render a <p> instead.
  readonly as?: 'h1' | 'presentational';
}

export function DemoStepHeader({
  kick,
  heading,
  headingSize = '4xl',
  subtext,
  note,
  as = 'h1',
}: DemoStepHeaderProps) {
  const headingClass = `ds-heading text-mkt-text text-${headingSize} mt-2`;

  return (
    <>
      <span className="kick">{kick}</span>
      {as === 'h1' ? (
        <h1 className={headingClass}>{heading}</h1>
      ) : (
        <p aria-hidden="true" className={headingClass}>
          {heading}
        </p>
      )}
      {subtext && <p className="text-mkt-text opacity-60 text-sm mt-3">{subtext}</p>}
      {note && <p className="mono text-xs text-mkt-text opacity-50 mt-1">{note}</p>}
    </>
  );
}

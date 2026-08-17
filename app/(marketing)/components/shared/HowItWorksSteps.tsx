interface HowItWorksStep {
  readonly num: string;
  readonly title: string;
  readonly body: string;
}

interface HowItWorksStepsProps {
  readonly sectionId: string;
  readonly kick: string;
  readonly title: string;
  readonly subtitle: string;
  readonly steps: ReadonlyArray<HowItWorksStep>;
  readonly surface?: 'bg' | 'surface';
  readonly maxWidth?: 'max-w-6xl' | 'max-w-7xl';
}

const SURFACE_CLASSES = { bg: 'bg-mkt-bg', surface: 'bg-mkt-surface' } as const;

export function HowItWorksSteps({
  sectionId,
  kick,
  title,
  subtitle,
  steps,
  surface = 'bg',
  maxWidth = 'max-w-7xl',
}: HowItWorksStepsProps) {
  return (
    <section id={sectionId} className={`scroll-mt-24 py-20 border-t border-mkt-divider ${SURFACE_CLASSES[surface]}`}>
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
        <span className="kick mb-2">{kick}</span>
        <h2 className="ds-heading text-mkt-text text-3xl mt-1 mb-3">{title}</h2>
        <p className="text-mkt-text opacity-60 text-base max-w-2xl mb-12">{subtitle}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {steps.map((step, index) => (
            <div
              key={step.num}
              className={`border-t-2 pt-5 ${index === 0 ? 'border-mkt-accent' : 'border-mkt-divider'}`}
            >
              <span className="kick">{step.num}</span>
              <h3 className="ds-heading text-[19px] text-mkt-text mt-3 mb-2">{step.title}</h3>
              <p className="text-sm text-mkt-text opacity-55 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

interface ExamSeedPathCardProps {
  readonly icon: IconDefinition;
  readonly title: string;
  readonly body: string;
  readonly cta: string;
  readonly href?: string;
  readonly onPress?: () => void;
  readonly testId?: string;
}

const cardClassName =
  'block w-full text-left bg-content1 border border-default-200 rounded-xl p-5 hover:bg-content2 hover:border-default-300 transition-colors duration-200';

function CardContent({ icon, title, body, cta }: Omit<ExamSeedPathCardProps, 'href' | 'onPress' | 'testId'>) {
  return (
    <>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <FontAwesomeIcon className="w-3.5 h-3.5 text-primary" icon={icon} />
        </div>
        <div className="text-lg font-bold tracking-tight">{title}</div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-default-500">{body}</p>
      <div className="mt-4 text-sm font-bold text-primary">
        {cta} <FontAwesomeIcon className="w-3.5 h-3.5 text-primary ms-1" icon={faArrowRight} />
      </div>
    </>
  );
}

export function ExamSeedPathCard({ icon, title, body, cta, href, onPress, testId }: ExamSeedPathCardProps) {
  if (href) {
    return (
      <Link className={cardClassName} data-testid={testId} href={href}>
        <CardContent body={body} cta={cta} icon={icon} title={title} />
      </Link>
    );
  }

  return (
    <button className={cardClassName} data-testid={testId} type="button" onClick={onPress}>
      <CardContent body={body} cta={cta} icon={icon} title={title} />
    </button>
  );
}

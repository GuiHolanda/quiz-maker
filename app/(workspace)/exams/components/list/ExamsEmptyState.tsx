'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@heroui/button';
import NextLink from 'next/link';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface ExamsEmptyStateProps {
  readonly type: 'certification' | 'public_exam';
  readonly icon: IconDefinition;
  readonly title: string;
  readonly description: string;
  readonly addHref: string;
  readonly addLabel: string;
}

export function ExamsEmptyState({ icon, title, description, addHref, addLabel }: ExamsEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20 bg-content1 border border-default-200 rounded-xl text-center px-6">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <FontAwesomeIcon className="text-primary w-7 h-7" icon={icon} />
      </div>
      <div className="flex flex-col gap-2 max-w-md">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-default-500">{description}</p>
      </div>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <Button as={NextLink} className={buttonStyles.primary} href={addHref} startContent={<span>+</span>}>
          {addLabel}
        </Button>
        <Button
          as={NextLink}
          className={buttonStyles.secondary}
          endContent={<FontAwesomeIcon className="w-3 h-3" icon={faArrowRight} />}
          href="/questions"
          variant="bordered"
        >
          {t('exam.browseCatalog')}
        </Button>
      </div>
    </div>
  );
}

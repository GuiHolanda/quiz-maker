'use client';

import NextLink from 'next/link';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useSession } from 'next-auth/react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

export function CtaSectionCta() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <Button
        as={NextLink}
        className="font-semibold text-sm bg-accent hover:bg-electric text-navy-950 rounded tracking-wide w-full sm:w-auto transition-colors duration-200"
        href={session?.user ? '/simulados' : '/register'}
        size="lg"
      >
        {t('homepage.cta2.generateQuiz')}
        <FontAwesomeIcon className="ml-2 text-xs" icon={faArrowRight} />
      </Button>
      {session?.user && (
        <Button
          as={NextLink}
          className="font-medium text-sm text-navy-400 hover:text-white border border-navy-700 hover:border-navy-600 rounded tracking-wide"
          href="/exams"
          size="lg"
          variant="bordered"
        >
          {t('homepage.cta2.setupCertification')}
        </Button>
      )}
    </div>
  );
}

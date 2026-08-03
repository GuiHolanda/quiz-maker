'use client';

import NextLink from 'next/link';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faPlay } from '@fortawesome/free-solid-svg-icons';
import { useSession } from 'next-auth/react';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

export function HeroCta() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-10">
      <Button
        as={NextLink}
        className="font-semibold text-sm bg-accent hover:bg-electric text-navy-950 rounded tracking-wide transition-colors duration-200"
        href={session?.user ? '/simulados' : '/register'}
        size="lg"
      >
        {t('homepage.cta.startFreeTrial')}
        <FontAwesomeIcon className="ml-2 text-xs" icon={faArrowRight} />
      </Button>
      <Button
        as={NextLink}
        className="font-medium text-sm text-navy-400 hover:text-white border border-navy-700 hover:border-navy-600 rounded tracking-wide"
        href={session?.user ? '/questions' : '#demo-terminal'}
        size="lg"
        variant="bordered"
      >
        <FontAwesomeIcon className="text-xs mr-2 text-accent" icon={faPlay} />
        {t('homepage.cta.viewSampleQuestions')}
      </Button>
    </div>
  );
}

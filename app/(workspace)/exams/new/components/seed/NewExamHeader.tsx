'use client';

import Link from 'next/link';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface NewExamHeaderProps {
  readonly title: string;
  readonly cancelHref: string;
}

// Tela 1 header: literal "Etapa 1 de 3" (Tela 2 = revisar/formatar, geração de questões = 3),
// matching the imported design. Static — this page never advances past step 1.
export function NewExamHeader({ title, cancelHref }: NewExamHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mt-5 pb-6 border-b border-divider">
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center gap-3.5">
          <span className="font-mono text-[11px] uppercase tracking-widest text-primary">
            {t('exam.newStepIndicator')}
          </span>
          <div className="flex gap-[5px] w-[180px]">
            <div className="flex-1 h-[3px] rounded-full bg-primary" />
            <div className="flex-1 h-[3px] rounded-full bg-content2" />
            <div className="flex-1 h-[3px] rounded-full bg-content2" />
          </div>
        </div>
        <h1 className="page-header-title tracking-tight max-w-[640px] text-balance">{title}</h1>
        <p className="text-base leading-relaxed text-default-500 max-w-[600px] text-pretty">
          {t('exam.aiSeedSubtitle')}
        </p>
      </div>
      <Link className="text-sm text-default-500 hover:text-foreground shrink-0" href={cancelHref}>
        {t('common.cancel')}
      </Link>
    </div>
  );
}

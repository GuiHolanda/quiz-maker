'use client';

import NextLink from 'next/link';
import Image from 'next/image';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { getPlanLabel } from '@/shared/lib/planLabel';

interface SidebarBrandLockupProps {
  readonly onClick?: () => void;
}

export function SidebarBrandLockup({ onClick }: SidebarBrandLockupProps) {
  const { usage } = useUsageContext();
  const { t } = useTranslation();
  const planLabel = usage ? getPlanLabel(usage.plan, t) : null;

  return (
    <NextLink className="flex items-center gap-2.5 flex-1 min-w-0" href="/" onClick={onClick}>
      <Image alt="CertifiqueAI" className="rounded-md shrink-0" height={28} src="/icon.svg" width={28} />
      <div className="min-w-0">
        <p className="font-sora font-semibold text-foreground tracking-wide text-sm truncate leading-tight">
          Certifique AI
        </p>
        {planLabel && (
          <p className="font-mono text-[10px] text-navy-500 uppercase tracking-widest truncate">{planLabel}</p>
        )}
      </div>
    </NextLink>
  );
}

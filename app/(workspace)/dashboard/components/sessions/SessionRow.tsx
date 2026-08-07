'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { Chip } from '@heroui/chip';

import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import type { DashboardRecentSession } from '@/shared/types';

interface SessionRowProps {
  readonly session: DashboardRecentSession;
}

function scoreColor(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 70) return 'success';
  if (score >= 50) return 'warning';
  return 'danger';
}

export function SessionRow({ session }: SessionRowProps) {
  const durationMin = Math.round(session.durationMs / 60000);

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-content2 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-content2 border border-default-200 flex items-center justify-center shrink-0">
        <FontAwesomeIcon className="text-primary text-xs" icon={faPlay} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-xs truncate">{session.simuladoName}</p>
        <p className="font-mono text-[9px] text-default-400 truncate">
          <RelativeDate date={session.finishedAt} /> · {durationMin}m · {session.totalQuestions}q
        </p>
      </div>
      <div className="shrink-0">
        <Chip color={scoreColor(session.score)} size="sm" variant="flat">
          {session.score}%
        </Chip>
      </div>
    </div>
  );
}

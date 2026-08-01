'use client';
import {
  faBullseye,
  faClock,
  faHashtag,
  faLayerGroup,
  faGraduationCap,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Chip } from '@heroui/chip';

import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { Exam } from '@/shared/types';

interface CertificationCardProps {
  readonly cert: Exam;
  readonly isSelected: boolean;
  readonly onClick: () => void;
}

export function CertificationCard({ cert, isSelected, onClick }: CertificationCardProps) {
  const { t } = useTranslation();
  const hasNoTopics = cert.sections.length === 0;
  const initials = cert.provider?.name
    ? cert.provider.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')
    : null;

  const hasStats = cert.totalQuestions > 0 || !!cert.examDurationMinutes || cert.passingScore != null;

  return (
    <button
      aria-expanded={isSelected}
      aria-label={cert.name}
      className={[
        'group text-left w-full bg-content1 border rounded-xl p-4 transition-all duration-150 hover:bg-content2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
        isSelected
          ? 'border-primary bg-content2 ring-1 ring-primary/20'
          : 'border-default-200 hover:border-default-300',
      ].join(' ')}
      type="button"
      onClick={onClick}
    >
      <div className="flex items-start gap-3 mb-4">
        {renderProviderLogo()}
        <div className="flex-1 min-w-0 pt-0.5">
          <span className="block text-sm font-semibold text-foreground leading-snug line-clamp-2">{cert.name}</span>
          {cert.provider?.name && (
            <span className="block text-xs text-default-400 truncate mt-0.5">{cert.provider.name}</span>
          )}
        </div>
        {hasNoTopics ? (
          <Chip className="shrink-0 mt-0.5" color="warning" size="sm" variant="flat">
            {t('certification.noTopics')}
          </Chip>
        ) : (
          <Chip className="shrink-0 mt-0.5" color="primary" size="sm" variant="flat">
            <span className="flex items-center gap-1">
              <FontAwesomeIcon className="text-[9px]" icon={faLayerGroup} />
              {cert.sections.length}
            </span>
          </Chip>
        )}
      </div>

      {hasStats && (
        <div className="flex flex-wrap gap-2">
          {cert.totalQuestions > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-content2 border border-default-200 text-xs text-default-500 group-hover:border-default-300 transition-colors duration-150">
              <FontAwesomeIcon className="text-[9px] text-default-400" icon={faHashtag} />
              {t('certification.questionsCount', { count: String(cert.totalQuestions) })}
            </span>
          )}
          {cert.examDurationMinutes && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-content2 border border-default-200 text-xs text-default-500 group-hover:border-default-300 transition-colors duration-150">
              <FontAwesomeIcon className="text-[9px] text-default-400" icon={faClock} />
              {t('certification.durationValue', { minutes: String(cert.examDurationMinutes) })}
            </span>
          )}
          {cert.passingScore != null && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/8 border border-primary/20 text-xs text-primary font-medium transition-colors duration-150">
              <FontAwesomeIcon className="text-[9px]" icon={faBullseye} />
              {t('certification.passingScoreValue', { score: String(cert.passingScore) })}
            </span>
          )}
        </div>
      )}

      {cert.createdAt && (
        <div className={`text-xs text-default-400 ${hasStats ? 'mt-3 pt-3 border-t border-default-200' : 'mt-1'}`}>
          <RelativeDate date={cert.updatedAt && cert.updatedAt !== cert.createdAt ? cert.updatedAt : cert.createdAt} />
        </div>
      )}
    </button>
  );

  function renderProviderLogo() {
    if (cert.provider?.logoUrl) {
      return (
        <div className="w-10 h-10 rounded-xl bg-content2 border border-default-200 flex items-center justify-center shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={cert.provider.name} className="w-8 h-8 object-contain" src={cert.provider.logoUrl} />
        </div>
      );
    }

    if (initials) {
      return (
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-primary leading-none tracking-tight">{initials}</span>
        </div>
      );
    }

    return (
      <div className="w-10 h-10 rounded-xl bg-content2 border border-default-200 flex items-center justify-center shrink-0">
        <FontAwesomeIcon className="text-sm text-default-400" icon={faGraduationCap} />
      </div>
    );
  }
}

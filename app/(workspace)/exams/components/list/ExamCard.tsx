'use client';

import { useState } from 'react';
import {
  faCheckCircle,
  faClock,
  faHashtag,
  faLayerGroup,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, CardBody } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Button } from '@heroui/button';

import { ExamCardDomainsPanel } from './ExamCardDomainsPanel';
import { ExamCardActionsMenu } from './ExamCardActionsMenu';

import { ProgressTrack } from '@/shared/components/ui/ProgressTrack';
import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import type { Exam, ExamStatus } from '@/shared/types';

interface ExamCardProps {
  readonly exam: Exam;
  readonly canEdit: boolean;
  readonly onDelete: () => void;
  readonly onUpgradeRequired: () => void;
}

const STATUS_COLOR: Record<ExamStatus, 'success' | 'warning' | 'default'> = {
  active: 'success',
  draft: 'warning',
  completed: 'default',
};

const STATUS_LABEL_KEY: Record<ExamStatus, string> = {
  active: 'exam.statusActive',
  draft: 'exam.statusDraft',
  completed: 'exam.statusCompleted',
};

function readinessNoteKey(exam: Exam): string {
  if (exam.status === 'draft') return 'exam.readinessNoteDraft';
  if (exam.status === 'completed') return 'exam.readinessNoteCompleted';
  if ((exam.readinessPercent ?? 0) >= 75) return 'exam.readinessNoteCovered';

  return 'exam.readinessNoteGaps';
}

export function ExamCard({ exam, canEdit, onDelete, onUpgradeRequired }: ExamCardProps) {
  const { t } = useTranslation();
  const [isDomainsOpen, setIsDomainsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const status = exam.status ?? 'active';
  const referenceEntity = exam.provider ?? exam.examBoard;
  const readiness = exam.readinessPercent ?? 0;

  return (
    <Card
      className="bg-content1 rounded-xl border border-default-200 dark:border-transparent"
      data-testid="exam-card"
      disableAnimation
      shadow="none"
    >
      <CardBody className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_240px_auto] gap-6 items-start">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Chip color="default" size="sm" variant="bordered">
                {exam.type === 'certification' ? t('nav.certifications') : t('nav.publicExams')}
              </Chip>
              <Chip color={STATUS_COLOR[status]} size="sm" variant="flat">
                {t(STATUS_LABEL_KEY[status])}
              </Chip>
            </div>
            <p className="mt-2 text-lg font-bold text-foreground truncate">{exam.name}</p>
            <p className="mt-1 font-mono text-xs text-default-400 truncate">
              {[referenceEntity?.name, exam.key].filter(Boolean).join(' · ')}
            </p>
            <div className="mt-3 flex items-center divide-x divide-default-200 dark:divide-default-100/10 text-sm">
              <div className="flex items-baseline gap-1.5 pr-4">
                <span className="font-mono text-foreground">
                  {(exam.generatedQuestionsCount ?? 0).toLocaleString('pt-BR')}
                </span>
                <span className="text-default-500">{t('exam.questionBankStat')}</span>
              </div>
              <div className="flex items-baseline gap-1.5 px-4">
                <span className="font-mono text-foreground">
                  {exam.accuracyPercent == null ? '—' : `${exam.accuracyPercent}%`}
                </span>
                <span className="text-default-500">{t('dashboard.accuracy')}</span>
              </div>
              <div className="flex items-baseline gap-1.5 pl-4">
                <span className="font-mono text-foreground">{exam.simuladosCount ?? 0}</span>
                <span className="text-default-500">{t('nav.simulados')}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold text-default-400">{t('exam.readinessLabel')}</span>
              <span className="font-mono text-sm text-foreground">{readiness}%</span>
            </div>
            <ProgressTrack
              className="mt-2"
              fillClass={readiness >= 75 ? 'bg-success' : readiness >= 40 ? 'bg-warning' : 'bg-default-300'}
              heightClass="h-[7px]"
              trackClass="bg-background"
              value={readiness}
            />
            <p className="mt-2 text-xs text-default-500 leading-snug">{t(readinessNoteKey(exam))}</p>
          </div>

          <Button
            isIconOnly
            aria-label={t('common.expand')}
            className={buttonStyles.iconOnly.neutral}
            data-testid="exam-card-menu-toggle"
            size="sm"
            onPress={() => setIsMenuOpen((open) => !open)}
          >
            <FontAwesomeIcon icon={isMenuOpen ? faChevronUp : faChevronDown} />
          </Button>
        </div>

        <div className="mt-4 pt-3 border-t border-default-200 dark:border-transparent flex items-center gap-5 flex-wrap text-sm text-default-500">
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon className="text-default-400" icon={faHashtag} size="sm" />
            {t('certification.questionsCount', { count: String(exam.totalQuestions) })}
          </span>
          {exam.examDurationMinutes && (
            <span className="inline-flex items-center gap-1.5">
              <FontAwesomeIcon className="text-default-400" icon={faClock} size="sm" />
              {t('certification.durationValue', { minutes: String(exam.examDurationMinutes) })}
            </span>
          )}
          {exam.passingScore != null && (
            <span className="inline-flex items-center gap-1.5 text-primary font-semibold">
              <FontAwesomeIcon icon={faCheckCircle} size="sm" />
              {t('certification.passingScoreValue', { score: String(exam.passingScore) })}
            </span>
          )}
          {exam.lastActivityAt && (
            <span className="text-xs text-default-400">
              <RelativeDate date={exam.lastActivityAt} />
            </span>
          )}
          {exam.sections.length > 0 && (
            <Button
              className={`${buttonStyles.flat} ml-auto`}
              data-testid="exam-card-domains-toggle"
              endContent={
                <FontAwesomeIcon className="text-[10px]" icon={isDomainsOpen ? faChevronUp : faChevronDown} />
              }
              size="sm"
              startContent={<FontAwesomeIcon className="text-xs" icon={faLayerGroup} />}
              onPress={() => setIsDomainsOpen((open) => !open)}
            >
              {t('exam.domainsCount', { count: String(exam.sections.length) })}
            </Button>
          )}
        </div>

        {isDomainsOpen && exam.sections.length > 0 && <ExamCardDomainsPanel sections={exam.sections} />}
        {isMenuOpen && (
          <ExamCardActionsMenu
            canEdit={canEdit}
            exam={exam}
            onDelete={onDelete}
            onUpgradeRequired={onUpgradeRequired}
          />
        )}
      </CardBody>
    </Card>
  );
}

'use client';

import { Button } from '@heroui/button';
import { Divider } from '@heroui/divider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faClock, faDatabase, faLayerGroup, faXmark } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import type { CatalogExam } from '@/shared/types';

interface CatalogExamDetailProps {
  readonly exam: CatalogExam;
  readonly onClose: () => void;
}

export function CatalogExamDetail({ exam, onClose }: CatalogExamDetailProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-content1 border border-default-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-default-200 bg-content2">
        <div className="flex items-center gap-4 flex-wrap">
          {exam.examDurationMinutes && (
            <span className="flex items-center gap-1 text-xs text-default-500">
              <FontAwesomeIcon className="w-3 h-3 text-default-400" icon={faClock} />
              {t('certification.durationValue', { minutes: String(exam.examDurationMinutes) })}
            </span>
          )}
          {exam.passingScore != null && (
            <>
              {exam.examDurationMinutes && <Divider className="h-4 w-px bg-default-200" orientation="vertical" />}
              <span className="flex items-center gap-1 text-xs text-primary font-semibold">
                <FontAwesomeIcon className="w-3 h-3" icon={faBullseye} />
                {t('certification.passingScoreValue', { score: String(exam.passingScore) })}
              </span>
            </>
          )}
          {exam.poolQuestionCount > 0 && (
            <>
              <Divider className="h-4 w-px bg-default-200" orientation="vertical" />
              <span className="flex items-center gap-1 text-xs text-success">
                <FontAwesomeIcon className="w-3 h-3" icon={faDatabase} />
                {t('catalog.poolCount', { count: String(exam.poolQuestionCount) })}
              </span>
            </>
          )}
        </div>
        <Button
          isIconOnly
          aria-label={t('common.close')}
          className={buttonStyles.iconOnly.neutral}
          size="sm"
          variant="light"
          onPress={onClose}
        >
          <FontAwesomeIcon icon={faXmark} />
        </Button>
      </div>

      <div className="px-6 py-4">
        {exam.sections.length === 0 ? (
          <p className="text-xs text-default-400 italic">{t('exam.noSections')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exam.sections.map((section) => (
              <div
                key={section.id ?? section.name}
                className="bg-content2 border border-default-200 rounded-lg px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground">{section.name}</p>
                  <span className="flex items-center gap-1 text-xs text-default-400 shrink-0">
                    <FontAwesomeIcon className="w-2.5 h-2.5" icon={faLayerGroup} />
                    {section.minQuestions}–{section.maxQuestions}%
                  </span>
                </div>
                {section.topics && section.topics.length > 0 ? (
                  <ul className="mt-1.5 space-y-0.5">
                    {section.topics.map((topic) => (
                      <li
                        key={topic.id ?? topic.name}
                        className="text-xs text-default-500 pl-2 before:content-['·'] before:mr-1.5 before:text-default-300"
                      >
                        {topic.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-default-400 mt-0.5 italic">{t('exam.noTopics')}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

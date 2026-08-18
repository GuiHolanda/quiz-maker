'use client';
import { Fragment, useState } from 'react';
import NextLink from 'next/link';
import { faCalendar, faChevronDown, faChevronRight, faPen, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import type { Exam, ExamType } from '@/shared/types';
import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';

interface ExamDetailPanelProps {
  readonly exam: Exam;
  readonly type: ExamType;
  readonly onDelete: () => void;
  readonly onClose: () => void;
}

const TH = 'text-left font-mono text-xs text-default-400 px-3 py-2.5 border-b border-default-200';
const TD = 'px-3 py-2 border-b border-default-100';
const TD_LAST = 'px-3 py-2';

// Read-only since Fase 3: editing structure/topics now happens in the shared ExamEditor
// at /exams/[id]/edit, not row-by-row here — see plan §2.6.
export function ExamDetailPanel({ exam, type, onDelete, onClose }: ExamDetailPanelProps) {
  const { t } = useTranslation();
  const config = EXAM_CONFIG[type];
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const referenceEntity = type === 'certification' ? exam.provider : exam.examBoard;
  const sections = exam.sections;

  return (
    <div className="mt-4 bg-content1 border border-primary/40 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-default-200 bg-content2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">{exam.name}</span>
          {referenceEntity?.name && <span className="text-xs text-default-400 shrink-0">{referenceEntity.name}</span>}
          {exam.key && <span className="text-xs text-default-400 font-medium shrink-0">{exam.key}</span>}
          {config.hasYearField && exam.year != null && (
            <span className="flex items-center gap-1 text-xs text-default-400 shrink-0">
              <FontAwesomeIcon className="text-[9px]" icon={faCalendar} />
              {exam.year}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            as={NextLink}
            className={buttonStyles.flat}
            data-testid="exam-detail-edit-btn"
            href={`/exams/${exam.id}/edit`}
            size="sm"
            startContent={<FontAwesomeIcon className="text-xs" icon={faPen} />}
          >
            {t(config.editLabel)}
          </Button>
          <Button
            className={buttonStyles.dangerFlat}
            size="sm"
            startContent={<FontAwesomeIcon className="text-xs" icon={faTrash} />}
            onPress={onDelete}
          >
            {t(config.deleteTitle)}
          </Button>
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
      </div>

      <div className="p-5">
        {sections.length === 0 ? (
          <p className="text-xs text-default-400">{t(config.cardEmptyChipKey)}</p>
        ) : (
          <div className="w-full rounded-xl border border-default-200 overflow-hidden">
            <table className="w-full border-collapse">
              <thead className="bg-content2">
                <tr>
                  <th className={TH}>{t('exam.sectionName')}</th>
                  <th className={`${TH} w-28`}>{t('exam.minQuestions')}</th>
                  <th className={`${TH} w-28`}>{t('exam.maxQuestions')}</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section, si) => {
                  const key = section.id ?? section.name;
                  const isExpanded = !!expandedSections[key];
                  const isLast = si === sections.length - 1;
                  const topics = section.topics ?? [];
                  const tdClass = isLast && !isExpanded ? TD_LAST : TD;

                  return (
                    <Fragment key={key}>
                      <tr className="bg-content1">
                        <td className={tdClass}>
                          <div className="flex items-center gap-2">
                            {topics.length > 0 ? (
                              <button
                                aria-label={isExpanded ? t('common.collapse') : t('common.expand')}
                                className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-default-400 hover:text-primary hover:bg-default-100 transition-colors"
                                type="button"
                                onClick={() => setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))}
                              >
                                <FontAwesomeIcon
                                  className="w-2.5 h-2.5"
                                  icon={isExpanded ? faChevronDown : faChevronRight}
                                />
                              </button>
                            ) : (
                              <span className="w-5 shrink-0" />
                            )}
                            <span className="text-xs font-semibold text-foreground truncate">{section.name}</span>
                            {topics.length > 0 && (
                              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-default-100 text-default-500 whitespace-nowrap">
                                {topics.length} {t('exam.topics')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={tdClass}>
                          <span className="text-xs text-default-500">{section.minQuestions}%</span>
                        </td>
                        <td className={tdClass}>
                          <span className="text-xs text-default-500">{section.maxQuestions}%</span>
                        </td>
                      </tr>
                      {isExpanded &&
                        topics.map((topic, ti) => (
                          <tr key={`${key}-topic-${topic.id ?? ti}`} className="bg-content1">
                            <td className={isLast && ti === topics.length - 1 ? TD_LAST : TD} colSpan={3}>
                              <span className="text-xs text-default-500 pl-7 block">{topic.name}</span>
                            </td>
                          </tr>
                        ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

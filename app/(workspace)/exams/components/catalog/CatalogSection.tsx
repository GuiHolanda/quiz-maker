'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserPlus,
  faBullseye,
  faClock,
  faDatabase,
  faXmark,
  faLayerGroup,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';

import { ExamCard } from '../list/ExamCard';

import { getCatalogExams, forkCatalogExam } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { EntityListShell } from '@/shared/components/ui/EntityListShell';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { usePaginatedItems } from '@/features/hooks/usePaginatedItems.hook';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { notify } from '@/shared/lib/notify';
import type { CatalogExam, ExamType } from '@/shared/types';

interface CatalogSectionProps {
  readonly type: ExamType;
}

export function CatalogSection({ type }: CatalogSectionProps) {
  const { t } = useTranslation();
  const { addExam } = useExamsContext();
  const [templates, setTemplates] = useState<CatalogExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [forkingId, setForkingId] = useState<string | null>(null);

  const selectedExam = templates.find((e) => e.id === selectedId) ?? null;

  const { pageItems, page, totalPages, perPage, setPage, setPerPage } = usePaginatedItems(templates);

  useEffect(() => {
    getCatalogExams()
      .then((all) => setTemplates(all.filter((t) => t.type === type)))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [type]);

  async function handleFork(examId: string) {
    setForkingId(examId);
    try {
      const forked = await forkCatalogExam(examId);
      addExam(forked);
      setTemplates((prev) => prev.filter((t) => t.id !== examId));
      setSelectedId((prev) => (prev === examId ? null : prev));
      notify.success(t('catalog.forkSuccessTitle'), t('catalog.forkSuccessDescription'));
    } catch {
      notify.error(t('catalog.forkErrorTitle'));
    } finally {
      setForkingId(null);
    }
  }

  const titleKey = type === 'certification' ? 'catalog.sectionTitleCert' : 'catalog.sectionTitleConcurso';

  if (!isLoading && templates.length === 0) return null;

  return (
    <div className="mt-10" data-testid="catalog-section">
      <EntityListShell
        title={t(titleKey)}
        subtitle={t(type === 'certification' ? 'catalog.sectionSubtitleCert' : 'catalog.sectionSubtitleConcurso')}
        totalItems={isLoading ? undefined : templates.length}
        isLoading={isLoading}
        skeleton={<SkeletonListLoader count={3} height="h-36" />}
        pagination={
          totalPages > 1
            ? {
                currentPage: page,
                totalPages,
                totalItems: templates.length,
                itemsPerPage: perPage,
                onPageChange: setPage,
                onItemsPerPageChange: (e) => setPerPage(Number(e.target.value)),
              }
            : undefined
        }
      >
        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))' }}>
          {pageItems.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              footerAction={renderFooterAction(exam)}
              isSelected={selectedId === exam.id}
              type={exam.type}
              onClick={() => setSelectedId((prev) => (prev === exam.id ? null : exam.id))}
            />
          ))}
        </div>

        <AnimatePresence>
          {selectedExam && (
            <motion.div
              key={selectedExam.id}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4"
            >
              {renderDetailPanel(selectedExam)}
            </motion.div>
          )}
        </AnimatePresence>
      </EntityListShell>
    </div>
  );

  function renderFooterAction(exam: CatalogExam) {
    const isForking = forkingId === exam.id;
    const isSelected = selectedId === exam.id;
    return (
      <div className="flex items-center gap-2">
        {exam.poolQuestionCount > 0 && (
          <Chip color="success" size="sm" variant="flat">
            {t('catalog.poolCount', { count: String(exam.poolQuestionCount) })}
          </Chip>
        )}
        <Button
          className={buttonStyles.flat}
          size="sm"
          startContent={
            <FontAwesomeIcon
              className={`transition-transform duration-150 ${isSelected ? 'rotate-180' : ''}`}
              icon={faChevronDown}
            />
          }
          onPress={() => setSelectedId((prev) => (prev === exam.id ? null : exam.id))}
        >
          {t('common.viewDetails')}
        </Button>
        <Button
          className={buttonStyles.primarySm}
          isLoading={isForking}
          size="sm"
          startContent={!isForking ? <FontAwesomeIcon icon={faUserPlus} /> : undefined}
          onPress={() => handleFork(exam.id)}
        >
          {t('catalog.useTemplate')}
        </Button>
      </div>
    );
  }

  function renderDetailPanel(exam: CatalogExam) {
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
            onPress={() => setSelectedId(null)}
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
}

'use client';

import { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';
import {
  faBullseye,
  faClock,
  faHashtag,
  faLayerGroup,
  faPen,
  faPlus,
  faTrash,
  faXmark,
  faGraduationCap,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { EditExamModal } from '@/shared/components/EditExamModal/EditExamModal';
import type { EditExamModalCertResult } from '@/shared/components/EditExamModal/EditExamModal';
import { ExamSectionsTable, ExamSectionsTableHandle } from '@/shared/components/ExamSectionsTable/ExamSectionsTable';
import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { deleteExam } from '@/features/connectors';
import { Exam, ExamSection, ExamTopic } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';
import { buttonStyles } from '@/config/constants/buttonStyles';

export function CertificationsListTab() {
  const { t } = useTranslation();
  const { certifications, isLoading, updateExam, removeExam } = useExamsContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingCert, setEditingCert] = useState<Exam | null>(null);
  const [deletingCert, setDeletingCert] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const tableRef = useRef<ExamSectionsTableHandle | null>(null);

  const selectedCert = certifications.find((c) => c.id === selectedId) ?? null;

  const handleCardClick = useCallback((cert: Exam) => {
    setSelectedId((prev) => (prev === cert.id ? null : (cert.id ?? null)));
  }, []);

  const handleSectionUpdated = useCallback(
    (exam: Exam, sectionId: string, newName: string, minQuestions: number, maxQuestions: number) => {
      if (!exam.id) return;
      const updatedSections = exam.sections.map((section) =>
        section.id === sectionId ? { ...section, name: newName, minQuestions, maxQuestions } : section
      );
      updateExam(exam.id, { sections: updatedSections });
    },
    [updateExam]
  );

  const handleSectionRemoved = useCallback(
    (exam: Exam, sectionId: string) => {
      if (!exam.id) return;
      const updatedSections = exam.sections.filter((section) => section.id !== sectionId);
      updateExam(exam.id, { sections: updatedSections });
    },
    [updateExam]
  );

  const handleSectionAdded = useCallback(
    (exam: Exam, section: ExamSection) => {
      if (!exam.id) return;
      updateExam(exam.id, { sections: [...exam.sections, section] });
    },
    [updateExam]
  );

  const handleTopicAdded = useCallback(
    (exam: Exam, sectionId: string, topic: ExamTopic) => {
      if (!exam.id) return;
      const updatedSections = exam.sections.map((section) =>
        section.id === sectionId ? { ...section, topics: [...(section.topics ?? []), topic] } : section
      );
      updateExam(exam.id, { sections: updatedSections });
    },
    [updateExam]
  );

  const handleTopicRemoved = useCallback(
    (exam: Exam, sectionId: string, topicId: string) => {
      if (!exam.id) return;
      const updatedSections = exam.sections.map((section) =>
        section.id === sectionId
          ? { ...section, topics: (section.topics ?? []).filter((topic) => topic.id !== topicId) }
          : section
      );
      updateExam(exam.id, { sections: updatedSections });
    },
    [updateExam]
  );

  const handleTopicUpdated = useCallback(
    (exam: Exam, sectionId: string, topicId: string, newName: string) => {
      if (!exam.id) return;
      const updatedSections = exam.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              topics: (section.topics ?? []).map((topic) =>
                topic.id === topicId ? { ...topic, name: newName } : topic
              ),
            }
          : section
      );
      updateExam(exam.id, { sections: updatedSections });
    },
    [updateExam]
  );

  const handleCertSaved = useCallback(
    (id: string, updated: EditExamModalCertResult) => {
      updateExam(id, {
        name: updated.name,
        provider: updated.provider,
        totalQuestions: updated.totalQuestions,
        examDurationMinutes: updated.examDurationMinutes,
        passingScore: updated.passingScore,
      });
    },
    [updateExam]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingCert?.id) return;
    setIsDeleting(true);
    try {
      await deleteExam(deletingCert.id);
      removeExam(deletingCert.id);
      if (selectedId === deletingCert.id) setSelectedId(null);
      notify.success(t('toast.success'), t('certification.certificationDeleted', { name: deletingCert.name }));
      setDeletingCert(null);
    } catch {
      notify.error(t('toast.error'), t('certification.certificationDeleteError'));
    } finally {
      setIsDeleting(false);
    }
  }, [deletingCert, removeExam, selectedId, t]);

  if (isLoading) {
    return <SkeletonListLoader />;
  }

  if (certifications.length === 0) {
    return (
      <EmptyState
        action={{ label: t('certification.tabNew'), href: '?new=true' }}
        description={t('certification.noCertificationsDescription')}
        title={t('certification.noCertificationsTitle')}
      />
    );
  }

  return (
    <>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FontAwesomeIcon className="text-xs text-primary" icon={faGraduationCap} />
        </div>
        <h2 className="text-sm font-bold text-foreground">{t('certification.tabList')}</h2>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-content2 border border-default-200 text-xs font-medium text-default-500">
          {certifications.length}
        </span>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {certifications.map((cert) => renderCard(cert))}
      </div>

      <AnimatePresence>
        {selectedCert && (
          <motion.div
            key={selectedCert.id}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            initial={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderDetailPanel(selectedCert)}
          </motion.div>
        )}
      </AnimatePresence>

      <EditExamModal
        exam={editingCert}
        isOpen={editingCert !== null}
        onClose={() => setEditingCert(null)}
        onSaved={handleCertSaved}
      />

      <ConfirmModal
        body={
          <p className="text-sm text-default-500">
            {t('certification.deleteCertificationConfirm', { name: deletingCert?.name ?? '' })}
          </p>
        }
        confirmLabel={t('common.remove')}
        isLoading={isDeleting}
        isOpen={deletingCert !== null}
        title={t('certification.deleteCertificationTitle')}
        onClose={() => setDeletingCert(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );

  function renderCard(cert: Exam) {
    const isSelected = selectedId === cert.id;
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
        key={cert.id ?? cert.name}
        aria-expanded={isSelected}
        aria-label={cert.name}
        className={[
          'group text-left w-full bg-content1 border rounded-xl p-4 transition-all duration-150 hover:bg-content2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
          isSelected
            ? 'border-primary bg-content2 ring-1 ring-primary/20'
            : 'border-default-200 hover:border-default-300',
        ].join(' ')}
        type="button"
        onClick={() => handleCardClick(cert)}
      >
        <div className="flex items-start gap-3 mb-4">
          {renderProviderLogo(cert, initials)}
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
            <RelativeDate
              date={cert.updatedAt && cert.updatedAt !== cert.createdAt ? cert.updatedAt : cert.createdAt}
            />
          </div>
        )}
      </button>
    );
  }

  function renderProviderLogo(cert: Exam, initials: string | null) {
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

  function renderDetailPanel(cert: Exam) {
    return (
      <div className="mt-4 bg-content1 border border-primary/40 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-default-200 bg-content2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">{cert.name}</span>
            {cert.provider?.name && <span className="text-xs text-default-400 shrink-0">{cert.provider.name}</span>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              className={buttonStyles.flat}
              size="sm"
              startContent={<FontAwesomeIcon className="text-xs" icon={faPen} />}
              onPress={() => setEditingCert(cert)}
            >
              {t('certification.editCertification')}
            </Button>
            <Button
              className={buttonStyles.dangerFlat}
              size="sm"
              startContent={<FontAwesomeIcon className="text-xs" icon={faTrash} />}
              onPress={() => setDeletingCert(cert)}
            >
              {t('certification.deleteCertificationTitle')}
            </Button>
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
        </div>

        <div className="p-5">
          <ExamSectionsTable
            ref={tableRef}
            selectedExam={cert}
            sectionsList={cert.sections}
            onSectionAdded={(section) => handleSectionAdded(cert, section)}
            onSectionRemoved={(sectionId) => handleSectionRemoved(cert, sectionId)}
            onSectionUpdated={(sectionId, newName, min, max) =>
              handleSectionUpdated(cert, sectionId, newName, min, max)
            }
            onTopicAdded={(sectionId, topic) => handleTopicAdded(cert, sectionId, topic)}
            onTopicRemoved={(sectionId, topicId) => handleTopicRemoved(cert, sectionId, topicId)}
            onTopicUpdated={(sectionId, topicId, newName) => handleTopicUpdated(cert, sectionId, topicId, newName)}
          />

          <div className="mt-4 pt-3 border-t border-default-200 flex justify-start">
            <Button
              className={buttonStyles.primarySm}
              size="sm"
              startContent={<FontAwesomeIcon className="text-[10px]" icon={faPlus} />}
              onPress={() => tableRef.current?.startAdd()}
            >
              {t('certification.addTopic')}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

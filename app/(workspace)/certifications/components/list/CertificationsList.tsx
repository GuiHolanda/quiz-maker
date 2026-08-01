'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { CertificationCard } from './CertificationCard';
import { CertificationDetailPanel } from './CertificationDetailPanel';

import { ConfirmModal } from '@/shared/components/ui/ConfirmModal';
import { EditExamModal } from '@/shared/components/EditExamModal/EditExamModal';
import type { EditExamModalCertResult } from '@/shared/components/EditExamModal/EditExamModal';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { deleteExam } from '@/features/connectors';
import { Exam, ExamSection, ExamTopic } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { notify } from '@/shared/lib/notify';

export function CertificationsList() {
  const { t } = useTranslation();
  const { certifications, isLoading, updateExam, removeExam } = useExamsContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingCert, setEditingCert] = useState<Exam | null>(null);
  const [deletingCert, setDeletingCert] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        {certifications.map((cert) => (
          <CertificationCard
            key={cert.id ?? cert.name}
            cert={cert}
            isSelected={selectedId === cert.id}
            onClick={() => handleCardClick(cert)}
          />
        ))}
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
            <CertificationDetailPanel
              cert={selectedCert}
              onClose={() => setSelectedId(null)}
              onDelete={() => setDeletingCert(selectedCert)}
              onEdit={() => setEditingCert(selectedCert)}
              onSectionAdded={(section) => handleSectionAdded(selectedCert, section)}
              onSectionRemoved={(sectionId) => handleSectionRemoved(selectedCert, sectionId)}
              onSectionUpdated={(sectionId, newName, min, max) =>
                handleSectionUpdated(selectedCert, sectionId, newName, min, max)
              }
              onTopicAdded={(sectionId, topic) => handleTopicAdded(selectedCert, sectionId, topic)}
              onTopicRemoved={(sectionId, topicId) => handleTopicRemoved(selectedCert, sectionId, topicId)}
              onTopicUpdated={(sectionId, topicId, newName) =>
                handleTopicUpdated(selectedCert, sectionId, topicId, newName)
              }
            />
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
}

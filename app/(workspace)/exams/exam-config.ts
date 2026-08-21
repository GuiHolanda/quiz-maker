// app/(workspace)/exams/exam-config.ts
import { faGraduationCap, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { ExamType } from '@/shared/types';

export interface ExamTypeConfig {
  readonly draftStorageKey: string;
  readonly referenceEntityLabel: 'provider' | 'examBoard';
  readonly hasYearField: boolean;
  readonly hasRoleField: boolean;
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly tabNew: string;
  readonly step2SectionsTitle: string;
  readonly discardDraftTitle: string;
  readonly discardDraftBody: string;
  readonly discardDraftLabel: string;
  readonly listTitle: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly emptyActionLabel: string;
  readonly deleteTitle: string;
  readonly deleteConfirmKey: string;
  readonly deleteSuccessKey: string;
  readonly deleteErrorKey: string;
  readonly editLabel: string;
  readonly addSectionLabel: string;
  readonly cardEmptyChipKey: string;
  readonly icon: IconDefinition;
  readonly seedQuestionKey: string;
  readonly seedSearchActionKey: string;
}

export const EXAM_CONFIG: Record<ExamType, ExamTypeConfig> = {
  certification: {
    draftStorageKey: 'NEW_CERTIFICATION_DRAFT',
    referenceEntityLabel: 'provider',
    hasYearField: true,
    hasRoleField: false,
    pageTitle: 'certification.pageTitle',
    pageSubtitle: 'certification.pageSubtitle',
    tabNew: 'certification.tabNew',
    step2SectionsTitle: 'certification.studyDomains',
    discardDraftTitle: 'certification.discardDraftTitle',
    discardDraftBody: 'certification.discardDraftBody',
    discardDraftLabel: 'certification.discardDraft',
    listTitle: 'certification.tabList',
    emptyTitle: 'certification.noCertificationsTitle',
    emptyDescription: 'certification.noCertificationsDescription',
    emptyActionLabel: 'certification.tabNew',
    deleteTitle: 'certification.deleteCertificationTitle',
    deleteConfirmKey: 'certification.deleteCertificationConfirm',
    deleteSuccessKey: 'certification.certificationDeleted',
    deleteErrorKey: 'certification.certificationDeleteError',
    editLabel: 'certification.editCertification',
    addSectionLabel: 'certification.addTopic',
    cardEmptyChipKey: 'certification.noTopics',
    icon: faGraduationCap,
    seedQuestionKey: 'exam.aiSeedCertQuestion',
    seedSearchActionKey: 'exam.newSearchActionCert',
  },
  public_exam: {
    draftStorageKey: 'NEW_PUBLIC_EXAM_DRAFT',
    referenceEntityLabel: 'examBoard',
    hasYearField: true,
    hasRoleField: true,
    pageTitle: 'concurso.pageTitle',
    pageSubtitle: 'concurso.pageSubtitle',
    tabNew: 'concurso.tabNew',
    step2SectionsTitle: 'concurso.subjectsTitle',
    discardDraftTitle: 'concurso.discardDraftTitle',
    discardDraftBody: 'concurso.discardDraftBody',
    discardDraftLabel: 'concurso.discardDraft',
    listTitle: 'concurso.tabList',
    emptyTitle: 'concurso.noExamsTitle',
    emptyDescription: 'concurso.noExamsDescription',
    emptyActionLabel: 'concurso.tabNew',
    deleteTitle: 'concurso.deleteExamTitle',
    deleteConfirmKey: 'concurso.deleteExamConfirm',
    deleteSuccessKey: 'concurso.examDeleted',
    deleteErrorKey: 'concurso.examDeleteError',
    editLabel: 'concurso.editPublicExam',
    addSectionLabel: 'concurso.addSubject',
    cardEmptyChipKey: 'concurso.noSubjects',
    icon: faClipboardList,
    seedQuestionKey: 'exam.aiSeedPublicExamQuestion',
    seedSearchActionKey: 'exam.newSearchActionPublicExam',
  },
};

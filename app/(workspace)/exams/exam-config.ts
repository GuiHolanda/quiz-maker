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
  readonly step2SummaryTitle: string;
  readonly step2SectionsTitle: string;
  readonly step2AddBtn: string;
  readonly step2NoSections: string;
  readonly step2SectionNameLabel: string;
  readonly step2SectionNamePlaceholder: string;
  readonly step2MinLabel: string;
  readonly step2MaxLabel: string;
  readonly step2SystemLogic: string;
  readonly step2WeightageInfoBase: string;
  readonly step2MinGreaterThanMax: string;
  readonly step2FinalizeBtnLabel: string;
  readonly step3SectionsTitle: string;
  readonly step3SectionsCountKey: string;
  readonly step3StudyPathNote: string;
  readonly step3FinalizeBtn: string;
  readonly step3ReadyToDeploy: string;
  readonly discardDraftTitle: string;
  readonly discardDraftBody: string;
  readonly discardDraftLabel: string;
  readonly nextStepLabel: string;
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
  readonly showTopicsInSections: boolean;
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
    step2SummaryTitle: 'certification.certificationSummary',
    step2SectionsTitle: 'certification.studyDomains',
    step2AddBtn: 'certification.addDomain',
    step2NoSections: 'certification.noTopics',
    step2SectionNameLabel: 'certification.domainName',
    step2SectionNamePlaceholder: 'certification.topicNamePlaceholder',
    step2MinLabel: 'certification.minQuestions',
    step2MaxLabel: 'certification.maxQuestions',
    step2SystemLogic: 'certification.systemLogic',
    step2WeightageInfoBase: 'certification.weightageInfoBase',
    step2MinGreaterThanMax: 'certification.minGreaterThanMax',
    step2FinalizeBtnLabel: 'certification.finalizeCertification',
    step3SectionsTitle: 'certification.studyDomains',
    step3SectionsCountKey: 'certification.domainsCount',
    step3StudyPathNote: 'certification.studyPathNote',
    step3FinalizeBtn: 'certification.finalizeAndCreate',
    step3ReadyToDeploy: 'certification.readyToDeploy',
    discardDraftTitle: 'certification.discardDraftTitle',
    discardDraftBody: 'certification.discardDraftBody',
    discardDraftLabel: 'certification.discardDraft',
    nextStepLabel: 'certification.nextDefineTopics',
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
    showTopicsInSections: false,
  },
  public_exam: {
    draftStorageKey: 'NEW_PUBLIC_EXAM_DRAFT',
    referenceEntityLabel: 'examBoard',
    hasYearField: true,
    hasRoleField: true,
    pageTitle: 'concurso.pageTitle',
    pageSubtitle: 'concurso.pageSubtitle',
    tabNew: 'concurso.tabNew',
    step2SummaryTitle: 'concurso.publicExamSummary',
    step2SectionsTitle: 'concurso.subjectsTitle',
    step2AddBtn: 'concurso.addSubject',
    step2NoSections: 'concurso.noSubjects',
    step2SectionNameLabel: 'concurso.subjectName',
    step2SectionNamePlaceholder: 'concurso.subjectNamePlaceholder',
    step2MinLabel: 'concurso.minQuestions',
    step2MaxLabel: 'concurso.maxQuestions',
    step2SystemLogic: 'concurso.systemLogic',
    step2WeightageInfoBase: 'concurso.weightageInfoBase',
    step2MinGreaterThanMax: 'concurso.minGreaterThanMax',
    step2FinalizeBtnLabel: 'concurso.finalizePublicExam',
    step3SectionsTitle: 'concurso.subjectsTitle',
    step3SectionsCountKey: 'concurso.subjectsCount',
    step3StudyPathNote: 'concurso.studyPathNote',
    step3FinalizeBtn: 'concurso.finalizeAndCreate',
    step3ReadyToDeploy: 'concurso.readyToDeploy',
    discardDraftTitle: 'concurso.discardDraftTitle',
    discardDraftBody: 'concurso.discardDraftBody',
    discardDraftLabel: 'concurso.discardDraft',
    nextStepLabel: 'concurso.nextDefineSubjects',
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
    showTopicsInSections: true,
  },
};
